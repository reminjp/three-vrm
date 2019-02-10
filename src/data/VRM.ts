import * as THREE from 'three';
import { VRMShaderMaterial } from '../materials/VRMShaderMaterial';
import { VRMBlendShape } from './VRMBlendShapeMaster';
import { VRMFirstPerson } from './VRMFirstPerson';
import { VRMHumanoid } from './VRMHumanoid';
import { VRMMaterial } from './VRMMaterial';
import { VRMMeta } from './VRMMeta';
import { VRMSecondaryAnimation } from './VRMSecondaryAnimation';

type MeshMaterial =
  | THREE.MeshBasicMaterial
  | THREE.MeshLambertMaterial
  | THREE.MeshPhongMaterial
  | THREE.MeshDepthMaterial
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshNormalMaterial
  | THREE.MeshFaceMaterial
  | THREE.ShaderMaterial;

interface GLTF {
  scene: THREE.Scene;
  scenes: THREE.Scene[];
  cameras: THREE.Camera[];
  animations: THREE.AnimationClip[];
  asset: GLTFAsset;
  parser: any;
  userData: any;
}

export interface GLTFAsset {
  copyright?: string;
  generator?: string;
  version: string;
  minVersion?: string;
  extensions?: object;
  extras?: any;
}

export class VRM {
  public asset: GLTFAsset;
  public scene: THREE.Scene;
  public parser: any;
  public userData: any;

  public exporterVersion: string;
  public meta: VRMMeta;
  public humanoid: VRMHumanoid;
  public firstPerson: VRMFirstPerson;
  public blendShapeMaster: VRMBlendShape;
  public secondaryAnimation: VRMSecondaryAnimation;
  public materialProperties: VRMMaterial[];

  private nodes: THREE.Object3D[];
  private textures: THREE.Texture[];
  private meshes: THREE.Mesh[][];

  public async fromGLTF(gltf: GLTF) {
    this.asset = gltf.asset;
    this.scene = gltf.scene;
    this.parser = gltf.parser;
    this.userData = gltf.userData;

    if (!gltf.userData.gltfExtensions || !gltf.userData.gltfExtensions.VRM) {
      throw new Error('Loaded glTF is not a VRM model.');
    }

    this.exporterVersion = gltf.userData.gltfExtensions.VRM.exporterVersion;
    this.meta = gltf.userData.gltfExtensions.VRM.meta;
    this.humanoid = gltf.userData.gltfExtensions.VRM.humanoid;
    this.blendShapeMaster = gltf.userData.gltfExtensions.VRM.blendShapeMaster;
    this.firstPerson = gltf.userData.gltfExtensions.VRM.firstPerson;
    this.secondaryAnimation = gltf.userData.gltfExtensions.VRM.secondaryAnimation;
    this.materialProperties = gltf.userData.gltfExtensions.VRM.materialProperties;

    // Load all textures used in the model.
    {
      const textureIndices = new Set<number>();
      this.materialProperties.forEach(m => {
        Object.values(m.textureProperties).forEach(i => {
          textureIndices.add(i);
        });
      });
      const promises: Array<Promise<THREE.Texture>> = new Array(this.parser.json.textures.length);
      for (const i of textureIndices.values()) {
        promises[i] = this.parser.loadTexture(i);
      }
      this.textures = await Promise.all(promises);
    }

    // Convert materials.
    this.scene.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.Mesh) {
        const morphTargets =
          object3d.geometry instanceof THREE.BufferGeometry && !!object3d.geometry.morphAttributes.position;

        if (Array.isArray(object3d.material)) {
          for (let i = 0; i < object3d.material.length; ++i) {
            const property = this.materialProperties.find(
              p => p.name === (object3d.material as MeshMaterial[])[i].name
            );
            const material = new VRMShaderMaterial({ morphTargets, skinning: true });
            material.fromMaterialProperty(property, this.textures);
            object3d.material[i] = material;
          }
        } else {
          const property = this.materialProperties.find(p => p.name === (object3d.material as THREE.Material).name);
          const material = new VRMShaderMaterial({ morphTargets, skinning: true });
          material.fromMaterialProperty(property, this.textures);
          object3d.material = material;
        }
      }
    });

    // Create a node list.
    {
      const promises: Array<Promise<THREE.Object3D>> = new Array(this.parser.json.nodes.length);
      for (let i = 0; i < this.parser.json.nodes.length; ++i) {
        promises[i] = this.parser.loadNode(i);
      }
      this.nodes = (await Promise.all(promises)).map(object3d => this.scene.getObjectByName(object3d.name));
    }

    // Create a mesh list for morphing.
    this.meshes = this.parser.json.meshes.map((): THREE.Mesh[] => []);

    this.scene.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.Mesh) {
        // Flattened mesh node
        // https://github.com/mrdoob/three.js/issues/11944
        const node = this.parser.json.nodes.find((n: any) => n.name === object3d.name);
        if (node && node.mesh !== undefined) {
          this.meshes[node.mesh] = [object3d];
          return;
        }

        // Not flattened mesh node
        const i = object3d.name.lastIndexOf('_');
        const geometryIndex = i !== -1 ? Number(object3d.name.substr(i + 1)) : 0;
        const meshName = i !== -1 && !isNaN(geometryIndex) ? object3d.name.substr(0, i) : object3d.name;
        const meshIndex = this.parser.json.meshes.findIndex((e: any) => e.name === meshName);

        if (meshIndex !== -1) {
          this.meshes[meshIndex][geometryIndex] = object3d;
        }
      }
    });

    return this;
  }

  public getNode(index: number) {
    return this.nodes[index];
  }

  public setBlendShapeWeight(meshIndex: number, blendShapeIndex: number, value: number) {
    const primitives = this.meshes[meshIndex];
    primitives.forEach(primitive => {
      if (!primitive || !primitive.morphTargetInfluences) {
        // if (primitive) {
        //   console.warn(`Mesh '${primitive.name}' does not have morphTargetInfluences.`);
        // }
        return;
      }

      primitive.morphTargetInfluences[blendShapeIndex] = value;
    });
  }

  public setBlendShapeGroupWeight(index: number, value: number) {
    const blendShapeGroup = this.blendShapeMaster.blendShapeGroups[index];

    if (!blendShapeGroup) {
      return;
    }

    blendShapeGroup.binds.forEach(bind => {
      this.setBlendShapeWeight(bind.mesh, bind.index, value * (bind.weight / 100));
    });
  }
}

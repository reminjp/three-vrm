import * as THREE from 'three';
import { VRMShaderMaterial } from '../materials/VRMShaderMaterial';
import { VRMBlendShape } from './VRMBlendShapeMaster';
import { VRMFirstPerson } from './VRMFirstPerson';
import { VRMHumanoid } from './VRMHumanoid';
import { VRMMaterial } from './VRMMaterial';
import { VRMMeta } from './VRMMeta';
import { VRMSecondaryAnimation } from './VRMSecondaryAnimation';

class GLTF {
  public scene: THREE.Scene;
  public scenes: THREE.Scene[];
  public cameras: THREE.Camera[];
  public animations: THREE.AnimationClip[];
  public asset: Asset;
  public parser: any;
  public userData: any;
}

export class Asset {
  public copyright?: string;
  public generator?: string;
  public version: string;
  public minVersion?: string;
  public extensions?: object;
  public extras?: any;
}

export class VRM {
  public asset: Asset;
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
  private meshes: THREE.Mesh[][];

  constructor() {
    this.asset = new Asset();
    this.scene = new THREE.Scene();
    this.parser = {};
    this.userData = {};

    this.exporterVersion = '';
    this.meta = new VRMMeta();
    this.humanoid = new VRMHumanoid();
    this.blendShapeMaster = new VRMBlendShape();
    this.firstPerson = new VRMFirstPerson();
    this.secondaryAnimation = new VRMSecondaryAnimation();
    this.materialProperties = [];

    this.nodes = [];
    this.meshes = [];
  }

  public async fromGLTF(gltf: GLTF) {
    this.asset = gltf.asset;
    this.scene = gltf.scene;
    this.parser = gltf.parser;
    this.userData = gltf.userData;

    if (!gltf.userData.gltfExtensions || !gltf.userData.gltfExtensions.VRM) {
      throw new Error('Loaded glTF is not a VRM model.');
    }

    this.exporterVersion = gltf.userData.gltfExtensions.VRM.exporterVersion;

    this.meta = new VRMMeta();
    Object.assign(this.meta, gltf.userData.gltfExtensions.VRM.meta);

    this.humanoid = new VRMHumanoid();
    Object.assign(this.humanoid, gltf.userData.gltfExtensions.VRM.humanoid);

    this.blendShapeMaster = new VRMBlendShape();
    Object.assign(this.blendShapeMaster, gltf.userData.gltfExtensions.VRM.blendShapeMaster);

    this.firstPerson = new VRMFirstPerson();
    Object.assign(this.firstPerson, gltf.userData.gltfExtensions.VRM.firstPerson);

    this.secondaryAnimation = new VRMSecondaryAnimation();
    Object.assign(this.secondaryAnimation, gltf.userData.gltfExtensions.VRM.secondaryAnimation);

    this.materialProperties = [];
    for (const object of gltf.userData.gltfExtensions.VRM.materialProperties) {
      const property = new VRMMaterial();
      await property.fromObject(object, this.parser);
      this.materialProperties.push(property);
    }

    // Convert materials.
    this.scene.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.Mesh) {
        const morphTargets =
          object3d.geometry instanceof THREE.BufferGeometry && !!object3d.geometry.morphAttributes.position;

        if (Array.isArray(object3d.material)) {
          for (let i = 0; i < object3d.material.length; ++i) {
            const property = this.materialProperties.find(
              p => p.name === (object3d.material as THREE.MeshMaterialType[])[i].name
            );
            const material = new VRMShaderMaterial({ morphTargets, skinning: true });
            material.fromMaterialProperty(property);
            object3d.material[i] = material;
          }
        } else {
          const property = this.materialProperties.find(p => p.name === (object3d.material as THREE.Material).name);
          const material = new VRMShaderMaterial({ morphTargets, skinning: true });
          material.fromMaterialProperty(property);
          object3d.material = material;
        }
      }
    });

    // Create a node list.
    this.nodes.length = this.parser.json.nodes.length;

    for (let i = 0; i < this.parser.json.nodes.length; ++i) {
      const object3d = await this.parser.loadNode(i);
      this.nodes[i] = this.scene.getObjectByName(object3d.name);
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

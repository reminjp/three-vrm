import * as THREE from 'three';
import { VRMShaderMaterial } from '../materials/VRMShaderMaterial';
import { VRMBlendShape } from './VRMBlendShapeMaster';
import { VRMFirstPerson } from './VRMFirstPerson';
import { VRMHumanBoneName, VRMHumanoid } from './VRMHumanoid';
import { VRMMaterial } from './VRMMaterial';
import { VRMMeta } from './VRMMeta';
import { VRMSecondaryAnimation } from './VRMSecondaryAnimation';

export const USERDATA_KEY_VRM = 'VRM';

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
  public model: THREE.Object3D;
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
    this.model = gltf.scene;
    this.model.type = 'Object3D';
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

    this.model.name = this.meta.title;

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
    const findMaterialProperty = (material: THREE.Material): VRMMaterial => {
      const ps = this.materialProperties.filter(p => p.name === material.name);
      if (ps.length === 1) {
        return ps[0];
      }
      // TODO: Implement strict comparison if possible.
      return (
        ps.find(p => {
          const a = p.vectorProperties._Color;
          const c = (material as any).color as THREE.Color;
          return a && c && a[0] === c.r && a[1] === c.g && a[2] === c.b;
        }) || ps[0]
      );
    };
    this.model.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.Mesh) {
        const morphTargets =
          object3d.geometry instanceof THREE.BufferGeometry && !!object3d.geometry.morphAttributes.position;

        if (Array.isArray(object3d.material)) {
          for (let i = 0; i < object3d.material.length; ++i) {
            const property = findMaterialProperty((object3d.material as MeshMaterial[])[i]);
            const material = new VRMShaderMaterial({ morphTargets, skinning: true });
            material.fromMaterialProperty(property, this.textures);
            object3d.material[i] = material;
          }
        } else {
          const property = findMaterialProperty(object3d.material);
          const material = new VRMShaderMaterial({ morphTargets, skinning: true });
          material.fromMaterialProperty(property, this.textures);
          object3d.material = material;
        }
      }
    });

    // Store initial state of objects.
    this.model.traverse((object3d: THREE.Object3D) => {
      object3d.userData[USERDATA_KEY_VRM] = {};

      object3d.userData[USERDATA_KEY_VRM].default = {
        position: object3d.position.clone(),
        quaternion: object3d.quaternion.clone(),
      };

      let childPosition;
      if (object3d.children.length) {
        childPosition = object3d.children[0].position.clone();
        const scale = object3d.children[0].getWorldScale(new THREE.Vector3());
        childPosition.x *= scale.x;
        childPosition.y *= scale.y;
        childPosition.z *= scale.z;
      } else if (object3d.parent) {
        const position = object3d
          .getWorldPosition(new THREE.Vector3())
          .sub(object3d.parent.getWorldPosition(new THREE.Vector3()))
          .normalize()
          .multiplyScalar(0.07)
          .add(object3d.getWorldPosition(new THREE.Vector3()));
        childPosition = object3d.worldToLocal(position);
      } else {
        childPosition = new THREE.Vector3(0, 1, 0);
      }
      object3d.userData[USERDATA_KEY_VRM].bone = {
        length: childPosition.length(),
        axis: childPosition.normalize(),
      };
    });

    // Create a node list.
    {
      const promises: Array<Promise<THREE.Object3D>> = new Array(this.parser.json.nodes.length);
      for (let i = 0; i < this.parser.json.nodes.length; ++i) {
        promises[i] = this.parser.loadNode(i);
      }
      this.nodes = (await Promise.all(promises)).map(object3d => this.model.getObjectByName(object3d.name));
    }

    // Create a mesh list for morphing.
    this.meshes = this.parser.json.meshes.map((): THREE.Mesh[] => []);

    this.model.traverse((object3d: THREE.Object3D) => {
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

    // Check the type of objects in humanBones.
    this.humanoid.humanBones.forEach(humanBone => {
      const object3d = this.getNode(humanBone.node);
      if (object3d.type !== 'Bone') {
        console.warn(`HumanBone '${humanBone.bone}' is not a Bone.`, object3d);
      }
    });

    return this;
  }

  public getNode(index: number) {
    return this.nodes[index];
  }

  public getNodeByHumanBoneName(humanBoneName: VRMHumanBoneName) {
    const humanBone = this.getHumanBone(humanBoneName);
    return humanBone && this.getNode(humanBone.node);
  }

  public getSubMeshesByIndex(index: number) {
    return this.meshes[index];
  }

  public getHumanBone(humanBoneName: VRMHumanBoneName) {
    return this.humanoid.humanBones.find(e => humanBoneName === e.bone);
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

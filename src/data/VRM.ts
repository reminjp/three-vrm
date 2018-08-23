import * as THREE from 'three';
import { UnityShaderMaterial } from '../materials/UnityShaderMaterial';
import { BlendShapeMaster } from './BlendShapeMaster';
import { FirstPerson } from './FirstPerson';
import { Humanoid } from './Humanoid';
import { MaterialProperty } from './MaterialProperty';
import { Meta } from './Meta';
import { SecondaryAnimation } from './SecondaryAnimation';

export class GLTF {
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

  public materialProperties: MaterialProperty[];
  public humanoid: Humanoid;
  public meta: Meta;
  public blendShapeMaster: BlendShapeMaster;
  public firstPerson: FirstPerson;
  public secondaryAnimation: SecondaryAnimation;

  private meshes: THREE.Mesh[][];
  private blendShapeWeights: number[];

  constructor() {
    this.asset = new Asset();
    this.scene = new THREE.Scene();
    this.parser = {};
    this.userData = {};

    this.materialProperties = [];
    this.humanoid = new Humanoid();
    this.meta = new Meta();
    this.blendShapeMaster = new BlendShapeMaster();
    this.firstPerson = new FirstPerson();
    this.secondaryAnimation = new SecondaryAnimation();

    this.meshes = [];
    this.blendShapeWeights = [];
  }

  public async fromGLTF(gltf: GLTF) {
    this.asset = gltf.asset;
    this.scene = gltf.scene;
    this.parser = gltf.parser;
    this.userData = gltf.userData;

    this.materialProperties = [];
    for (const object of gltf.userData.gltfExtensions.VRM.materialProperties) {
      const property = new MaterialProperty();
      await property.fromObject(object, this.parser);
      this.materialProperties.push(property);
    }

    this.humanoid = new Humanoid();
    Object.assign(this.humanoid, gltf.userData.gltfExtensions.VRM.humanoid);

    this.meta = new Meta();
    Object.assign(this.meta, gltf.userData.gltfExtensions.VRM.meta);

    this.blendShapeMaster = new BlendShapeMaster();
    Object.assign(this.blendShapeMaster, gltf.userData.gltfExtensions.VRM.blendShapeMaster);

    this.firstPerson = new FirstPerson();
    Object.assign(this.firstPerson, gltf.userData.gltfExtensions.VRM.firstPerson);

    this.secondaryAnimation = new SecondaryAnimation();
    Object.assign(this.secondaryAnimation, gltf.userData.gltfExtensions.VRM.secondaryAnimation);

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
            const material = new UnityShaderMaterial({ morphTargets, skinning: true });
            material.fromMaterialProperty(property);
            object3d.material[i] = material;
          }
        } else {
          const property = this.materialProperties.find(p => p.name === (object3d.material as THREE.Material).name);
          const material = new UnityShaderMaterial({ morphTargets, skinning: true });
          material.fromMaterialProperty(property);
          object3d.material = material;
        }
      }
    });

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

    this.blendShapeWeights = new Array(this.blendShapeMaster.blendShapeGroups.length).fill(0);

    return this;
  }

  public getBlendShapeWeight(index: number) {
    return this.blendShapeWeights[index];
  }

  public setBlendShapeWeight(index: number, value: number) {
    const blendShapeGroup = this.blendShapeMaster.blendShapeGroups[index];

    if (!blendShapeGroup) {
      return;
    }

    blendShapeGroup.binds.forEach(bind => {
      this.meshes[bind.mesh].forEach(mesh => {
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[bind.index] = value * (bind.weight / 100);
        }
      });
    });

    this.blendShapeWeights[index] = value;
  }
}

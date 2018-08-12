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

    this.scene.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.Mesh) {
        if (Array.isArray(object3d.material)) {
          for (let i = 0; i < object3d.material.length; ++i) {
            const property = this.materialProperties.find(
              p => p.name === (object3d.material as THREE.MeshMaterialType[])[i].name
            );
            const material = new UnityShaderMaterial({ skinning: true });
            material.fromMaterialProperty(property);
            object3d.material[i] = material;
          }
        } else {
          const property = this.materialProperties.find(p => p.name === (object3d.material as THREE.Material).name);
          const material = new UnityShaderMaterial({ skinning: true });
          material.fromMaterialProperty(property);
          object3d.material = material;
        }
      }
    });

    return this;
  }
}

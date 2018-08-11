import * as THREE from 'three';
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

    this.materialProperties = gltf.userData.gltfExtensions.VRM.materialProperties.map((object: any) => {
      const property = new MaterialProperty();
      Object.assign(property, object);
      return property;
    });

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

    const object3ds: THREE.Object3D[] = [];
    this.scene.traverse((object3d: THREE.Object3D) => {
      object3ds.push(object3d);
    });

    for (const object3d of object3ds) {
      if (object3d instanceof THREE.Mesh) {
        if (Array.isArray(object3d.material)) {
          for (let i = 0; i < object3d.material.length; ++i) {
            const index = this.materialProperties.findIndex(
              p => p.name === (object3d.material as THREE.MeshMaterialType[])[i].name
            );
            object3d.material[i] = await this.loadMaterial(index);
          }
        } else {
          const index = this.materialProperties.findIndex(p => p.name === (object3d.material as THREE.Material).name);
          console.log(object3d.material);
          object3d.material = await this.loadMaterial(index);
          console.log(object3d.material);
        }
      }
    }

    return this;
  }

  public async loadMaterial(index: number) {
    const property = this.materialProperties[index];

    const name = property.name;

    const mapIndex = property.textureProperties._MainTex;
    const bumpMapIndex = property.textureProperties._BumpMap;
    const emissiveMapIndex = property.textureProperties._EmissionMap;

    const map = mapIndex !== undefined ? await this.parser.loadTexture(mapIndex) : undefined;
    const bumpMap = bumpMapIndex !== undefined ? await this.parser.loadTexture(bumpMapIndex) : undefined;
    const emissiveMap = emissiveMapIndex !== undefined ? await this.parser.loadTexture(emissiveMapIndex) : undefined;

    if (map) {
      map.encoding = THREE.sRGBEncoding;
    }
    if (emissiveMap) {
      emissiveMap.encoding = THREE.sRGBEncoding;
    }

    const color = new THREE.Color();
    if (property.vectorProperties._Color) {
      color.fromArray(property.vectorProperties._Color);
    }

    const alphaTest = property.floatProperties._Cutoff;

    if (property.shader === 'VRM/UnlitTexture') {
      return new THREE.MeshBasicMaterial({
        name,
        color,
        map,
        skinning: true,
      });
    }

    if (property.shader === 'VRM/UnlitCutout') {
      return new THREE.MeshBasicMaterial({
        name,
        color,
        map,
        alphaTest,
        skinning: true,
      });
    }

    if (property.shader === 'VRM/UnlitTransparent') {
      return new THREE.MeshBasicMaterial({
        name,
        color,
        map,
        // depthTest: false,
        transparent: true,
        skinning: true,
      });
    }

    if (property.shader === 'VRM/UnlitTransparentZWrite') {
      return new THREE.MeshBasicMaterial({
        name,
        color,
        map,
        transparent: true,
        skinning: true,
      });
    }

    if (property.shader === 'VRM/MToon') {
      // MeshToonMaterial is not defined in @types/three.
      return new (THREE as any).MeshToonMaterial({
        name,
        color,
        map,
        bumpMap,
        emissiveMap,
        lights: true,
        shininess: 0,
        transparent: property.tagMap.RenderType === 'Transparent',
        alphaTest: property.tagMap.RenderType === 'Cutout' ? alphaTest : 0,
        skinning: true,
      }) as THREE.MeshPhongMaterial;
    }

    console.warn(`Unknown shader: ${property.shader}`);

    return new THREE.MeshBasicMaterial({
      name,
      color,
      map,
      skinning: true,
    });
  }
}

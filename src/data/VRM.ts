import * as THREE from 'three';
import { BlendShapeMaster } from './BlendShapeMaster';
import { FirstPerson } from './FirstPerson';
import { Asset, GLTF } from './GLTF';
import { Humanoid } from './Humanoid';
import { MaterialProperty } from './MaterialProperty';
import { Meta } from './Meta';
import { SecondaryAnimation } from './SecondaryAnimation';

export class VRM implements GLTF {
  // GLTF
  public scene: THREE.Scene;
  public scenes: THREE.Scene[];
  public cameras: THREE.Camera[];
  public animations: THREE.AnimationClip[];
  public asset: Asset;
  public parser: any;
  public userData: any;

  // VRM extensions
  public materialProperties: MaterialProperty[];
  public humanoid: Humanoid;
  public meta: Meta;
  public blendShapeMaster: BlendShapeMaster;
  public firstPerson: FirstPerson;
  public secondaryAnimation: SecondaryAnimation;

  public nodes: THREE.Object3D[];

  constructor(gltf: GLTF) {
    this.scene = gltf.scene;
    this.scenes = gltf.scenes;
    this.cameras = gltf.cameras;
    this.animations = gltf.animations;
    this.asset = gltf.asset;
    this.parser = gltf.parser;
    this.userData = gltf.userData;

    this.materialProperties = gltf.userData.gltfExtensions.VRM.materialProperties as MaterialProperty[];
    this.humanoid = new Humanoid();
    Object.assign(this.humanoid, gltf.userData.gltfExtensions.VRM.humanoid);
    this.meta = gltf.userData.gltfExtensions.VRM.meta as Meta;
    this.blendShapeMaster = gltf.userData.gltfExtensions.VRM.blendShapeMaster as BlendShapeMaster;
    this.firstPerson = gltf.userData.gltfExtensions.VRM.firstPerson as FirstPerson;
    this.secondaryAnimation = gltf.userData.gltfExtensions.VRM.secondaryAnimation as SecondaryAnimation;

    const namedObjects: Map<string, THREE.Object3D> = new Map();
    this.scene.traverse((object: THREE.Object3D) => {
      namedObjects.set(object.name, object);
    });
    this.nodes = this.parser.json.nodes.map((node: any) => namedObjects.get(node.name));
  }
}

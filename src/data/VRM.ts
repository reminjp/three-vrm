import * as THREE from 'three';
import { BlendShapeMaster } from './BlendShapeMaster';
import { FirstPerson } from './FirstPerson';
import { Humanoid } from './Humanoid';
import { MaterialProperty } from './MaterialProperty';
import { Meta } from './Meta';
import { SecondaryAnimation } from './SecondaryAnimation';

export class VRM {
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

  public nodes: Node[];
}

export class Asset {
  public copyright?: string;
  public generator?: string;
  public version: string;
  public minVersion?: string;
  public extensions?: object;
  public extras?: any;
}

export class Node {
  public name?: string;
  public children?: number[];
  public object3d?: THREE.Object3D;
}

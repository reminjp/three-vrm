import * as THREE from 'three';

export interface GLTF {
  scene: THREE.Scene;
  scenes: THREE.Scene[];
  cameras: THREE.Camera[];
  animations: THREE.AnimationClip[];
  asset: Asset;
  parser: any;
  userData: any;
}

export class Asset {
  public copyright?: string;
  public generator?: string;
  public version: string;
  public minVersion?: string;
  public extensions?: object;
  public extras?: any;
}

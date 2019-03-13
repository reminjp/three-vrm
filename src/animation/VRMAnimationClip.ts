import * as THREE from 'three';

export class VRMAnimationClip {
  public clips: Array<{ clip: THREE.AnimationClip; root: THREE.Object3D }>;
  public ikSkinnedMesh: THREE.SkinnedMesh;

  constructor() {
    this.clips = [];
  }
}

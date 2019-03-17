import * as THREE from 'three';

export class VRMAnimationClip {
  public clips: Array<{ clip: THREE.AnimationClip; root: THREE.Object3D }>;

  constructor() {
    this.clips = [];
  }
}

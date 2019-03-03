import * as THREE from 'three';
import { VRM } from '../data';
import { VRMAnimationClip } from './';

export class VRMAnimationMixer {
  public vrm: VRM;
  public mixer: THREE.AnimationMixer;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.mixer = new THREE.AnimationMixer(this.vrm.model);
  }

  public clipAction(vrmAnimationClip: VRMAnimationClip): THREE.AnimationAction[] {
    const actions: THREE.AnimationAction[] = [];
    vrmAnimationClip.clips.forEach(clip => {
      actions.push(this.mixer.clipAction(clip.clip, clip.root));
    });
    return actions;
  }

  public stopAllAction(): VRMAnimationMixer {
    this.mixer.stopAllAction();
    return this;
  }

  public update(deltaTime: number): VRMAnimationMixer {
    this.mixer.update(deltaTime);
    return this;
  }
}

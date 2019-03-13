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

    // Debug
    // vrmAnimationClip.ikSkinnedMesh.skeleton.bones.forEach(bone => {
    //   const geometry = new THREE.SphereGeometry(0.02, 8, 8);
    //   const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    //   const sphere = new THREE.Mesh(geometry, material);
    //   bone.add(sphere);
    // });
    // this.vrm.model.add(vrmAnimationClip.ikSkinnedMesh);

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

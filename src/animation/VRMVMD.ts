import * as THREE from 'three';
import { VRMHumanoidUtils } from '../animation';
import { VRM, VRMHumanBoneName } from '../data';
import { VRMAnimationClip } from './VRMAnimationClip';

export class VRMVMD {
  private motionsMap: Map<VRMHumanBoneName, VRMVMDMotion[]>;
  private morphs: any[];

  constructor(vmd: any) {
    console.log(vmd);

    // Motions
    // Convert rotations for T-pose.
    const front = new THREE.Vector3(0, 0, -1);
    const rotationOffsets = new Map<VRMHumanBoneName, THREE.Quaternion>([
      ['leftShoulder', new THREE.Quaternion().setFromAxisAngle(front, (-5 / 180) * Math.PI)],
      ['rightShoulder', new THREE.Quaternion().setFromAxisAngle(front, (5 / 180) * Math.PI)],
      ['leftUpperArm', new THREE.Quaternion().setFromAxisAngle(front, (-35 / 180) * Math.PI)],
      ['rightUpperArm', new THREE.Quaternion().setFromAxisAngle(front, (35 / 180) * Math.PI)],
    ]);

    const motions: VRMVMDMotion[] = vmd.motions.map((e: any) => {
      const motion = new VRMVMDMotion();
      motion.humanBoneName = VRMHumanoidUtils.stringToHumanBoneName(e.boneName);
      // 30 fps
      motion.time = e.frameNum / 30;
      // 1 unit length in VMD = 0.08 m
      motion.position = new THREE.Vector3(-e.position[0], e.position[1], e.position[2]).multiplyScalar(0.08);
      motion.rotation = new THREE.Quaternion(-e.rotation[0], e.rotation[1], e.rotation[2], -e.rotation[3]);
      if (rotationOffsets.has(motion.humanBoneName)) {
        motion.rotation.multiply(rotationOffsets.get(motion.humanBoneName));
      }

      motion.interpolation = e.interpolation;
      return motion;
    });
    motions.sort((a, b) => {
      return a.time - b.time;
    });
    this.motionsMap = new Map();
    motions.forEach(motion => {
      if (!this.motionsMap.has(motion.humanBoneName)) {
        this.motionsMap.set(motion.humanBoneName, []);
      }
      this.motionsMap.get(motion.humanBoneName).push(motion);
    });

    // Morphs
    this.morphs = vmd.morphs.map((e: any) => {
      const morph = new VRMVMDMorph();
      // 30 fps
      morph.time = e.frameNum / 30;
      morph.weight = e.weight;
      return morph;
    });
    this.morphs.sort((a, b) => {
      return a.time - b.time;
    });
  }

  public toAnimationClip(vrm: VRM): VRMAnimationClip {
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    vrm.model.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.SkinnedMesh) {
        skinnedMeshes.push(object3d);
      }
    });

    const humanBoneNameToBone = new Map<VRMHumanBoneName, THREE.Object3D>();
    const humanBoneNameToRootObject = new Map<VRMHumanBoneName, THREE.SkinnedMesh>();
    vrm.humanoid.humanBones.forEach(humanBone => {
      const bone = vrm.getNode(humanBone.node);
      if (bone.type !== 'Bone') {
        return;
      }
      humanBoneNameToBone.set(humanBone.bone, bone);
      humanBoneNameToRootObject.set(
        humanBone.bone,
        skinnedMeshes.find(m => m.skeleton.bones.findIndex(e => e.name === bone.name) !== -1)
      );
    });

    const tracksMap = new Map<THREE.SkinnedMesh, THREE.KeyframeTrack[]>();
    this.motionsMap.forEach((motions, humanBoneName) => {
      const bone = humanBoneNameToBone.get(humanBoneName);
      const root = humanBoneNameToRootObject.get(humanBoneName);
      if (bone === undefined) {
        return;
      }
      if (!tracksMap.has(root)) {
        tracksMap.set(root, []);
      }

      // Inspired by https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/MMDLoader.js
      const times: number[] = [];
      const positions: number[] = [];
      const rotations: number[] = [];
      // const positionInterpolations: number[] = [];
      // const rotationInterpolations: number[] = [];

      motions.forEach(motion => {
        times.push(motion.time);
        const p = motion.position.clone().add(bone.position);
        positions.push(p.x, p.y, p.z);
        const r = motion.rotation;
        rotations.push(r.x, r.y, r.z, r.w);

        // Control points of cubic Bézier curve.
        // cf. http://atupdate.web.fc2.com/vmd_format.htm
        // for (let i = 0; i < 3; i++) {
        //   positionInterpolations.push(
        //     motion.interpolation[i + 0] / 127, // time1
        //     motion.interpolation[i + 8] / 127, // value1
        //     motion.interpolation[i + 4] / 127, // time2
        //     motion.interpolation[i + 12] / 127 // value2
        //   );
        // }
        // rotationInterpolations.push(
        //   motion.interpolation[3 + 0] / 127,
        //   motion.interpolation[3 + 8] / 127,
        //   motion.interpolation[3 + 4] / 127,
        //   motion.interpolation[3 + 12] / 127
        // );
      });

      if (times.length === 0) {
        return;
      }

      // TODO: Use interpolations.
      tracksMap.get(root).push(new THREE.VectorKeyframeTrack(`.bones[${bone.name}].position`, times, positions));
      tracksMap.get(root).push(new THREE.QuaternionKeyframeTrack(`.bones[${bone.name}].quaternion`, times, rotations));
    });

    const vrmAnimationClip = new VRMAnimationClip();
    tracksMap.forEach((tracks, root) => {
      vrmAnimationClip.clips.push({ clip: new THREE.AnimationClip(THREE.Math.generateUUID(), -1, tracks), root });
    });
    return vrmAnimationClip;
  }
}

class VRMVMDMotion {
  public boneName: string;
  public humanBoneName: VRMHumanBoneName;
  public time: number;
  public position: THREE.Vector3;
  public rotation: THREE.Quaternion;
  public interpolation: number[];
}

class VRMVMDMorph {
  public time: number;
  public weight: number;
}

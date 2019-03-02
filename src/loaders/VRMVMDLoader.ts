import * as MMDParser from 'mmd-parser';
import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '../data';
import { VRMHumanoidUtils } from './VRMHumanoidUtils';

export class VRMVMDLoader {
  private fileLoader: THREE.FileLoader;

  constructor(manager?: THREE.LoadingManager) {
    this.fileLoader = new THREE.FileLoader(manager);
  }

  public load(
    url: string,
    onLoad?: (vmd: VRMVMD) => void,
    onProgress?: (request: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void {
    this.fileLoader.setResponseType('arraybuffer');
    this.fileLoader.load(
      url,
      buffer => {
        const mmdParser = new MMDParser.Parser();
        const object = mmdParser.parseVmd(buffer);
        // Debug
        console.log('VMD', object);
        onLoad(new VRMVMD(object));
      },
      onProgress,
      onError
    );
  }
}

export class VRMVMD {
  private motions: VRMVMDMotion[];

  constructor(vmd: any) {
    // Convert rotations for T-pose.
    const front = new THREE.Vector3(0, 0, -1);
    const rotationOffsets = new Map<VRMHumanBoneName, THREE.Quaternion>([
      ['leftUpperArm', new THREE.Quaternion().setFromAxisAngle(front, (40 / 180) * -Math.PI)],
      ['rightUpperArm', new THREE.Quaternion().setFromAxisAngle(front, (40 / 180) * Math.PI)],
    ]);

    this.motions = vmd.motions.map((e: any) => {
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
    this.motions.sort((a, b) => {
      return a.time - b.time;
    });
  }

  public toAnimationClip(vrm: VRM): THREE.AnimationClip {
    // Inspired by https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/MMDLoader.js
    const motionsMap = new Map<number, VRMVMDMotion[]>();
    this.motions.forEach(motion => {
      const humanBone = motion.humanBoneName && vrm.humanoid.humanBones.find(e => motion.humanBoneName === e.bone);
      if (humanBone === undefined) {
        return;
      }
      if (!motionsMap.has(humanBone.node)) {
        motionsMap.set(humanBone.node, []);
      }
      motionsMap.get(humanBone.node).push(motion);
    });
    motionsMap.forEach(array => {
      array.sort((a: any, b: any) => {
        return a.frameNum - b.frameNum;
      });
    });

    const tracks: THREE.KeyframeTrack[] = [];
    motionsMap.forEach((motions, nodeIndex) => {
      const bone = vrm.getNode(nodeIndex);

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

        // for (let i = 0; i < 3; i++) {
        //   positionInterpolations.push(
        //     motion.interpolation[i + 0] / 127,
        //     motion.interpolation[i + 8] / 127,
        //     motion.interpolation[i + 4] / 127,
        //     motion.interpolation[i + 12] / 127
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
      tracks.push(new THREE.VectorKeyframeTrack(`.bones[${bone.name}].position`, times, positions));
      tracks.push(new THREE.QuaternionKeyframeTrack(`.bones[${bone.name}].quaternion`, times, rotations));
    });

    return new THREE.AnimationClip(THREE.Math.generateUUID(), -1, tracks);
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

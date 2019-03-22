import * as THREE from 'three';
import { PMDSemiStandardBoneName, PMDStandardBoneName, USERDATA_KEY_VRM, VRM, VRMHumanBoneName } from '../data';
import { createCreateInterpolant } from '../vendor/three/examples/CubicBezierInterpolation';

export class VMD {
  public metadata: VMDMetadata;
  public motions: VMDMotion[];
  public morphs: VMDMorph[];
  public cameras: VMDCamera[];

  constructor() {
    this.metadata = {
      magic: '',
      name: '',
      coordinateSystem: 'right',
      motionCount: 0,
      morphCount: 0,
      cameraCount: 0,
    };
    this.motions = [];
    this.morphs = [];
    this.cameras = [];
  }

  public fromObject(object: any): VMD {
    Object.assign(this, object);
    return this;
  }

  public toAnimationClipForVRM(vrm: VRM): THREE.AnimationClip {
    const motionsMap = new Map<string, VMDMotion[]>();
    this.motions.forEach(motion => {
      if (!motionsMap.has(motion.boneName)) {
        motionsMap.set(motion.boneName, [motion]);
        return;
      }
      motionsMap.get(motion.boneName).push(motion);
    });
    motionsMap.forEach(motions => {
      motions.sort((a, b) => {
        return a.frameNum - b.frameNum;
      });
    });

    const morphsMap = new Map<string, VMDMorph[]>();
    this.morphs.forEach(morph => {
      if (!morphsMap.has(morph.morphName)) {
        morphsMap.set(morph.morphName, [morph]);
        return;
      }
      morphsMap.get(morph.morphName).push(morph);
    });
    morphsMap.forEach(morphs => {
      morphs.sort((a, b) => {
        return a.frameNum - b.frameNum;
      });
    });

    const tracks: THREE.KeyframeTrack[] = [];

    // Convert rotations for T-pose.
    const front = new THREE.Vector3(0, 0, -1);
    const rotationOffsets = new Map<VRMHumanBoneName, THREE.Quaternion>([
      [VRMHumanBoneName.LeftShoulder, new THREE.Quaternion().setFromAxisAngle(front, (-5 / 180) * Math.PI)],
      [VRMHumanBoneName.RightShoulder, new THREE.Quaternion().setFromAxisAngle(front, (5 / 180) * Math.PI)],
      [VRMHumanBoneName.LeftUpperArm, new THREE.Quaternion().setFromAxisAngle(front, (-35 / 180) * Math.PI)],
      [VRMHumanBoneName.RightUpperArm, new THREE.Quaternion().setFromAxisAngle(front, (35 / 180) * Math.PI)],
    ]);

    motionsMap.forEach((motions, boneName) => {
      const humanBoneName = pmdToHuman.get(boneName);

      let bone: THREE.Object3D;

      if (humanBoneName) {
        bone = vrm.getNodeByHumanBoneName(humanBoneName);
      } else {
        bone = vrm.model.getObjectByName(boneName);
      }

      if (!bone) {
        return;
      }

      const rotationOffset = rotationOffsets.get(humanBoneName);

      // Inspired by https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/MMDLoader.js
      const times: number[] = [];
      const positions: number[] = [];
      const rotations: number[] = [];
      const positionInterpolations: number[] = [];
      const rotationInterpolations: number[] = [];

      motions.forEach(motion => {
        times.push(motion.frameNum / 30); // 30 fps
        const p = new THREE.Vector3(-motion.position[0], motion.position[1], -motion.position[2])
          .multiplyScalar(0.08) // 1 unit length in VMD = 0.08 m
          .add(bone.userData[USERDATA_KEY_VRM].default.position);
        positions.push(p.x, p.y, p.z);
        const q = new THREE.Quaternion(
          motion.rotation[0],
          -motion.rotation[1],
          motion.rotation[2],
          -motion.rotation[3]
        );
        if (rotationOffset) {
          q.multiply(rotationOffset);
        }
        rotations.push(q.x, q.y, q.z, q.w);

        // Control points of cubic Bézier curve.
        for (let i = 0; i < 3; i++) {
          positionInterpolations.push(
            motion.interpolation[i + 0] / 127, // time1
            motion.interpolation[i + 8] / 127, // value1
            motion.interpolation[i + 4] / 127, // time2
            motion.interpolation[i + 12] / 127 // value2
          );
        }
        rotationInterpolations.push(
          motion.interpolation[3 + 0] / 127,
          motion.interpolation[3 + 8] / 127,
          motion.interpolation[3 + 4] / 127,
          motion.interpolation[3 + 12] / 127
        );
      });

      const positionTrack = new THREE.VectorKeyframeTrack(`${bone.uuid}.position`, times, positions);
      const quaternionTrack = new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`, times, rotations);
      (positionTrack as any).createInterpolant = createCreateInterpolant(times, positions, 3, positionInterpolations);
      (quaternionTrack as any).createInterpolant = createCreateInterpolant(times, rotations, 4, rotationInterpolations);

      tracks.push(positionTrack);
      tracks.push(quaternionTrack);
    });

    morphsMap.forEach((morphs, morphName) => {
      const blendShapeGroupName = morphToBlendShapeGroup.get(morphName) || morphName;
      const blendShapeGroup = vrm.blendShapeMaster.blendShapeGroups.find(g => g.name === blendShapeGroupName);
      if (!blendShapeGroup) {
        return;
      }

      blendShapeGroup.binds.forEach(bind => {
        const meshes = vrm.getSubMeshesByIndex(bind.mesh);
        meshes.forEach(mesh => {
          const times: number[] = [];
          const values: number[] = [];

          morphs.forEach(morph => {
            times.push(morph.frameNum / 30); // 30 fps
            values.push((bind.weight / 100) * morph.weight); // [0, 100] -> [0, 1]
          });

          tracks.push(
            new THREE.NumberKeyframeTrack(`${mesh.uuid}.morphTargetInfluences[morphTarget${bind.index}]`, times, values)
          );
        });
      });
    });

    return new THREE.AnimationClip(THREE.Math.generateUUID(), -1, tracks);
  }
}

export interface VMDMetadata {
  magic: string;
  name: string;
  coordinateSystem: 'left' | 'right';
  motionCount: number;
  morphCount: number;
  cameraCount: number;
}

export interface VMDMotion {
  boneName: string;
  frameNum: number;
  position: [number, number, number];
  rotation: [number, number, number, number];
  interpolation: number[]; // Array(64)
}

export interface VMDMorph {
  morphName: string;
  frameNum: number;
  weight: number;
}

export interface VMDCamera {
  frameNum: number;
  distance: number;
  position: [number, number, number];
  rotation: [number, number, number];
  interpolation: number[]; // Array(24)
  fov: number;
  perspective: number;
}

const pmdToHuman = new Map<string, VRMHumanBoneName>([
  [PMDStandardBoneName.Center, VRMHumanBoneName.Hips],
  [PMDStandardBoneName.LeftLeg, VRMHumanBoneName.LeftUpperLeg],
  [PMDStandardBoneName.LeftKnee, VRMHumanBoneName.LeftLowerLeg],
  [PMDStandardBoneName.LeftAnkle, VRMHumanBoneName.LeftFoot],
  [PMDStandardBoneName.LeftToes, VRMHumanBoneName.LeftToes],
  [PMDStandardBoneName.RightLeg, VRMHumanBoneName.RightUpperLeg],
  [PMDStandardBoneName.RightKnee, VRMHumanBoneName.RightLowerLeg],
  [PMDStandardBoneName.RightAnkle, VRMHumanBoneName.RightFoot],
  [PMDStandardBoneName.RightToes, VRMHumanBoneName.RightToes],
  [PMDStandardBoneName.LowerBody, VRMHumanBoneName.Spine],
  [PMDStandardBoneName.UpperBody, VRMHumanBoneName.Chest],
  [PMDSemiStandardBoneName.UpperBody2, VRMHumanBoneName.UpperChest],
  [PMDStandardBoneName.Neck, VRMHumanBoneName.Neck],
  [PMDStandardBoneName.Head, VRMHumanBoneName.Head],
  [PMDStandardBoneName.LeftEye, VRMHumanBoneName.LeftEye],
  [PMDStandardBoneName.RightEye, VRMHumanBoneName.RightEye],
  [PMDStandardBoneName.LeftShoulder, VRMHumanBoneName.LeftShoulder],
  [PMDStandardBoneName.LeftArm, VRMHumanBoneName.LeftUpperArm],
  [PMDStandardBoneName.LeftElbow, VRMHumanBoneName.LeftLowerArm],
  [PMDStandardBoneName.LeftWrist, VRMHumanBoneName.LeftHand],
  [PMDStandardBoneName.RightShoulder, VRMHumanBoneName.RightShoulder],
  [PMDStandardBoneName.RightArm, VRMHumanBoneName.RightUpperArm],
  [PMDStandardBoneName.RightElbow, VRMHumanBoneName.RightLowerArm],
  [PMDStandardBoneName.RightWrist, VRMHumanBoneName.RightHand],
  [PMDSemiStandardBoneName.LeftThumb0, VRMHumanBoneName.LeftThumbProximal],
  [PMDStandardBoneName.LeftThumb1, VRMHumanBoneName.LeftThumbIntermediate],
  [PMDStandardBoneName.LeftThumb2, VRMHumanBoneName.LeftThumbDistal],
  [PMDStandardBoneName.LeftIndex1, VRMHumanBoneName.LeftIndexProximal],
  [PMDStandardBoneName.LeftIndex2, VRMHumanBoneName.LeftIndexIntermediate],
  [PMDStandardBoneName.LeftIndex3, VRMHumanBoneName.LeftIndexDistal],
  [PMDStandardBoneName.LeftMiddle1, VRMHumanBoneName.LeftMiddleProximal],
  [PMDStandardBoneName.LeftMiddle2, VRMHumanBoneName.LeftMiddleIntermediate],
  [PMDStandardBoneName.LeftMiddle3, VRMHumanBoneName.LeftMiddleDistal],
  [PMDStandardBoneName.LeftRing1, VRMHumanBoneName.LeftRingProximal],
  [PMDStandardBoneName.LeftRing2, VRMHumanBoneName.LeftRingIntermediate],
  [PMDStandardBoneName.LeftRing3, VRMHumanBoneName.LeftRingDistal],
  [PMDStandardBoneName.LeftLittle1, VRMHumanBoneName.LeftLittleProximal],
  [PMDStandardBoneName.LeftLittle2, VRMHumanBoneName.LeftLittleIntermediate],
  [PMDStandardBoneName.LeftLittle3, VRMHumanBoneName.LeftLittleDistal],
  [PMDSemiStandardBoneName.RightThumb0, VRMHumanBoneName.RightThumbProximal],
  [PMDStandardBoneName.RightThumb1, VRMHumanBoneName.RightThumbIntermediate],
  [PMDStandardBoneName.RightThumb2, VRMHumanBoneName.RightThumbDistal],
  [PMDStandardBoneName.RightIndex1, VRMHumanBoneName.RightIndexProximal],
  [PMDStandardBoneName.RightIndex2, VRMHumanBoneName.RightIndexIntermediate],
  [PMDStandardBoneName.RightIndex3, VRMHumanBoneName.RightIndexDistal],
  [PMDStandardBoneName.RightMiddle1, VRMHumanBoneName.RightMiddleProximal],
  [PMDStandardBoneName.RightMiddle2, VRMHumanBoneName.RightMiddleIntermediate],
  [PMDStandardBoneName.RightMiddle3, VRMHumanBoneName.RightMiddleDistal],
  [PMDStandardBoneName.RightRing1, VRMHumanBoneName.RightRingProximal],
  [PMDStandardBoneName.RightRing2, VRMHumanBoneName.RightRingIntermediate],
  [PMDStandardBoneName.RightRing3, VRMHumanBoneName.RightRingDistal],
  [PMDStandardBoneName.RightLittle1, VRMHumanBoneName.RightLittleProximal],
  [PMDStandardBoneName.RightLittle2, VRMHumanBoneName.RightLittleIntermediate],
  [PMDStandardBoneName.RightLittle3, VRMHumanBoneName.RightLittleDistal],
]);

const morphToBlendShapeGroup = new Map<string, string>([
  // ['真面目', ''],
  ['困る', 'Sorrow'],
  ['にこり', 'Joy'],
  ['怒り', 'Angry'],
  // ['上', ''],
  // ['下', ''],
  ['まばたき', 'Blink'],
  ['笑い', 'Fun'],
  ['ウィンク', 'Blink_L'],
  ['ウィンク２', 'Blink_L'],
  ['ウィンク右', 'Blink_R'],
  ['ｳｨﾝｸ２右', 'Blink_R'],
  // ['はぅ', ''],
  // ['なごみ', ''],
  // ['びっくり', ''],
  // ['じと目', ''],
  // ['なぬ！', ''],
  ['あ', 'A'],
  ['い', 'I'],
  ['う', 'U'],
  ['お', 'O'],
  // ['▲', ''],
  // ['∧', ''],
  // ['ω', ''],
  // ['ω□', ''],
  // ['はんっ！', ''],
  ['えー', 'E'],
  // ['にやり', ''],
  // ['瞳小', ''],
  // ['ぺろっ', ''],
]);

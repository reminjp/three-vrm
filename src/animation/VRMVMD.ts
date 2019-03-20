import * as THREE from 'three';
import { USERDATA_KEY_VRM, VRM, VRMBlendShapeBind, VRMHumanBoneName } from '../data';
import { createCreateInterpolant } from '../vendor/three/examples/CubicBezierInterpolation';
import { USERDATA_KEY_VRM_IK_SOLVER, VRMIKName } from './VRMIKSolver';

export class VRMVMD {
  private motionsMap: Map<VRMHumanBoneName, VRMVMDMotion[]>;
  private ikMotionsMap: Map<VRMIKName, VRMVMDMotion[]>;
  private morphsMap: Map<string, VRMVMDMorph[]>;

  constructor(vmd: any) {
    // Motions
    // Convert rotations for T-pose.
    const front = new THREE.Vector3(0, 0, -1);
    const rotationOffsets = new Map<VRMHumanBoneName, THREE.Quaternion>([
      [VRMHumanBoneName.LeftShoulder, new THREE.Quaternion().setFromAxisAngle(front, (-5 / 180) * Math.PI)],
      [VRMHumanBoneName.RightShoulder, new THREE.Quaternion().setFromAxisAngle(front, (5 / 180) * Math.PI)],
      [VRMHumanBoneName.LeftUpperArm, new THREE.Quaternion().setFromAxisAngle(front, (-35 / 180) * Math.PI)],
      [VRMHumanBoneName.RightUpperArm, new THREE.Quaternion().setFromAxisAngle(front, (35 / 180) * Math.PI)],
    ]);

    const motions: VRMVMDMotion[] = vmd.motions.map((e: any) => {
      const motion = new VRMVMDMotion();
      motion.boneName = e.boneName;
      motion.humanBoneName = getHumanBoneNameByBoneName(e.boneName);
      // 30 fps
      motion.time = e.frameNum / 30;
      // 1 unit length in VMD = 0.08 m
      motion.position = new THREE.Vector3(-e.position[0], e.position[1], -e.position[2]).multiplyScalar(0.08);
      motion.rotation = new THREE.Quaternion(e.rotation[0], -e.rotation[1], e.rotation[2], -e.rotation[3]);
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
    this.ikMotionsMap = new Map();
    motions.forEach(motion => {
      if (!motion.humanBoneName) {
        const ikName: VRMIKName = mmdIKBoneNames.findIndex(boneName => boneName === motion.boneName);
        if (ikName !== -1) {
          if (!this.ikMotionsMap.has(ikName)) {
            this.ikMotionsMap.set(ikName, []);
          }
          this.ikMotionsMap.get(ikName).push(motion);
        }
        return;
      }
      if (!this.motionsMap.has(motion.humanBoneName)) {
        this.motionsMap.set(motion.humanBoneName, []);
      }
      this.motionsMap.get(motion.humanBoneName).push(motion);
    });

    // Morphs
    const morphs: VRMVMDMorph[] = vmd.morphs.map((e: any) => {
      const morph = new VRMVMDMorph();
      morph.blendShapeGroupName = stringToBlendShapeGroupName(e.morphName);
      morph.time = e.frameNum / 30;
      morph.weight = e.weight;
      return morph;
    });
    morphs.sort((a, b) => {
      return a.time - b.time;
    });
    this.morphsMap = new Map();
    morphs.forEach(morph => {
      if (!this.morphsMap.has(morph.blendShapeGroupName)) {
        this.morphsMap.set(morph.blendShapeGroupName, []);
      }
      this.morphsMap.get(morph.blendShapeGroupName).push(morph);
    });
  }

  public toAnimationClip(vrm: VRM): THREE.AnimationClip {
    const ik = vrm.userData[USERDATA_KEY_VRM_IK_SOLVER];

    // For motions.
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    vrm.model.traverse((object3d: THREE.Object3D) => {
      if (object3d instanceof THREE.SkinnedMesh) {
        skinnedMeshes.push(object3d);
      }
    });
    const humanBoneNameToBone = new Map<VRMHumanBoneName, THREE.Object3D>();
    vrm.humanoid.humanBones.forEach(humanBone => {
      const bone = vrm.getNode(humanBone.node);
      humanBoneNameToBone.set(humanBone.bone, bone);
    });

    // For morphs.
    const blendShapeGroupNameToBinds = new Map<string, VRMBlendShapeBind[]>();
    vrm.blendShapeMaster.blendShapeGroups.forEach(g => {
      blendShapeGroupNameToBinds.set(g.name, g.binds);
    });

    // Tracks binded to each Object3D.
    const tracks: THREE.KeyframeTrack[] = [];

    // Create motion tracks.
    this.motionsMap.forEach((motions, humanBoneName) => {
      const bone = humanBoneNameToBone.get(humanBoneName);
      if (!bone) {
        return;
      }

      // Inspired by https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/MMDLoader.js
      const times: number[] = [];
      const positions: number[] = [];
      const rotations: number[] = [];
      const positionInterpolations: number[] = [];
      const rotationInterpolations: number[] = [];

      motions.forEach(motion => {
        times.push(motion.time);
        const p = motion.position.clone().add(bone.userData[USERDATA_KEY_VRM].default.position);
        positions.push(p.x, p.y, p.z);
        const r = motion.rotation;
        rotations.push(r.x, r.y, r.z, r.w);

        // Control points of cubic Bézier curve.
        // cf. http://atupdate.web.fc2.com/vmd_format.htm
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

      if (times.length === 0) {
        return;
      }

      const positionTrack = new THREE.VectorKeyframeTrack(`${bone.uuid}.position`, times, positions);
      const quaternionTrack = new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`, times, rotations);
      (positionTrack as any).createInterpolant = createCreateInterpolant(times, positions, 3, positionInterpolations);
      (quaternionTrack as any).createInterpolant = createCreateInterpolant(times, rotations, 4, rotationInterpolations);

      tracks.push(positionTrack);
      tracks.push(quaternionTrack);
    });

    // Create IK motion tracks.
    if (ik) {
      this.ikMotionsMap.forEach((motions, ikName) => {
        const target = ik.getTarget(ikName);

        const times: number[] = [];
        const positions: number[] = [];
        const rotations: number[] = [];
        const positionInterpolations: number[] = [];
        const rotationInterpolations: number[] = [];

        motions.forEach(motion => {
          times.push(motion.time);
          const p = motion.position.clone().add(target.userData[USERDATA_KEY_VRM].default.position);
          positions.push(p.x, p.y, p.z);
          const r = motion.rotation;
          rotations.push(r.x, r.y, r.z, r.w);

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

        if (times.length === 0) {
          return;
        }

        const positionTrack = new THREE.VectorKeyframeTrack(`${target.uuid}.position`, times, positions);
        const quaternionTrack = new THREE.QuaternionKeyframeTrack(`${target.uuid}.quaternion`, times, rotations);
        (positionTrack as any).createInterpolant = createCreateInterpolant(times, positions, 3, positionInterpolations);
        (quaternionTrack as any).createInterpolant = createCreateInterpolant(
          times,
          rotations,
          4,
          rotationInterpolations
        );

        tracks.push(positionTrack);
        tracks.push(quaternionTrack);
      });
    }

    // Create morph tracks.
    this.morphsMap.forEach((morphs, blendShapeGroupName) => {
      const binds = blendShapeGroupNameToBinds.get(blendShapeGroupName);
      if (!binds) {
        return;
      }

      binds.forEach(bind => {
        const meshes = vrm.getSubMeshesByIndex(bind.mesh);
        meshes.forEach(mesh => {
          const times: number[] = [];
          const values: number[] = [];

          morphs.forEach(morph => {
            times.push(morph.time);
            values.push((bind.weight / 100) * morph.weight);
          });

          tracks.push(
            new THREE.NumberKeyframeTrack(`${mesh.uuid}.morphTargetInfluences[morphTarget${bind.index}]`, times, values)
          );
        });
      });
    });

    // Create AnimationClip from tracks.
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

class VRMVMDMorph {
  public blendShapeGroupName: string;
  public time: number;
  public weight: number;
}

// TODO: Implement missing bones.
// - 両目
// const boneNameToHumanBoneName: Array<[string, VRMHumanBoneName]> = [
const boneNameToHumanBoneName: Array<[string, string]> = [
  ['センター', 'hips'],
  ['左足', 'leftUpperLeg'],
  ['右足', 'rightUpperLeg'],
  ['左ひざ', 'leftLowerLeg'],
  ['右ひざ', 'rightLowerLeg'],
  ['左足首', 'leftFoot'],
  ['右足首', 'rightFoot'],
  ['下半身', 'spine'],
  ['上半身', 'chest'],
  ['首', 'neck'],
  ['頭', 'head'],
  ['左肩', 'leftShoulder'],
  ['右肩', 'rightShoulder'],
  ['左腕', 'leftUpperArm'],
  ['右腕', 'rightUpperArm'],
  ['左ひじ', 'leftLowerArm'],
  ['右ひじ', 'rightLowerArm'],
  ['左手首', 'leftHand'],
  ['右手首', 'rightHand'],
  ['左つま先', 'leftToes'],
  ['右つま先', 'rightToes'],
  ['左目', 'leftEye'],
  ['右目', 'rightEye'],
  ['顎', 'jaw'],
  ['左親指０', 'leftThumbProximal'],
  ['左親指１', 'leftThumbIntermediate'],
  ['左親指２', 'leftThumbDistal'],
  ['左人指１', 'leftIndexProximal'],
  ['左人指２', 'leftIndexIntermediate'],
  ['左人指３', 'leftIndexDistal'],
  ['左中指１', 'leftMiddleProximal'],
  ['左中指２', 'leftMiddleIntermediate'],
  ['左中指３', 'leftMiddleDistal'],
  ['左薬指１', 'leftRingProximal'],
  ['左薬指２', 'leftRingIntermediate'],
  ['左薬指３', 'leftRingDistal'],
  ['左小指１', 'leftLittleProximal'],
  ['左小指２', 'leftLittleIntermediate'],
  ['左小指３', 'leftLittleDistal'],
  ['右親指０', 'rightThumbProximal'],
  ['右親指１', 'rightThumbIntermediate'],
  ['右親指２', 'rightThumbDistal'],
  ['右人指１', 'rightIndexProximal'],
  ['右人指２', 'rightIndexIntermediate'],
  ['右人指３', 'rightIndexDistal'],
  ['右中指１', 'rightMiddleProximal'],
  ['右中指２', 'rightMiddleIntermediate'],
  ['右中指３', 'rightMiddleDistal'],
  ['右薬指１', 'rightRingProximal'],
  ['右薬指２', 'rightRingIntermediate'],
  ['右薬指３', 'rightRingDistal'],
  ['右小指１', 'rightLittleProximal'],
  ['右小指２', 'rightLittleIntermediate'],
  ['右小指３', 'rightLittleDistal'],
  ['上半身２', 'upperChest'],
];

function getHumanBoneNameByBoneName(boneName: string): VRMHumanBoneName {
  const item = boneNameToHumanBoneName.find(e => boneName === e[0]);
  // return item ? item[1] : undefined;
  return item ? (item[1] as VRMHumanBoneName) : undefined;
}

const mmdIKBoneNames: string[] = [];
mmdIKBoneNames[VRMIKName.LeftFoot] = '左足ＩＫ';
mmdIKBoneNames[VRMIKName.RightFoot] = '右足ＩＫ';
mmdIKBoneNames[VRMIKName.LeftToes] = '左つま先ＩＫ';
mmdIKBoneNames[VRMIKName.RightToes] = '右つま先ＩＫ';

const regexToBlendShapeGroupName: Array<[RegExp, string]> = [
  [new RegExp('^(Neutral|base)$'), 'Neutral'],
  [new RegExp('^(A|a|あ)$'), 'A'],
  [new RegExp('^(I|i|い)$'), 'I'],
  [new RegExp('^(U|u|う)$'), 'U'],
  [new RegExp('^(E|e|え)$'), 'E'],
  [new RegExp('^(O|o|お)$'), 'O'],
  [new RegExp('^([Bb]link|まばたき)$'), 'Blink'],
  [new RegExp('^([Bb]link_[Ll]|ウィンク)$'), 'Blink_L'],
  [new RegExp('^([Bb]link_[Rr]|ウィンク右)$'), 'Blink_R'],
  [new RegExp('^([Jj]oy)$'), 'Joy'],
  [new RegExp('^([Aa]ngry|怒り)$'), 'Angry'],
  [new RegExp('^([Ss]orrow|困る)$'), 'Sorrow'],
  [new RegExp('^([Ff]un|笑い)$'), 'Fun'],
  [new RegExp('^([Ll]ook[Uu]p)$'), 'LookUp'],
  [new RegExp('^([Ll]ook[Dd]own)$'), 'LookDown'],
  [new RegExp('^([Ll]ook[Ll]eft)$'), 'LookLeft'],
  [new RegExp('^([Ll]ook[Rr]ight)$'), 'LookRight'],
];

function stringToBlendShapeGroupName(s: string): string {
  const r = regexToBlendShapeGroupName.find(e => e[0].test(s));
  if (!r) {
    return undefined;
  }
  return r[1];
}

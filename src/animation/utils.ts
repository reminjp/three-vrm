import { VRMHumanBoneName } from '../data/VRMHumanoid';

export type VRMMMDIKBoneName = 'leftFootIK' | 'rightFootIK' | 'leftToesIK' | 'rightToesIK';

// TODO: Implement missing bones.
// - 両目
const boneNameToHumanBoneName: Array<[string, VRMHumanBoneName | VRMMMDIKBoneName]> = [
  // VRMHumanBoneName
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
  // VRMMMDIKBoneName
  ['左足ＩＫ', 'leftFootIK'],
  ['右足ＩＫ', 'rightFootIK'],
  ['左つま先ＩＫ', 'leftToesIK'],
  ['右つま先ＩＫ', 'rightToesIK'],
];

const ikBoneNameToParentHumanBoneName: Array<[VRMMMDIKBoneName, VRMHumanBoneName]> = [
  ['leftFootIK', 'leftFoot'],
  ['rightFootIK', 'rightFoot'],
  ['leftToesIK', 'leftToes'],
  ['rightToesIK', 'rightToes'],
];

export abstract class VRMMMDUtils {
  public static stringToHumanBoneName(s: string): VRMHumanBoneName | VRMMMDIKBoneName {
    const r = boneNameToHumanBoneName.find(e => s === e[0]);
    if (!r) {
      return undefined;
    }
    return r[1];
  }

  public static ikBoneNameToParentHumanBoneName(s: VRMMMDIKBoneName): VRMHumanBoneName {
    const r = ikBoneNameToParentHumanBoneName.find(e => s === e[0]);
    if (!r) {
      return undefined;
    }
    return r[1];
  }
}

import { VRMHumanBoneName } from '../data/VRMHumanoid';

// TODO: Implement missing bones.
// - 両目
// - 左足ＩＫ
// - 左つま先ＩＫ
// - 右足ＩＫ
// - 右つま先ＩＫ
const regexToHumanBoneName: Array<[RegExp, VRMHumanBoneName]> = [
  [new RegExp('^センター$'), 'hips'],
  [new RegExp('^左足$'), 'leftUpperLeg'],
  [new RegExp('^右足$'), 'rightUpperLeg'],
  [new RegExp('^左ひざ$'), 'leftLowerLeg'],
  [new RegExp('^右ひざ$'), 'rightLowerLeg'],
  [new RegExp('^左足首$'), 'leftFoot'],
  [new RegExp('^右足首$'), 'rightFoot'],
  [new RegExp('^下半身$'), 'spine'],
  [new RegExp('^上半身$'), 'chest'],
  [new RegExp('^首$'), 'neck'],
  [new RegExp('^頭$'), 'head'],
  [new RegExp('^左肩$'), 'leftShoulder'],
  [new RegExp('^右肩$'), 'rightShoulder'],
  [new RegExp('^左腕$'), 'leftUpperArm'],
  [new RegExp('^右腕$'), 'rightUpperArm'],
  [new RegExp('^左ひじ$'), 'leftLowerArm'],
  [new RegExp('^右ひじ$'), 'rightLowerArm'],
  [new RegExp('^左手首$'), 'leftHand'],
  [new RegExp('^右手首$'), 'rightHand'],
  [new RegExp('^左つま先$'), 'leftToes'],
  [new RegExp('^右つま先$'), 'rightToes'],
  [new RegExp('^左目$'), 'leftEye'],
  [new RegExp('^右目$'), 'rightEye'],
  [new RegExp('^顎$'), 'jaw'],
  [new RegExp('^左親指０$'), 'leftThumbProximal'],
  [new RegExp('^左親指１$'), 'leftThumbIntermediate'],
  [new RegExp('^左親指２$'), 'leftThumbDistal'],
  [new RegExp('^左人指１$'), 'leftIndexProximal'],
  [new RegExp('^左人指２$'), 'leftIndexIntermediate'],
  [new RegExp('^左人指３$'), 'leftIndexDistal'],
  [new RegExp('^左中指１$'), 'leftMiddleProximal'],
  [new RegExp('^左中指２$'), 'leftMiddleIntermediate'],
  [new RegExp('^左中指３$'), 'leftMiddleDistal'],
  [new RegExp('^左薬指１$'), 'leftRingProximal'],
  [new RegExp('^左薬指２$'), 'leftRingIntermediate'],
  [new RegExp('^左薬指３$'), 'leftRingDistal'],
  [new RegExp('^左小指１$'), 'leftLittleProximal'],
  [new RegExp('^左小指２$'), 'leftLittleIntermediate'],
  [new RegExp('^左小指３$'), 'leftLittleDistal'],
  [new RegExp('^右親指０$'), 'rightThumbProximal'],
  [new RegExp('^右親指１$'), 'rightThumbIntermediate'],
  [new RegExp('^右親指２$'), 'rightThumbDistal'],
  [new RegExp('^右人指１$'), 'rightIndexProximal'],
  [new RegExp('^右人指２$'), 'rightIndexIntermediate'],
  [new RegExp('^右人指３$'), 'rightIndexDistal'],
  [new RegExp('^右中指１$'), 'rightMiddleProximal'],
  [new RegExp('^右中指２$'), 'rightMiddleIntermediate'],
  [new RegExp('^右中指３$'), 'rightMiddleDistal'],
  [new RegExp('^右薬指１$'), 'rightRingProximal'],
  [new RegExp('^右薬指２$'), 'rightRingIntermediate'],
  [new RegExp('^右薬指３$'), 'rightRingDistal'],
  [new RegExp('^右小指１$'), 'rightLittleProximal'],
  [new RegExp('^右小指２$'), 'rightLittleIntermediate'],
  [new RegExp('^右小指３$'), 'rightLittleDistal'],
  [new RegExp('^上半身２$'), 'upperChest'],
];

export abstract class VRMHumanoidUtils {
  public static stringToHumanBoneName(s: string): VRMHumanBoneName | undefined {
    const r = regexToHumanBoneName.find(e => e[0].test(s));
    if (!r) {
      return undefined;
    }
    return r[1];
  }
}

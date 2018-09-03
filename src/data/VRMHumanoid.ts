export class VRMHumanoid {
  public armStretch: number;
  public feetSpacing: number;
  public hasTranslationDoF: boolean;
  public legStretch: number;
  public lowerArmTwist: number;
  public lowerLegTwist: number;
  public upperArmTwist: number;
  public upperLegTwist: number;
  public humanBones: VRMHumanBone[];
}

export class VRMHumanBone {
  public bone: VRMHumanBoneBoneType;
  public node: number;
  public useDefaultValues: boolean;
}

export type VRMHumanBoneBoneType =
  | 'hips'
  | 'spine'
  | 'chest'
  | 'upperChest'
  | 'neck'
  | 'head'
  | 'leftEye'
  | 'rightEye'
  | 'leftUpperArm'
  | 'rightUpperArm'
  | 'leftLowerArm'
  | 'rightLowerArm'
  | 'leftHand'
  | 'rightHand'
  | 'leftUpperLeg'
  | 'rightUpperLeg'
  | 'leftLowerLeg'
  | 'rightLowerLeg'
  | 'leftFoot'
  | 'rightFoot'
  | 'leftToe'
  | 'rightToe'
  | 'leftThumbProximal'
  | 'leftThumbIntermediate'
  | 'leftThumbDistal'
  | 'leftIndexProximal'
  | 'leftIndexIntermediate'
  | 'leftIndexDistal'
  | 'leftMiddleProximal'
  | 'leftMiddleIntermediate'
  | 'leftMiddleDistal'
  | 'leftRingProximal'
  | 'leftRingIntermediate'
  | 'leftRingDistal'
  | 'leftLittleProximal'
  | 'leftLittleIntermediate'
  | 'leftLittleDistal'
  | 'rightThumbProximal'
  | 'rightThumbIntermediate'
  | 'rightThumbDistal'
  | 'rightIndexProximal'
  | 'rightIndexIntermediate'
  | 'rightIndexDistal'
  | 'rightMiddleProximal'
  | 'rightMiddleIntermediate'
  | 'rightMiddleDistal'
  | 'rightRingProximal'
  | 'rightRingIntermediate'
  | 'rightRingDistal'
  | 'rightLittleProximal'
  | 'rightLittleIntermediate'
  | 'rightLittleDistal';

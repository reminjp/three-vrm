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
  public bone: VRMHumanBoneName;
  public node: number;
  public useDefaultValues: boolean;
}

export type VRMHumanBoneName =
  | 'hips'
  | 'leftUpperLeg'
  | 'rightUpperLeg'
  | 'leftLowerLeg'
  | 'rightLowerLeg'
  | 'leftFoot'
  | 'rightFoot'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftUpperArm'
  | 'rightUpperArm'
  | 'leftLowerArm'
  | 'rightLowerArm'
  | 'leftHand'
  | 'rightHand'
  | 'leftToes'
  | 'rightToes'
  | 'leftEye'
  | 'rightEye'
  | 'jaw'
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
  | 'rightLittleDistal'
  | 'upperChest';

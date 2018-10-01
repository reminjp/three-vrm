import { VRMVector3 } from './VRMVector3';

export interface VRMHumanoid {
  armStretch: number;
  feetSpacing: number;
  hasTranslationDoF: boolean;
  legStretch: number;
  lowerArmTwist: number;
  lowerLegTwist: number;
  upperArmTwist: number;
  upperLegTwist: number;
  humanBones: VRMHumanBone[];
}

export interface VRMHumanBone {
  bone: VRMHumanBoneName;
  node: number;
  useDefaultValues: boolean;
  min: VRMVector3;
  max: VRMVector3;
  center: VRMVector3;
  axisLength: number;
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

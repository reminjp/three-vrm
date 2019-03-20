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

export const enum VRMHumanBoneName {
  // Hips - Upper Leg - Lower Leg - Foot - Toes
  Hips = 'hips',
  LeftUpperLeg = 'leftUpperLeg',
  LeftLowerLeg = 'leftLowerLeg',
  LeftFoot = 'leftFoot',
  LeftToes = 'leftToes',
  RightUpperLeg = 'rightUpperLeg',
  RightLowerLeg = 'rightLowerLeg',
  RightFoot = 'rightFoot',
  RightToes = 'rightToes',
  // Hips - Spine - Chest - Neck - Head
  Spine = 'spine',
  Chest = 'chest',
  UpperChest = 'upperChest',
  Neck = 'neck',
  Head = 'head',
  LeftEye = 'leftEye',
  RightEye = 'rightEye',
  Jaw = 'jaw',
  // Chest - Shoulder - Arm - Forearm - Hand
  LeftShoulder = 'leftShoulder',
  LeftUpperArm = 'leftUpperArm',
  LeftLowerArm = 'leftLowerArm',
  LeftHand = 'leftHand',
  RightShoulder = 'rightShoulder',
  RightUpperArm = 'rightUpperArm',
  RightLowerArm = 'rightLowerArm',
  RightHand = 'rightHand',
  // Hand - Proximal - Intermediate - Distal
  LeftThumbProximal = 'leftThumbProximal',
  LeftThumbIntermediate = 'leftThumbIntermediate',
  LeftThumbDistal = 'leftThumbDistal',
  LeftIndexProximal = 'leftIndexProximal',
  LeftIndexIntermediate = 'leftIndexIntermediate',
  LeftIndexDistal = 'leftIndexDistal',
  LeftMiddleProximal = 'leftMiddleProximal',
  LeftMiddleIntermediate = 'leftMiddleIntermediate',
  LeftMiddleDistal = 'leftMiddleDistal',
  LeftRingProximal = 'leftRingProximal',
  LeftRingIntermediate = 'leftRingIntermediate',
  LeftRingDistal = 'leftRingDistal',
  LeftLittleProximal = 'leftLittleProximal',
  LeftLittleIntermediate = 'leftLittleIntermediate',
  LeftLittleDistal = 'leftLittleDistal',
  RightThumbProximal = 'rightThumbProximal',
  RightThumbIntermediate = 'rightThumbIntermediate',
  RightThumbDistal = 'rightThumbDistal',
  RightIndexProximal = 'rightIndexProximal',
  RightIndexIntermediate = 'rightIndexIntermediate',
  RightIndexDistal = 'rightIndexDistal',
  RightMiddleProximal = 'rightMiddleProximal',
  RightMiddleIntermediate = 'rightMiddleIntermediate',
  RightMiddleDistal = 'rightMiddleDistal',
  RightRingProximal = 'rightRingProximal',
  RightRingIntermediate = 'rightRingIntermediate',
  RightRingDistal = 'rightRingDistal',
  RightLittleProximal = 'rightLittleProximal',
  RightLittleIntermediate = 'rightLittleIntermediate',
  RightLittleDistal = 'rightLittleDistal',
}

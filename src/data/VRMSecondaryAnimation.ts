import { VRMVector3 } from './VRMVector3';

export interface VRMSecondaryAnimation {
  boneGroups: VRMSecondaryAnimationSpring[];
  colliderGroups: VRMSecondaryAnimationColliderGroup[];
}

export interface VRMSecondaryAnimationSpring {
  comment: string;
  stiffiness: number;
  gravityPower: number;
  gravityDir: VRMVector3;
  dragForce: number;
  center: number;
  hitRadius: number;
  bones: number[];
  colliderGroups: number[];
}

export interface VRMSecondaryAnimationColliderGroup {
  node: number;
  colliders: VRMSecondaryAnimationCollider[];
}

export interface VRMSecondaryAnimationCollider {
  offset: VRMVector3;
  radius: number;
}

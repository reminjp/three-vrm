import { VRMVector3 } from './VRMVector3';

export interface VRMFirstPerson {
  firstPersonBone: number;
  firstPersonBoneOffset: VRMVector3;
  meshAnnotations: VRMFirstPersonMeshAnnotation[];
  lookAtTypeName: 'Bone' | 'BlendShape';
  lookAtHorizontalInner: VRMFirstPersonDegreeMap;
  lookAtHorizontalOuter: VRMFirstPersonDegreeMap;
  lookAtVerticalDown: VRMFirstPersonDegreeMap;
  lookAtVerticalUp: VRMFirstPersonDegreeMap;
}

export interface VRMFirstPersonMeshAnnotation {
  mesh: number;
  firstPersonFlag: 'Auto' | 'FirstPersonOnly' | 'ThirdPersonOnly' | 'Both';
}

export interface VRMFirstPersonDegreeMap {
  curve: number[];
  xRange: number;
  yRange: number;
}

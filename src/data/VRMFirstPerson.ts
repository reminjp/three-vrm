export class VRMFirstPerson {
  public firstPersonBone: number;
  public firstPersonBoneOffset: THREE.Vector3;
  public meshAnnotations: VRMFirstPersonMeshAnnotation[];
  public lookAtTypeName: 'Bone' | 'BlendShape';
  public lookAtHorizontalInner: VRMFirstPersonDegreeMap;
  public lookAtHorizontalOuter: VRMFirstPersonDegreeMap;
  public lookAtVerticalDown: VRMFirstPersonDegreeMap;
  public lookAtVerticalUp: VRMFirstPersonDegreeMap;
}

export class VRMFirstPersonMeshAnnotation {
  public mesh: number;
  public firstPersonFlag: 'Auto' | 'FirstPersonOnly' | 'ThirdPersonOnly' | 'Both';
}

export class VRMFirstPersonDegreeMap {
  public curve: number[];
  public xRange: number;
  public yRange: number;
}

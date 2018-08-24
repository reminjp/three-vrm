export class VRMFirstPerson {
  public firstPersonBone: number;
  public firstPersonBoneOffset: THREE.Vector3;
  public meshAnnotations: VRMMeshAnnotation[];
  public lookAtTypeName: 'Bone' | 'BlendShape';
  public lookAtHorizontalInner: any;
  public lookAtHorizontalOuter: any;
  public lookAtVerticalDown: any;
  public lookAtVerticalUp: any;
}

export class VRMMeshAnnotation {
  public firstPersonFlag: 'Auto' | 'FirstPersonOnly' | 'ThirdPersonOnly' | 'Both';
  public mesh: number;
}

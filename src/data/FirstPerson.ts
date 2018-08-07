export class FirstPerson {
  public firstPersonBone: number;
  public firstPersonBoneOffset: THREE.Vector3;
  public meshAnnotations: MeshAnnotation[];
  public lookAtTypeName: 'Bone' | 'BlendShape';
  public lookAtHorizontalInner: any;
  public lookAtHorizontalOuter: any;
  public lookAtVerticalDown: any;
  public lookAtVerticalUp: any;
}

export class MeshAnnotation {
  public firstPersonFlag: 'Auto' | 'FirstPersonOnly' | 'ThirdPersonOnly' | 'Both';
  public mesh: number;
}

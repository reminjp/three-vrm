export class VRMSecondaryAnimation {
  public boneGroups: VRMSecondaryAnimationSpring[];
  public colliderGroups: VRMSecondaryAnimationColliderGroup[];
}

export class VRMSecondaryAnimationSpring {
  public comment: string;
  public stiffiness: number;
  public gravityPower: number;
  public gravityDir: THREE.Vector3;
  public dragForce: number;
  public center: number;
  public hitRadius: number;
  public bones: number[];
  public colliderGroups: number[];
}

export class VRMSecondaryAnimationColliderGroup {
  public node: number;
  public colliders: VRMSecondaryAnimationCollider[];
}

export class VRMSecondaryAnimationCollider {
  public offset: THREE.Vector3;
  public radius: number;
}

export class VRMSecondaryAnimation {
  public boneGroups: VRMBoneGroup[];
  public colliderGroups: VRMColliderGroup[];
}

export class VRMBoneGroup {
  public bones: number[];
  public center: number;
  public colliderGroups: number[];
  public comment: string;
  public dragForce: number;
  public gravityDir: THREE.Vector3;
  public gravityPower: number;
  public hitRadius: number;
  public stiffiness: number;
}

export class VRMColliderGroup {
  public colliders: VRMCollider[];
  public node: number;
}

export class VRMCollider {
  public offset: THREE.Vector3;
  public radius: number;
}

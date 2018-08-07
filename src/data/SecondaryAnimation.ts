export class SecondaryAnimation {
  public boneGroups: BoneGroup[];
  public colliderGroups: ColliderGroup[];
}

export class BoneGroup {
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

export class ColliderGroup {
  public colliders: Collider[];
  public node: number;
}

export class Collider {
  public offset: THREE.Vector3;
  public radius: number;
}

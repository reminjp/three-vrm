export class VRMBlendShape {
  public blendShapeGroups: VRMBlendShapeGroup[];
}

export class VRMBlendShapeGroup {
  public name: string;
  public presetName: string;
  public binds: VRMBlendShapeBind[];
  public materialValues: VRMBlendShapeMaterialBind[];
}

export class VRMBlendShapeBind {
  public mesh: number;
  public index: number;
  public weight: number;
}

export class VRMBlendShapeMaterialBind {
  public materialName: string;
  public propertyName: string;
  public targetValue: number[];
}

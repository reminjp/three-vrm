export class VRMBlendShapeMaster {
  public blendShapeGroups: VRMBlendShapeGroup[];
}

export class VRMBlendShapeGroup {
  public binds: Array<{
    index: number;
    mesh: number;
    weight: number;
  }>;
  public materialValues: any[];
  public name: string;
  public presetName: string;
}

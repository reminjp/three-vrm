export class BlendShapeMaster {
  public blendShapeGroups: BlendShapeGroup[];
}

export class BlendShapeGroup {
  public binds: Array<{
    index: number;
    mesh: number;
    weight: number;
  }>;
  public materialValues: any[];
  public name: string;
  public presetName: string;
}

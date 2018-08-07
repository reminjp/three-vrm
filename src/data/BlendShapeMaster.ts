export class BlendShapeMaster {
  public blendShapeGroup: BlendShapeGroup[];
}

export class BlendShapeGroup {
  public binds: BlendShapeBind[];
  public materialValues: any[];
  public name: string;
  public presetName: string;
}

export class BlendShapeBind {
  public index: number;
  public mesh: number;
  public weight: number;
}

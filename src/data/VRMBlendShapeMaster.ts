export interface VRMBlendShape {
  blendShapeGroups: VRMBlendShapeGroup[];
}

export interface VRMBlendShapeGroup {
  name: string;
  presetName: string;
  binds: VRMBlendShapeBind[];
  materialValues: VRMBlendShapeMaterialBind[];
}

export interface VRMBlendShapeBind {
  mesh: number;
  index: number;
  weight: number;
}

export interface VRMBlendShapeMaterialBind {
  materialName: string;
  propertyName: string;
  targetValue: number[];
}

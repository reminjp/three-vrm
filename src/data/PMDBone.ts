export type PMDBoneName = PMDStandardBoneName | PMDSemiStandardBoneName;

export const enum PMDStandardBoneName {
  Center = 'センター',
  UpperBody = '上半身',
  LowerBody = '下半身',
  Neck = '首',
  Head = '頭',
  LeftEye = '左目',
  RightEye = '右目',
  Eyes = '両目',
  LeftShoulder = '左肩',
  LeftArm = '左腕',
  LeftElbow = '左ひじ',
  LeftWrist = '左手首',
  RightShoulder = '右肩',
  RightArm = '右腕',
  RightElbow = '右ひじ',
  RightWrist = '右手首',
  LeftLeg = '左足',
  LeftKnee = '左ひざ',
  LeftAnkle = '左足首',
  RightLeg = '右足',
  RightKnee = '右ひざ',
  RightAnkle = '右足首',
  LeftLegIK = '左足ＩＫ',
  RightLegIK = '右足ＩＫ',
  LeftToesIK = '左つま先ＩＫ',
  RightToesIK = '右つま先ＩＫ',
  LeftToes = '左つま先',
  RightToes = '右つま先',
  LeftThumb1 = '左親指１',
  LeftThumb2 = '左親指２',
  LeftIndex1 = '左人指１',
  LeftIndex2 = '左人指２',
  LeftIndex3 = '左人指３',
  LeftMiddle1 = '左中指１',
  LeftMiddle2 = '左中指２',
  LeftMiddle3 = '左中指３',
  LeftRing1 = '左薬指１',
  LeftRing2 = '左薬指２',
  LeftRing3 = '左薬指３',
  LeftLittle1 = '左小指１',
  LeftLittle2 = '左小指２',
  LeftLittle3 = '左小指３',
  RightThumb1 = '右親指１',
  RightThumb2 = '右親指２',
  RightIndex1 = '右人指１',
  RightIndex2 = '右人指２',
  RightIndex3 = '右人指３',
  RightMiddle1 = '右中指１',
  RightMiddle2 = '右中指２',
  RightMiddle3 = '右中指３',
  RightRing1 = '右薬指１',
  RightRing2 = '右薬指２',
  RightRing3 = '右薬指３',
  RightLittle1 = '右小指１',
  RightLittle2 = '右小指２',
  RightLittle3 = '右小指３',
}

export const enum PMDSemiStandardBoneName {
  Parent = '全ての親',
  LeftArmTwist = '左腕捩',
  RightArmTwist = '右腕捩',
  LeftWristTwist = '左手捩',
  RightWristTwist = '右手捩',
  UpperBody2 = '上半身2',
  Groove = 'グルーブ',
  Waist = '腰',
  LegIKParent = '足IK親',
  LeftThumb0 = '左親指０',
  RightThumb0 = '右親指０',
}

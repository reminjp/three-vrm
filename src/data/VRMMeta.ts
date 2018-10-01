export interface VRMMeta {
  title: string;
  version: string;
  author: string;
  contactInformation: string;
  reference: string;
  texture: number;
  allowedUserName: 'OnlyAuthor' | 'ExplicitlyLicensedPerson' | 'Everyone';
  violentUssageName: 'Disallow' | 'Allow';
  sexualUssageName: 'Disallow' | 'Allow';
  commercialUssageName: 'Disallow' | 'Allow';
  otherPermissionUrl: string;
  licenseName:
    | 'Redistribution_Prohibited'
    | 'CC0'
    | 'CC_BY'
    | 'CC_BY_NC'
    | 'CC_BY_SA'
    | 'CC_BY_NC_SA'
    | 'CC_BY_ND'
    | 'CC_BY_NC_ND'
    | 'Other';
  otherLicenseUrl: string;
}

export class VRMMeta {
  public title: string;
  public version: string;
  public author: string;
  public contactInformation: string;
  public reference: string;
  public texture: number;
  public allowedUserName: 'OnlyAuthor' | 'ExplicitlyLicensedPerson' | 'Everyone';
  public violentUssageName: 'Disallow' | 'Allow';
  public sexualUssageName: 'Disallow' | 'Allow';
  public commercialUssageName: 'Disallow' | 'Allow';
  public otherPermissionUrl: string;
  public licenseName:
    | 'Redistribution_Prohibited'
    | 'CC0'
    | 'CC_BY'
    | 'CC_BY_NC'
    | 'CC_BY_SA'
    | 'CC_BY_NC_SA'
    | 'CC_BY_ND'
    | 'CC_BY_NC_ND'
    | 'Other';
  public otherLicenseUrl: string;
}

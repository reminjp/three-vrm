export class MaterialProperty {
  public name: string;
  public shader: string;
  public renderQueue: number;
  public floatProperties: any;
  public keywordMap: any;
  public tagMap: any;
  public textureProperties: any;
  public vectorProperties: any;

  constructor() {
    this.name = '';
    this.shader = '';
    this.renderQueue = 2000;
    this.floatProperties = {};
    this.keywordMap = {};
    this.tagMap = {};
    this.textureProperties = {};
    this.vectorProperties = {};
  }
}

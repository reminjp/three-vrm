import * as THREE from 'three';

export class VRMMaterial {
  public name: string;
  public shader: string;
  public renderQueue: number;
  public floatProperties: { [key: string]: number };
  public vectorProperties: { [key: string]: THREE.Vector4 };
  public textureProperties: { [key: string]: THREE.Texture };
  public keywordMap: { [key: string]: any };
  public tagMap: { [key: string]: string };

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

  public async fromObject(object: any, parser?: any) {
    this.name = object.name;
    this.shader = object.shader;
    this.renderQueue = object.renderQueue;

    for (const key of Object.keys(object.floatProperties)) {
      this.floatProperties[key] = Number(object.floatProperties[key]);
    }

    for (const key of Object.keys(object.vectorProperties)) {
      const array = object.vectorProperties[key];
      array.length = 4;
      this.vectorProperties[key] = new THREE.Vector4().fromArray(array);
    }

    for (const key of Object.keys(object.textureProperties)) {
      if (parser) {
        this.textureProperties[key] = await parser.loadTexture(object.textureProperties[key]);
        // this.textureProperties[key].encoding = THREE.sRGBEncoding;
      } else {
        this.textureProperties[key] = null;
      }
    }

    for (const key of Object.keys(object.keywordMap)) {
      this.keywordMap[key] = object.keywordMap[key];
    }

    for (const key of Object.keys(object.tagMap)) {
      this.tagMap[key] = object.tagMap[key];
    }
  }
}

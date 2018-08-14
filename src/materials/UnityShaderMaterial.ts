import * as THREE from 'three';
import { MaterialProperty } from '../data/MaterialProperty';
import MToonFragmentShader from '../shaders/mtoon_frag.glsl';
import MToonVertexShader from '../shaders/mtoon_vert.glsl';
import UnlitFragmentShader from '../shaders/unlit_frag.glsl';
import UnlitVertexShader from '../shaders/unlit_vert.glsl';

const defaultParameters = new Map<string, THREE.ShaderMaterialParameters>([
  [
    'VRM/UnlitTexture',
    {
      defines: {},
      uniforms: { f_Cutoff: 0.0, v_Color: { value: [1.0, 1.0, 1.0, 1.0] } },
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
      lights: false,
    },
  ],
  [
    'VRM/UnlitCutout',
    {
      defines: {},
      uniforms: { f_Cutoff: 0.0, v_Color: { value: [1.0, 1.0, 1.0, 1.0] } },
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
      lights: false,
    },
  ],
  [
    'VRM/UnlitTransparent',
    {
      defines: {},
      uniforms: { f_Cutoff: 0.0, v_Color: { value: [1.0, 1.0, 1.0, 1.0] } },
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
      lights: false,
    },
  ],
  [
    'VRM/UnlitTransparentZWrite',
    {
      defines: {},
      uniforms: { f_Cutoff: 0.0, v_Color: { value: [1.0, 1.0, 1.0, 1.0] } },
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
      lights: false,
    },
  ],
  [
    'VRM/MToon',
    {
      defines: {},
      uniforms: { ...THREE.UniformsLib.lights, v_Color: { value: [1.0, 1.0, 1.0, 1.0] } },
      vertexShader: MToonVertexShader,
      fragmentShader: MToonFragmentShader,
      lights: true,
    },
  ],
]);

export class UnityShaderMaterial extends THREE.ShaderMaterial {
  [key: string]: any;

  constructor(parameters?: THREE.ShaderMaterialParameters) {
    super(parameters);

    Object.assign(this.uniforms, { v_Color: { value: [1.0, 0.0, 1.0, 1.0] } });
    this.vertexShader = UnlitVertexShader;
    this.fragmentShader = UnlitFragmentShader;
  }

  public fromMaterialProperty(property: MaterialProperty) {
    this.name = property.name;

    if (!defaultParameters.has(property.shader)) {
      return;
    }

    const parameters = defaultParameters.get(property.shader);

    const defines: any = {};
    const uniforms: any = {};

    for (const key of Object.keys(property.floatProperties)) {
      uniforms['f' + key] = { value: property.floatProperties[key] };
    }

    for (const key of Object.keys(property.keywordMap)) {
      defines[key] = property.keywordMap[key];
    }

    // for (const key of Object.keys(property.tagMap)) {
    //   uniforms[key] = { value: property.tagMap[key] };
    // }

    for (const key of Object.keys(property.textureProperties)) {
      uniforms['t' + key] = { value: property.textureProperties[key] };
    }

    for (const key of Object.keys(property.vectorProperties)) {
      const array = property.vectorProperties[key];
      array.length = 4;
      uniforms['v' + key] = { value: array };
    }

    Object.assign(this.defines, parameters.defines);
    Object.assign(this.defines, defines);

    Object.assign(this.uniforms, parameters.uniforms);
    Object.assign(this.uniforms, uniforms);

    this.vertexShader = parameters.vertexShader;
    this.fragmentShader = parameters.fragmentShader;
    this.lights = parameters.lights;
  }
}

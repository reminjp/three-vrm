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
      uniforms: {},
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
    },
  ],
  [
    'VRM/UnlitCutout',
    {
      defines: {},
      uniforms: {},
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
    },
  ],
  [
    'VRM/UnlitTransparent',
    {
      defines: {},
      uniforms: {},
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
    },
  ],
  [
    'VRM/UnlitTransparentZWrite',
    {
      defines: {},
      uniforms: {},
      vertexShader: UnlitVertexShader,
      fragmentShader: UnlitFragmentShader,
    },
  ],
  [
    'VRM/MToon',
    {
      defines: {},
      uniforms: {},
      vertexShader: MToonVertexShader,
      fragmentShader: MToonFragmentShader,
    },
  ],
]);

export class UnityShaderMaterial extends THREE.RawShaderMaterial {
  [key: string]: any;

  constructor(parameters?: THREE.ShaderMaterialParameters) {
    super(parameters);

    this.uniforms = THREE.UniformsUtils.merge([this.uniforms, { _Color: { value: new THREE.Color(0xff00ff) } }]);
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
      uniforms[key] = { value: property.floatProperties[key] };
    }

    for (const key of Object.keys(property.keywordMap)) {
      defines[key] = property.keywordMap[key];
    }

    // for (const key of Object.keys(property.tagMap)) {
    //   uniforms[key] = { value: property.tagMap[key] };
    // }

    for (const key of Object.keys(property.textureProperties)) {
      uniforms[key] = { value: property.textureProperties[key] };
    }

    for (const key of Object.keys(property.vectorProperties)) {
      uniforms[key] = { value: property.vectorProperties[key] };
    }

    Object.assign(this.defines, Object.assign(parameters.defines, defines));
    this.uniforms = THREE.UniformsUtils.merge([this.uniforms, parameters.uniforms, uniforms]);
    this.vertexShader = parameters.vertexShader;
    this.fragmentShader = parameters.fragmentShader;

    this.needsUpdate = true;
  }
}

import * as THREE from 'three';
import { MaterialProperty } from '../data/MaterialProperty';
import lights_mtoon_pars_fragment from '../shaders/lights_mtoon_pars_fragment.glsl';
import mtoon_frag from '../shaders/mtoon_frag.glsl';
import mtoon_uniforms from '../shaders/mtoon_uniforms.glsl';
import mtoon_vert from '../shaders/mtoon_vert.glsl';
import unlit_frag from '../shaders/unlit_frag.glsl';
import unlit_vert from '../shaders/unlit_vert.glsl';

Object.assign(THREE.ShaderChunk, {
  mtoon_uniforms,
  lights_mtoon_pars_fragment,
});

const defaultParameters = new Map<string, THREE.ShaderMaterialParameters>([
  [
    'VRM/UnlitTexture',
    {
      defines: {},
      uniforms: {
        ...THREE.ShaderLib.basic.uniforms,
        f_Cutoff: { value: 0.0 },
        v_Color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
      },
      vertexShader: unlit_vert,
      fragmentShader: unlit_frag,
      lights: false,
    },
  ],
  [
    'VRM/UnlitCutout',
    {
      defines: {},
      uniforms: {
        ...THREE.ShaderLib.basic.uniforms,
        f_Cutoff: { value: 0.0 },
        v_Color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
      },
      vertexShader: unlit_vert,
      fragmentShader: unlit_frag,
      lights: false,
    },
  ],
  [
    'VRM/UnlitTransparent',
    {
      defines: {},
      uniforms: {
        ...THREE.ShaderLib.basic.uniforms,
        f_Cutoff: { value: 0.0 },
        v_Color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
      },
      vertexShader: unlit_vert,
      fragmentShader: unlit_frag,
      lights: false,
    },
  ],
  [
    'VRM/UnlitTransparentZWrite',
    {
      defines: {},
      uniforms: {
        ...THREE.ShaderLib.basic.uniforms,
        f_Cutoff: { value: 0.0 },
        v_Color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
      },
      vertexShader: unlit_vert,
      fragmentShader: unlit_frag,
      lights: false,
    },
  ],
  [
    'VRM/MToon',
    {
      defines: {},
      uniforms: {
        ...THREE.ShaderLib.phong.uniforms,
        f_Cutoff: { value: 0.0 },
        v_Color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
      },
      vertexShader: mtoon_vert,
      fragmentShader: mtoon_frag,
      lights: true,
    },
  ],
]);

const convertParameters = new Map<string, (material: UnityShaderMaterial) => void>([
  [
    'common',
    material => {
      if (material.uniforms.f_Cutoff) {
        material.defines.ALPHATEST = (material.uniforms.f_Cutoff.value as number).toFixed(6);
      }

      const color = material.uniforms.v_Color.value;
      material.uniforms.diffuse = { value: new THREE.Color(color.x, color.y, color.z) };
      material.uniforms.opacity = { value: color.w };

      if (material.uniforms.t_MainTex) {
        material.map = material.uniforms.t_MainTex.value;
        material.uniforms.map = material.uniforms.t_MainTex;
      }
    },
  ],
  ['VRM/UnlitTexture', material => null],
  ['VRM/UnlitCutout', material => null],
  ['VRM/UnlitTransparent', material => null],
  ['VRM/UnlitTransparentZWrite', material => null],
  [
    'VRM/MToon',
    material => {
      material.uniforms.shininess = { value: 0.0 };

      switch (material.userData.RenderType) {
        case 'Opaque': {
          material.defines.ALPHATEST = 0;
          break;
        }
        case 'Cutout': {
          break;
        }
        case 'Transparent': {
          material.defines.ALPHATEST = 0;
          material.transparent = true;
          break;
        }
        case 'TransparentCutout': {
          material.transparent = true;
          break;
        }
      }

      if (material.uniforms.f_BumpScale) {
        material.bumpScale = material.uniforms.f_BumpScale.value;
      }
      if (material.uniforms.t_BumpMap) {
        material.bumpMap = material.uniforms.t_BumpMap.value;
      }

      if (material.uniforms.v_EmissionColor) {
        material.emissive = material.uniforms.v_EmissionColor.value;
      }
      if (material.uniforms.t_EmissionMap) {
        material.emissiveMap = material.uniforms.t_EmissionMap.value;
      }

      if (material.uniforms.f_CullMode) {
        switch (material.uniforms.f_CullMode.value) {
          case 0: {
            material.side = THREE.FrontSide;
            break;
          }
          case 1: {
            material.side = THREE.BackSide;
            break;
          }
          case 2: {
            material.side = THREE.DoubleSide;
            break;
          }
        }
      }
    },
  ],
]);

export class UnityShaderMaterial extends THREE.ShaderMaterial {
  [key: string]: any;

  constructor(parameters?: THREE.ShaderMaterialParameters) {
    super(parameters);

    Object.assign(this.uniforms, { v_Color: { value: new THREE.Vector4(1.0, 0.0, 1.0, 1.0) } });
    this.vertexShader = THREE.ShaderLib.basic.vertexShader;
    this.fragmentShader = THREE.ShaderLib.basic.fragmentShader;

    convertParameters.get('common')(this);
  }

  public fromMaterialProperty(property: MaterialProperty) {
    this.name = property.name;

    if (!defaultParameters.has(property.shader) || !convertParameters.has(property.shader)) {
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

    for (const key of Object.keys(property.tagMap)) {
      this.userData[key] = { value: property.tagMap[key] };
    }

    for (const key of Object.keys(property.textureProperties)) {
      uniforms['t' + key] = { value: property.textureProperties[key] };
    }

    for (const key of Object.keys(property.vectorProperties)) {
      uniforms['v' + key] = { value: property.vectorProperties[key] };
    }

    Object.assign(this.defines, parameters.defines);
    Object.assign(this.defines, defines);

    Object.assign(this.uniforms, parameters.uniforms);
    Object.assign(this.uniforms, uniforms);

    this.vertexShader = parameters.vertexShader;
    this.fragmentShader = parameters.fragmentShader;
    this.lights = parameters.lights;

    convertParameters.get('common')(this);
    convertParameters.get(property.shader)(this);
  }
}

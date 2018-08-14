uniform float f_Cutoff;
uniform vec4 v_Color;
uniform vec4 v_ShadeColor;
uniform sampler2D t_MainTex;
uniform sampler2D t_ShadeTexture;
uniform float f_BumpScale;
uniform sampler2D t_BumpMap;
uniform float f_ReceiveShadowRate;
uniform sampler2D t_ReceiveShadowTexture;
uniform float f_ShadeShift;
uniform float f_ShadeToony;
uniform float f_LightColorAttenuation;
uniform sampler2D t_SphereAdd;
uniform vec4 v_EmissionColor;
uniform sampler2D t_EmissionMap;
uniform sampler2D t_OutlineWidthTexture;
uniform float f_OutlineWidth;
uniform float f_OutlineScaledMaxDistance;
uniform vec4 v_OutlineColor;
uniform float f_OutlineLightingMix;

uniform int f_DebugMode;
uniform int f_BlendMode;
uniform int f_OutlineWidthMode;
uniform int f_OutlineColorMode;
uniform int f_CullMode; // Cull [Back | Front | Off]
uniform int f_OutlineCullMode;
uniform float f_SrcBlend; // Blend [SrcFactor] [DstFactor]
uniform float f_DstBlend; // Blend [SrcFactor] [DstFactor]
uniform int f_ZWrite; // ZWrite [On | Off]
uniform int f_IsFirstSetup;

varying mat3 vNormalMatrix;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec4 diffuseColor = vec4(v_Color.rgb, 1.0);
  vec4 texelColor = texture2D(t_MainTex, vUv);
  diffuseColor *= texelColor;
  if ( diffuseColor.a < f_Cutoff ) discard;
  vec4 color = diffuseColor;

  // Additive matcap
  vec3 viewNormal = vNormalMatrix * vNormal;
  vec2 rimUv = vec2(dot(vec3(1, 0, 0), viewNormal), -dot(vec3(0, 1, 0), viewNormal)) * 0.5 + 0.5;
  vec4 rimColor = texture2D(t_SphereAdd, rimUv);
  color += rimColor;

  // Energy conservation
  // vec4 energy = vec4(0.0); // Light color
  // float energyMax = max(0.001, max(energy.r, max(energy.g, energy.b)));
  // float colorMax = max(0.001, max(color.r, max(color.g, color.b)));
  // color *= min(energyMax, colorMax) / colorMax;

  // Emission
  vec4 emissionColor = texture2D(t_EmissionMap, vUv) * v_EmissionColor;
  color += emissionColor;

  gl_FragColor = clamp(color, 0.0, 1.0);
  gl_FragColor = sRGBToLinear(gl_FragColor);
}

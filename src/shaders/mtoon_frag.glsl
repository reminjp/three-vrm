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

// varying mat3 vNormalMatrix;
// varying vec3 vNormal;
// varying vec2 vUv;

//
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

  #include <clipping_planes_fragment>

  vec4 diffuseColor = vec4( diffuse, opacity );
  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  vec3 totalEmissiveRadiance = emissive;

  #include <logdepthbuf_fragment>
  #include <map_fragment>
  #include <color_fragment>
  #include <alphamap_fragment>
  #include <alphatest_fragment>
  #include <specularmap_fragment>
  #include <normal_fragment_begin>
  #include <normal_fragment_maps>
  #include <emissivemap_fragment>

  // accumulation
  #include <lights_phong_fragment>
  #include <lights_fragment_begin>
  #include <lights_fragment_maps>
  #include <lights_fragment_end>

  // modulation
  #include <aomap_fragment>

  vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

  #include <envmap_fragment>

  outgoingLight = clamp(outgoingLight, 0.0, 1.0);

  // MToon additive matcap
  vec3 viewNormal = normalize(normal);
  vec2 rimUv = vec2(dot(vec3(1.0, 0.0, 0.0), normal), -dot(vec3(0.0, 1.0, 0.0), normal)) * 0.5 + 0.5;
  vec4 rimColor = texture2D(t_SphereAdd, rimUv);
  outgoingLight += rimColor.rgb;

  gl_FragColor = vec4( outgoingLight, diffuseColor.a );

  #include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>
  #include <premultiplied_alpha_fragment>
  #include <dithering_fragment>

}

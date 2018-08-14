uniform float f_Cutoff;
// uniform int f_CullMode;
uniform sampler2D t_MainTex;
uniform sampler2D t_SphereAdd;
uniform vec4 v_Color;
varying mat3 vNormalMatrix;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec4 diffuseColor = vec4(v_Color.rgb, 1.0);
  vec4 texelColor = texture2D(t_MainTex, vUv);
  diffuseColor *= texelColor;
  if ( diffuseColor.a < f_Cutoff ) discard;
  vec4 color = diffuseColor;

  vec3 viewNormal = vNormalMatrix * vNormal;
  vec2 rimUv = vec2(dot(vec3(1, 0, 0), viewNormal), -dot(vec3(0, 1, 0), viewNormal)) * 0.5 + 0.5;
  vec4 rimColor = texture2D(t_SphereAdd, rimUv);
  color += rimColor;

  gl_FragColor = clamp(color, 0.0, 1.0);
  gl_FragColor = sRGBToLinear(gl_FragColor);
}

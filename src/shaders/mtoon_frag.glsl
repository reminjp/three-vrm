uniform float f_Cutoff;
uniform sampler2D t_MainTex;
uniform sampler2D t_SphereAdd;
uniform vec4 v_Color;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec4 diffuseColor = vec4(v_Color.rgb, 1.0);
  vec4 texelColor = texture2D(t_MainTex, vUv);
  diffuseColor *= texelColor;
  if ( diffuseColor.a < f_Cutoff ) discard;
  vec4 color = diffuseColor;

  vec3 viewUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 viewRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec2 rimUv = vec2(dot(viewRight, vNormal), dot(viewUp, vNormal)) * 0.5 + 0.5;
  vec4 rimColor = texture2D(t_SphereAdd, rimUv);
  color += rimColor;

  gl_FragColor = color;
  gl_FragColor = sRGBToLinear(gl_FragColor);
}

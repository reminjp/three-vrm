uniform float f_Cutoff;
uniform sampler2D t_MainTex;
uniform vec4 v_Color;
varying vec2 vUv;

void main() {
  vec4 diffuseColor = vec4(v_Color.rgb, 1.0);
  vec4 texelColor = texture2D(t_MainTex, vUv);
  diffuseColor *= texelColor;
  if ( diffuseColor.a < f_Cutoff ) discard;

  gl_FragColor = diffuseColor;
  gl_FragColor = sRGBToLinear(gl_FragColor);
}

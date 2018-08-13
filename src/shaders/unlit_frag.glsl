uniform sampler2D t_MainTex;
uniform vec4 v_Color;
varying vec2 vUv;

void main() {
  vec4 color = vec4(1.0);
  color.rgb = v_Color.rgb;

  vec4 texelColor = texture2D(t_MainTex, vUv);
  texelColor = sRGBToLinear(texelColor);
  color *= texelColor;

  gl_FragColor = color;
}

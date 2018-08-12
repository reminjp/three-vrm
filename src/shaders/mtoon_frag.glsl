precision highp float;
precision highp int;

uniform sampler2D _MainTex;
varying vec2 vUv;
varying vec4 vColor;

void main() {
  vec4 color = vColor;
  vec4 texelColor = texture2D(_MainTex, vUv);
  color *= texelColor;
  gl_FragColor = color;
}

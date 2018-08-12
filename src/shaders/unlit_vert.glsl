precision highp float;
precision highp int;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec2 uv;
attribute vec3 color;

varying vec2 vUv;
varying vec4 vColor;

void main() {
  vUv = uv;
  vColor = vec4(color, 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}

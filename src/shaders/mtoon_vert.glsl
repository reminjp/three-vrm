varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vNormal = (modelMatrix * vec4(normal, 1.0)).xyz;
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}

varying mat3 vNormalMatrix;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vNormalMatrix = normalMatrix;
  vNormal = normal;
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}

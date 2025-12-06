// nodeVertex.glsl
uniform float uTime;
// uniform float uSize; // 제거
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    float pulse = sin(uTime * 2.0) * 0.05 + 1.0;
    vec3 scaledPosition = position * pulse;  // uSize 제거
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
    vPosition = scaledPosition;
}
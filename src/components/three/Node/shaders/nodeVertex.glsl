// Node vertex shader
uniform float uTime;
uniform float uSize;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vPosition = position;
    vNormal = normal;
    vUv = uv;

    // Add subtle pulsing animation
    float pulse = sin(uTime * 2.0) * 0.05 + 1.0;
    vec3 scaledPosition = position * pulse;

    vec4 modelPosition = modelMatrix * vec4(scaledPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}

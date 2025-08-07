// Station vertex shader
uniform float uTime;
uniform float uSize;
uniform float uStationType;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vPosition = position;
    vNormal = normal;
    vUv = uv;

    // Different animation based on station type
    float animationSpeed = uStationType == 1.0 ? 3.0 : uStationType == 2.0 ? 2.0 : 1.0;
    float pulse = sin(uTime * animationSpeed) * 0.03 + 1.0;
    
    vec3 scaledPosition = position * pulse;

    vec4 modelPosition = modelMatrix * vec4(scaledPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}

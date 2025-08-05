// Edge vertex shader
uniform float uTime;
uniform float uLength;
varying vec3 vPosition;
varying float vProgress;

void main() {
    vPosition = position;

    // Calculate progress along the edge (0.0 to 1.0)
    vProgress = (position.x + uLength * 0.5) / uLength;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}
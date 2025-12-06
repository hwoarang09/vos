// Vehicle vertex shader
uniform float uTime;
uniform float uStatus; // 0: idle, 1: moving, 2: charging, 3: error
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Different animation based on vehicle status
    // Moving: faster pulse, Charging: slow pulse, Idle: minimal pulse, Error: rapid pulse
    float animationSpeed = uStatus == 1.0 ? 3.0 : uStatus == 2.0 ? 1.5 : uStatus == 3.0 ? 5.0 : 0.5;
    float pulse = sin(uTime * animationSpeed) * 0.03 + 1.0;

    vec3 scaledPosition = position * pulse;

    // Apply instance matrix for InstancedMesh
    vec4 instancePosition = instanceMatrix * vec4(scaledPosition, 1.0);

    gl_Position = projectionMatrix * viewMatrix * instancePosition;
    vPosition = instancePosition.xyz;
}


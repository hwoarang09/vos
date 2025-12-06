// Vehicle fragment shader
uniform vec3 uColor;
uniform float uOpacity;
uniform float uStatus; // 0: idle, 1: moving, 2: charging, 3: error
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // Base color
    vec3 color = uColor;
    
    // Add status-based effects
    if (uStatus == 3.0) {
        // Error state: add red pulsing
        float errorPulse = sin(vPosition.x * 10.0 + vPosition.y * 10.0) * 0.5 + 0.5;
        color = mix(color, vec3(1.0, 0.0, 0.0), errorPulse * 0.3);
    } else if (uStatus == 2.0) {
        // Charging state: add green tint
        color = mix(color, vec3(0.0, 1.0, 0.0), 0.2);
    }
    
    // Simple lighting based on normal
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(vNormal, lightDir), 0.3);
    
    gl_FragColor = vec4(color * diffuse, uOpacity);
}


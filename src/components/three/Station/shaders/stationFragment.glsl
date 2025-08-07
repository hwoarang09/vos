// Station fragment shader
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSize;
uniform float uStationType;
uniform float uIsPreview;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    if (uIsPreview > 0.5) {
        // Preview mode: wireframe effect
        
        // Create wireframe pattern
        vec2 grid = abs(fract(vUv * 8.0) - 0.5);
        float line = smoothstep(0.0, 0.05, min(grid.x, grid.y));
        
        vec3 wireColor = uColor * 0.7;
        float wireAlpha = (1.0 - line) * 0.8 * uOpacity;
        
        if (wireAlpha < 0.01) discard;
        
        gl_FragColor = vec4(wireColor, wireAlpha);
    } else {
        // Normal mode: different colors based on station type
        
        vec3 baseColor = uColor;
        
        // Modify color based on station type
        if (uStationType == 1.0) {
            // Loading station - warmer color
            baseColor = mix(baseColor, vec3(1.0, 0.6, 0.2), 0.3);
        } else if (uStationType == 2.0) {
            // Unloading station - cooler color
            baseColor = mix(baseColor, vec3(0.2, 0.6, 1.0), 0.3);
        }
        
        // Simple lighting calculation
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
        float lightIntensity = max(dot(vNormal, lightDirection), 0.4);
        
        // Add type-specific animation
        float animationSpeed = uStationType == 1.0 ? 3.0 : uStationType == 2.0 ? 2.0 : 1.0;
        float pulse = sin(uTime * animationSpeed) * 0.15 + 0.85;
        
        vec3 finalColor = baseColor * lightIntensity * pulse;
        
        gl_FragColor = vec4(finalColor, uOpacity);
    }
}

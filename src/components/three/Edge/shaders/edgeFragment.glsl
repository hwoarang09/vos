// Edge fragment shader
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vPosition;
varying float vProgress;

void main() {
    // Create a simple gradient effect along the edge
    float alpha = uOpacity;

    // Optional: Add some animation or effects
    float pulse = sin(uTime * 2.0 + vProgress * 10.0) * 0.1 + 0.9;

    vec3 finalColor = uColor * pulse;

    gl_FragColor = vec4(finalColor, alpha);
}
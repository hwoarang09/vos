// Node fragment shader
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSize;
uniform float uIsPreview;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    if (uIsPreview > 0.5) {
        // Preview mode: dotted border with semi-transparent interior
        
        // Create dotted pattern based on UV coordinates
        vec2 center = vec2(0.5, 0.5);
        float distFromCenter = distance(vUv, center);
        
        // Create dotted border effect
        float dotPattern = step(0.5, fract(distFromCenter * 20.0));
        float borderThreshold = 0.4;
        float isBorder = step(borderThreshold, distFromCenter);
        
        // Combine dotted pattern with border
        float borderAlpha = dotPattern * isBorder;
        
        // Interior with semi-transparent color
        float interiorAlpha = (1.0 - isBorder) * 0.3;
        vec3 darkColor = uColor * 0.5;
        
        // Final color mixing
        vec3 finalColor = mix(darkColor, uColor, isBorder);
        float finalAlpha = max(borderAlpha, interiorAlpha) * uOpacity;
        
        // Discard completely transparent pixels
        if (finalAlpha < 0.01) discard;
        
        gl_FragColor = vec4(finalColor, finalAlpha);
    } else {
        // Normal mode: solid color with lighting
        
        // Simple lighting calculation
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
        float lightIntensity = max(dot(vNormal, lightDirection), 0.3);
        
        // Add subtle animation
        float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
        
        vec3 finalColor = uColor * lightIntensity * pulse;
        
        gl_FragColor = vec4(finalColor, uOpacity);
    }
}

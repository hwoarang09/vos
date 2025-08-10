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
        // Apply uSize to keep dot spacing and border width visually consistent

        // Create dotted pattern based on UV coordinates
        vec2 center = vec2(0.5, 0.5);
        float distFromCenter = distance(vUv, center);

        // Use inverse of size so smaller nodes keep reasonable dot density
        float sz = max(uSize, 0.05);
        float dotPattern = step(0.5, fract(distFromCenter * (20.0 / sz)));

        // Use smoothstep band for border width that scales with size
        float borderThreshold = 0.4;
        float borderWidth = clamp(0.15 / sz, 0.02, 0.3);
        float isBorder = smoothstep(borderThreshold, borderThreshold + borderWidth, distFromCenter);

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

        // Strong pulsing animation with transparency
        float pulse = sin(uTime * 3.5) * 0.3 + 0.7; // 0.4~1.0 range (더 강한 변화)
        float alphaPulse = sin(uTime * 3.5 + 0.5) * 0.2 + 0.8; // 0.6~1.0 range

        vec3 finalColor = uColor * lightIntensity * pulse;
        float finalAlpha = uOpacity * alphaPulse;

        gl_FragColor = vec4(finalColor, finalAlpha);
    }
}

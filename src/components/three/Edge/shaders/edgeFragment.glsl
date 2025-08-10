// Edge fragment shader
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uIsPreview;
varying vec3 vPosition;
varying float vProgress;
varying vec2 vUv;

void main() {
    if (uIsPreview > 0.5) {
        // Preview mode: thinner border, shorter dash spacing, pulsing center

        // Shorter dash spacing along the edge length (U direction)
        float dotPattern = step(0.5, fract(vUv.x * 40.0));

        // Distance from edge center (V direction, 0.5 is center)
        float distFromCenter = abs(vUv.y - 0.5) * 2.0;

        // Thinner border
        float borderThreshold = 0.9;
        float isBorder = step(borderThreshold, distFromCenter);

        // Combine dotted pattern with border
        float borderAlpha = dotPattern * isBorder;

        // Strong pulsing brightness and transparency
        float pulse = sin(uTime * 4.0) * 0.4 + 0.6; // 0.2~1.0 range (더 강한 변화)
        float alphaPulse = sin(uTime * 4.0 + 1.57) * 0.3 + 0.7; // 0.4~1.0 range (위상 차이)

        float interiorAlpha = (1.0 - isBorder) * 0.15 * alphaPulse;
        vec3 interiorColor = uColor * pulse * 0.8; // 더 어두워질 수 있게
        vec3 borderColor = uColor * (pulse * 0.5 + 0.5); // 테두리도 펄싱

        // Final color mixing
        vec3 finalColor = mix(interiorColor, borderColor, isBorder);
        float finalAlpha = max(borderAlpha * alphaPulse, interiorAlpha) * uOpacity;

        // Discard completely transparent pixels
        if (finalAlpha < 0.01) discard;

        gl_FragColor = vec4(finalColor, finalAlpha);
    } else {
        // Normal mode
        float alpha = uOpacity;
        float pulse = sin(uTime * 2.0 + vProgress * 10.0) * 0.1 + 0.9;
        vec3 finalColor = uColor * pulse;
        gl_FragColor = vec4(finalColor, alpha);
    }
}
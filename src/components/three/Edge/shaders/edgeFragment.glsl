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
        // Preview mode: dotted border with semi-transparent dark interior

        // Create dotted pattern along the edge length (U direction)
        float dotPattern = step(0.5, fract(vUv.x * 15.0));

        // Distance from edge center (V direction, 0.5 is center)
        float distFromCenter = abs(vUv.y - 0.5) * 2.0;

        // Create border effect - only show dots at the edges
        float borderThreshold = 0.7;
        float isBorder = step(borderThreshold, distFromCenter);

        // Combine dotted pattern with border
        float borderAlpha = dotPattern * isBorder;

        // Interior with semi-transparent dark color
        float interiorAlpha = (1.0 - isBorder) * 0.2;
        vec3 darkColor = uColor * 0.4; // Darker version of the color

        // Final color mixing
        vec3 finalColor = mix(darkColor, uColor, isBorder);
        float finalAlpha = max(borderAlpha, interiorAlpha) * uOpacity;

        // Discard completely transparent pixels
        if (finalAlpha < 0.01) discard;

        gl_FragColor = vec4(finalColor, finalAlpha);
    } else {
        // Normal mode: original behavior
        float alpha = uOpacity;

        // Optional: Add some animation or effects
        float pulse = sin(uTime * 2.0 + vProgress * 10.0) * 0.1 + 0.9;

        vec3 finalColor = uColor * pulse;

        gl_FragColor = vec4(finalColor, alpha);
    }
}
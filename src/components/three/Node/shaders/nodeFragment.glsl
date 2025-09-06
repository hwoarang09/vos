
// Edge fragment shader - 간단한 단일 색상 버전
uniform vec3 uColor;
uniform float uOpacity;

void main() {
    gl_FragColor = vec4(uColor, uOpacity);
}
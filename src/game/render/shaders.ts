export const lavaVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 displaced = position;
    displaced.z += sin(position.x * 0.28 + uTime * 0.8) * 0.22 + sin(position.y * 0.36 - uTime * 0.5) * 0.16;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const lavaFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float flow = sin(vUv.x * 14.0 + uTime * 0.9) * sin(vUv.y * 11.0 - uTime * 0.6);
    float cracks = smoothstep(0.05, 0.85, flow * 0.5 + 0.5);
    vec3 color = mix(vec3(0.18, 0.035, 0.012), vec3(1.0, 0.32, 0.05), cracks);
    color = mix(color, vec3(1.0, 0.82, 0.4), smoothstep(0.72, 1.0, cracks));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const fallVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fallFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float core = smoothstep(0.5, 0.05, abs(vUv.x - 0.5));
    float flow = fract(vUv.y - uTime * 0.45);
    vec3 color = mix(vec3(0.35, 0.06, 0.015), vec3(1.0, 0.45, 0.08), core);
    color = mix(color, vec3(1.0, 0.9, 0.55), step(0.72, flow) * core);
    gl_FragColor = vec4(color, core);
  }
`;

#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in mat3 a_boneMatrix;
void main() {
  vec3 pos = a_boneMatrix * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
}

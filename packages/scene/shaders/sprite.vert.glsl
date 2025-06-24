#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;
uniform mat3 u_world;
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  vec3 pos = u_world * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
}

#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;
layout(location = 2) in vec4 a_boneWeights;
layout(location = 3) in uvec4 a_boneIndices;
uniform mat3 u_bones[120];
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  vec3 pos = vec3(0.0);
  for (int i = 0; i < 4; ++i) {
    pos += a_boneWeights[i] * (u_bones[a_boneIndices[i]] * vec3(a_position, 1.0));
  }
  gl_Position = vec4(pos.xy, 0.0, 1.0);
}

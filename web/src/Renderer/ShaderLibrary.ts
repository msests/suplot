export const OpaqueShader = {
  label: "opaque-shader",
  code: `
struct VertexInput {
  @location(0) pos: vec4f,
  @location(1) color: vec4f,
  @location(2) texCoord: vec2f,
  @location(3) texLayer: u32,
  @location(4) op: u32,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) @interpolate(flat) texLayer: u32,
  @location(3) @interpolate(flat) op: u32,
};

@group(0) @binding(0) var fontSampler: sampler;
@group(0) @binding(1) var fontTexture: texture_2d_array<f32>;

@vertex fn vs(
  @location(0) pos: vec4f,
  @location(1) color: vec4f,
  @location(2) texCoord: vec2f,
  @location(3) texLayer: u32,
  @location(4) op: u32,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = pos;
    output.color = color;
    output.texCoord = texCoord;
    output.texLayer = texLayer;
    output.op = op;
    return output;
}

@fragment fn fs(vout: VertexOutput) -> @location(0) vec4f {
  // Always sample the texture in uniform control flow
  let texColor = textureSample(fontTexture, fontSampler, vout.texCoord, vout.texLayer);

  switch vout.op {
    case 0: {
      return vout.color;
    }
    case 1: {
      return vout.color * texColor;
    }
    default: {
      return texColor; // Default color
    }
  }
}
  `,
  vertexBufferLayout: [
    {
      arrayStride: 40,
      attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x4" }, // position
        { shaderLocation: 1, offset: 16, format: "float32x4" }, // color
        { shaderLocation: 2, offset: 32, format: "float32x2" }, // texCoord
      ],
    },
    {
      arrayStride: 8,
      attributes: [
        { shaderLocation: 3, offset: 0, format: "uint32" }, // texLayer
        { shaderLocation: 4, offset: 4, format: "uint32" }, // op
      ],
    },
  ],
};

import { RenderContext } from "./BrowserRenderer";

export async function createWebGpuContext(
  canvas: HTMLCanvasElement
): Promise<RenderContext> {
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) {
    throw new Error("WebGPU is not supported on this device");
  }

  const device = await adapter.requestDevice({
    requiredFeatures: ["texture-compression-bc", "depth-clip-control"],
  });

  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("WebGPU is not supported on this device");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: format,
    alphaMode: "premultiplied",
  });

  return { adapter, device, context, canvas };
}

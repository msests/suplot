import { Transform2D } from "../Scene2D/Transform";
import { perfMon } from "../Misc/Perf";
import { OpaqueShader } from "./ShaderLibrary";
import { IRenderTask } from "../../../public/Protocol";
import { PureColor } from "../Misc/Color";

export interface RenderContext {
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  canvas: HTMLCanvasElement;
}

class BrowserRenderer {
  private context: RenderContext;
  private preferredFormat: GPUTextureFormat;

  private sampleCount = 4;
  private onePixel: number;

  private commandEncoder: GPUCommandEncoder;
  private renderPassDescriptor: GPURenderPassDescriptor;
  private passEncoder: GPURenderPassEncoder;

  private pipelines: Map<string, GPURenderPipeline> = new Map();

  constructor(context: RenderContext) {
    this.context = context;

    this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.context.configure({
      device: this.context.device,
      format: this.preferredFormat,
      alphaMode: "premultiplied",
    });
  }

  async fetchRenderTask(): Promise<IRenderTask> {
    const port = __DEV__ ? 12000 : 16000;
    const task = await fetch(`http://localhost:${port}/api/get-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return await task.json();
  }

  private createOpaquePipeline() {
    const { label, code, vertexBufferLayout } = OpaqueShader;

    const module = this.context.device.createShaderModule({
      label,
      code,
    });

    this.pipelines.set(
      "opaque",
      this.context.device.createRenderPipeline({
        label: "opaque-pipeline",
        layout: "auto",
        vertex: {
          module,
          buffers: vertexBufferLayout as GPUVertexBufferLayout[],
        },
        fragment: {
          module,
          targets: [
            {
              format: this.preferredFormat,
              blend: {
                color: {
                  operation: "add",
                  srcFactor: "src-alpha",
                  dstFactor: "one-minus-src-alpha",
                },
                alpha: {
                  operation: "add",
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                },
              },
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
        },
        multisample: {
          count: this.sampleCount,
        },
      })
    );
  }

  private renderOpaque(task: IRenderTask) {
    const { canvas } = this.context.context;
    const transformer = new Transform2D({
      device: this.context.device,
      task,
      canvas: {
        width: canvas.width,
        height: canvas.height,
      },
    });
    transformer.transform();

    const { vertexes, indices, textures } = transformer.ShaderBuffers;

    const vertexRaw = new Float32Array(vertexes.length * 10);
    for (let i = 0; i < vertexes.length; i++) {
      const vertex = vertexes[i];
      vertexRaw.set(vertex.position, i * 10);
      vertexRaw.set(vertex.color, i * 10 + 4);
      vertexRaw.set(vertex.texCoord, i * 10 + 8);
    }
    const vertexBuffer = this.context.device.createBuffer({
      size: vertexRaw.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.context.device.queue.writeBuffer(vertexBuffer, 0, vertexRaw);

    const vertexRaw2 = new Uint32Array(vertexes.length * 2);
    for (let i = 0; i < vertexes.length; i++) {
      const vertex = vertexes[i];
      vertexRaw2.set([vertex.texLayer], i * 2);
      vertexRaw2.set([vertex.op], i * 2 + 1);
    }
    const vertexBuffer2 = this.context.device.createBuffer({
      size: vertexRaw2.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.context.device.queue.writeBuffer(vertexBuffer2, 0, vertexRaw2);

    const indexRaw = new Uint32Array(indices);
    for (let i = 0; i < indices.length; i++) {
      indexRaw.set([indices[i]], i);
    }

    const indexBuffer = this.context.device.createBuffer({
      size: indexRaw.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.context.device.queue.writeBuffer(indexBuffer, 0, indexRaw);

    const sampler = this.context.device.createSampler({
      label: "texture-sampler",
      magFilter: "nearest",
      minFilter: "nearest",
      mipmapFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    const bindGroup = this.context.device.createBindGroup({
      label: "BindGroup",
      layout: this.pipelines.get("opaque")!.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        ...textures.map((texture, index) => ({
          binding: index + 1,
          resource: texture.createView(),
        })),
      ],
    });

    this.passEncoder.setBindGroup(0, bindGroup);
    this.passEncoder.setPipeline(this.pipelines.get("opaque")!);
    this.passEncoder.setVertexBuffer(0, vertexBuffer);
    this.passEncoder.setVertexBuffer(1, vertexBuffer2);
    this.passEncoder.setIndexBuffer(indexBuffer, "uint32");
    this.passEncoder.drawIndexed(indexRaw.length, 1, 0, 0, 0);
  }

  private prepareCanvas(task: IRenderTask): [number, number] {
    const width = task.figureSize ? task.figureSize[0] : 600,
      height = task.figureSize ? task.figureSize[1] : 600;

    const canvas = this.context.canvas;
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    return [width * devicePixelRatio, height * devicePixelRatio];
  }

  async render() {
    const task = await this.fetchRenderTask();

    const [width, height] = this.prepareCanvas(task);
    const bgColor = PureColor.fromValues(
      task.scene2D?.background || [255, 255, 255, 0]
    );

    __PERFMON__ && perfMon.start("render");

    this.commandEncoder = this.context.device.createCommandEncoder();

    const msaaTexture =
      this.sampleCount > 1
        ? this.context.device.createTexture({
            size: [width, height],
            sampleCount: this.sampleCount,
            format: this.preferredFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          })
        : null;

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: msaaTexture
            ? msaaTexture.createView()
            : this.context.context.getCurrentTexture().createView(),
          resolveTarget: msaaTexture
            ? this.context.context.getCurrentTexture().createView()
            : undefined,
          clearValue: {
            r: bgColor.R,
            g: bgColor.G,
            b: bgColor.B,
            a: bgColor.A,
          },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };
    this.passEncoder = this.commandEncoder.beginRenderPass(
      this.renderPassDescriptor
    );

    this.createOpaquePipeline();
    this.renderOpaque(task);

    this.passEncoder.end();
    this.context.device.queue.submit([this.commandEncoder.finish()]);

    // Wait for GPU command completion
    try {
      await this.context.device.queue.onSubmittedWorkDone();
      __PERFMON__ && perfMon.end("render");
    } catch (error) {}

    __PERFMON__ && perfMon.print();
  }
}

export { BrowserRenderer };

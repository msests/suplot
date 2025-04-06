/// <reference types="@webgpu/types" />

import { createWebGpuContext } from "./src/Renderer/WebGPUContext";
import { BrowserRenderer } from "./src/Renderer/BrowserRenderer";
import "./public/style.less";

async function main() {
  const app = document.getElementById("app") as HTMLDivElement;

  const title = document.createElement("h1");
  title.innerText = "SuperPlot - 0.0.1(Beta)";
  title.classList.add("title");
  app.appendChild(title);

  const canvas = document.createElement("canvas");
  canvas.classList.add("scene");
  app.appendChild(canvas);

  document.body.appendChild(app);

  const gpuContext = await createWebGpuContext(canvas);
  const renderer = new BrowserRenderer(gpuContext);
  function frame() {
    renderer.render();
    // requestAnimationFrame(frame);
  }
  frame();
}

main();

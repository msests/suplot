import { ColorBase } from "../Misc/Color";
import { Vertex } from "../Misc/Vertex";

export interface IRenderObject {
  type: "dot" | "line" | "circle" | "polygon" | "plot" | "text" | "image";
}

export interface IDot extends IRenderObject {
  center: Vertex;
  fill?: ColorBase;
}

// Add IText to your existing RenderObject type if you have one
export type RenderObject = IDot;

import { IAxis } from "../../../public/Protocol";
import { IRenderObject } from "./RenderObject";

export interface IScene2D {
  xAxis?: IAxis;
  yAxis?: IAxis;
  grid?: boolean;
  tick?: boolean;
  backgroundColor?: number[];
  objects: IRenderObject[];
}

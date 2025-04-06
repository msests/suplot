import { ICurve } from "../../../public/Protocol";
import { ColorBase, PureColor } from "../Misc/Color";
import { Vertex } from "../Misc/Vertex";
import { Transform2DContext } from "./Transform";

export class Curve {
  private _vertexes: Vertex[] = [];
  private _width: number;
  private _color: ColorBase;

  public get Width(): number {
    return this._width;
  }

  public get Stroke(): ColorBase {
    return this._color;
  }

  public get Vertexes(): Vertex[] {
    return this._vertexes;
  }

  public forEachVertex(
    callback: (vertex: Vertex, index: number) => void
  ): void {
    this._vertexes.forEach((vertex, index) => {
      callback(vertex, index);
    });
  }

  public static fromPlot(curve: ICurve, context: Transform2DContext): Curve {
    const instance = new Curve();
    instance._vertexes = curve.vertexes.map(
      (v) =>
        new Vertex(v.xyz, v.color ? PureColor.fromValues(v.color) : undefined)
    );
    instance._width = curve.width ?? context.pixelToWorld;
    instance._color = curve.color
      ? PureColor.fromValues(curve.color)
      : PureColor.fromRgba(0, 0, 0, 1);
    return instance;
  }
}

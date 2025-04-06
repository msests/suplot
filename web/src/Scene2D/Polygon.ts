import { IPolygon } from "../../../public/Protocol";
import { ColorBase, PureColor } from "../Misc/Color";
import { Vertex } from "../Misc/Vertex";
import { Border } from "../Misc/Border";

export class Polygon {
  private _vertexes: Vertex[] = [];
  private _borders?: Border[] = [];
  private _fill?: ColorBase;

  constructor(vertexes: Vertex[], borders?: Border[], fill?: ColorBase) {
    this._vertexes = vertexes;
    this._borders = borders;
    this._fill = fill;
  }

  public hasBorder(): boolean {
    return !!this._borders && this._borders.length > 0;
  }

  public get Fill(): ColorBase | null {
    return this._fill || null;
  }

  forEachVertex(callback: (vertex: Vertex, index: number) => void) {
    this._vertexes.forEach((vertex, index) => {
      callback(vertex, index);
    });
  }

  forEachBorder(callback: (border: Border, index: number) => void) {
    this._borders?.forEach((border, index) => {
      callback(border, index);
    });
  }

  public get Vertexes(): Vertex[] {
    return this._vertexes;
  }

  public get Borders(): Border[] | undefined {
    return this._borders;
  }

  static fromPlot(plot: IPolygon) {
    const vertexes = plot.vertexes.map(
      (v) =>
        new Vertex(v.xyz, v.color ? PureColor.fromValues(v.color) : undefined)
    );
    const borders = plot.borders?.map((b) =>
      b ? new Border(b.width as number) : new Border(0)
    );
    const fill = plot.fill ? PureColor.fromValues(plot.fill) : undefined;
    return new Polygon(vertexes, borders, fill);
  }
}

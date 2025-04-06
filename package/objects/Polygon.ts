import { IBorder, IPolygon, ISize } from "../../public/Protocol";
import { Point } from "../utils/Coordinate";
import { ColorEffect, ColorType } from "../utils/ColorEffect";
import { SceneObject } from "./Object";

export class Polygon extends SceneObject {
  /**
   * Array of vertices that define the polygon
   * @type {Point[]}
   * @protected
   */
  protected _vertices: Point[] = [];

  /**
   * Array of border specifications for each edge
   * @type {(IBorder | null)[]}
   * @protected
   */
  protected _borders: (IBorder | null)[] = [];

  /**
   * Fill color effect for the polygon
   * @type {ColorEffect | undefined}
   * @protected
   */
  protected _color?: ColorEffect; // default fill

  /**
   * Gets the last vertex in the vertices array
   * @returns The last vertex or null if no vertices exist
   * @internal
   */
  private lastVertex(): Point | null {
    return this._vertices.length > 0
      ? this._vertices[this._vertices.length - 1]
      : null;
  }

  /**
   * Sets the fill color for the polygon
   * @param color - The color to fill the polygon with
   * @returns This polygon instance for method chaining
   */
  public fill(color: ColorType): Polygon {
    this._color = this.normColor(color);
    return this;
  }

  /**
   * Adds an edge to the polygon
   * @param from - The starting point of the edge
   * @param to - The ending point of the edge
   * @param border - Optional border specifications
   * @param border.width - Width of the border
   * @returns This polygon instance for method chaining
   * @throws If the edge doesn't start from the last vertex
   */
  public edge(from: Point, to: Point, border?: { width: ISize }): Polygon {
    if (
      this._vertices.length != 0 &&
      (this.lastVertex()!.X != from.X || this.lastVertex()!.Y != from.Y)
    ) {
      throw new Error("The edge must start from the last vertex!");
    }

    if (this._vertices.length == 0) {
      this._vertices.push(from);
    }
    this._vertices.push(to);

    this._borders.push(
      border
        ? {
            width: border.width,
          }
        : null
    );
    return this;
  }

  /**
   * Converts the polygon to its internal plot representation
   * @returns An IPolygon object with the polygon data
   * @throws If the polygon has fewer than 3 vertices
   * @protected
   */
  protected toPlotInternal(): IPolygon {
    if (this._vertices.length < 3) {
      throw new Error("Polygon must have at least 3 vertices!");
    }

    return {
      type: "polygon",
      vertexes: this._vertices.map((vertex) => ({ xyz: vertex.Xyz })),
      borders: this._borders,
      fill: this._color ? this._color.getRgba() : undefined,
    };
  }

  /**
   * Converts the polygon to its final plot representation
   * @returns An IPolygon object ready for plotting
   * @throws If the polygon is not properly closed (last vertex != first vertex)
   */
  public toPlot(): IPolygon {
    if (
      this.lastVertex()!.X != this._vertices[0].X ||
      this.lastVertex()!.Y != this._vertices[0].Y
    ) {
      throw new Error("The last vertex must be the same as the first vertex!");
    }
    this._vertices.pop(); // Remove the last vertex to avoid duplication
    return this.toPlotInternal();
  }
}

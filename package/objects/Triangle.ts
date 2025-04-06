import { IBorder, IPolygon } from "../../public/Protocol";
import { ColorEffect } from "../utils/ColorEffect";
import { Point } from "../utils/Coordinate";
import { Polygon } from "./Polygon";

/**
 * A triangle shape represented by three vertices
 * @class Triangle
 * @extends Polygon
 */
export class Triangle extends Polygon {
  /**
   * Sets the three vertices of the triangle
   * @param a The first vertex with position and optional border
   * @param b The second vertex with position and optional border
   * @param c The third vertex with position and optional border
   * @returns This Triangle instance for method chaining
   */
  public vertexes(
    a: { position: Point; border?: IBorder },
    b: { position: Point; border?: IBorder },
    c: { position: Point; border?: IBorder }
  ): Triangle {
    const vertexAry = [a, b, c];
    vertexAry.forEach((vertex) => {
      this._vertices.push(vertex.position);
      this._borders.push(vertex.border);
    });
    return this;
  }

  /**
   * Sets the fill color of the triangle
   * @param color The fill color, undefined for default theme color
   * @returns This Triangle instance for method chaining
   */
  public fill(color?: ColorEffect | string): Triangle {
    super.fill(this.normColor(color));
    return this;
  }

  /**
   * Converts the triangle to a plot representation
   * @throws Error if the triangle doesn't have exactly 3 vertices
   * @returns The triangle in IPolygon format for plotting
   */
  toPlot(): IPolygon {
    if (this._vertices.length != 3) {
      throw new Error("Triangle must have exactly 3 vertices!");
    }

    return this.toPlotInternal();
  }
}

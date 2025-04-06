import { IBorder, IPolygon } from "../../public/Protocol";
import { ColorType } from "../utils/ColorEffect";
import { Point } from "../utils/Coordinate";
import { Polygon } from "./Polygon";

/**
 * A rectangle shape represented by four vertices
 * @class Rectangle
 * @extends Polygon
 */
export class Rectangle extends Polygon {
  /**
   * Sets the four vertices of the rectangle
   * @param {Object} a - The first vertex
   * @param {Point} a.position - Position of the first vertex
   * @param {IBorder} [a.border] - Optional border of the first vertex
   * @param {Object} b - The second vertex
   * @param {Point} b.position - Position of the second vertex
   * @param {IBorder} [b.border] - Optional border of the second vertex
   * @param {Object} c - The third vertex
   * @param {Point} c.position - Position of the third vertex
   * @param {IBorder} [c.border] - Optional border of the third vertex
   * @param {Object} d - The fourth vertex
   * @param {Point} d.position - Position of the fourth vertex
   * @param {IBorder} [d.border] - Optional border of the fourth vertex
   * @returns {Rectangle} This Rectangle instance for method chaining
   */
  public vertexes(
    a: { position: Point; border?: IBorder },
    b: { position: Point; border?: IBorder },
    c: { position: Point; border?: IBorder },
    d: { position: Point; border?: IBorder }
  ): Rectangle {
    const vertexAry = [a, b, c, d];
    vertexAry.forEach((vertex) => {
      this._vertices.push(vertex.position);
      this._borders.push(vertex.border);
    });
    return this;
  }

  /**
   * Sets the fill color of the rectangle
   * @param {ColorType} color - The fill color
   * @returns {Rectangle} This Rectangle instance for method chaining
   */
  public fill(color: ColorType): Rectangle {
    super.fill(this.normColor(color));
    return this;
  }

  /**
   * Converts the rectangle to a plot representation
   * @throws {Error} If the rectangle doesn't have exactly 4 vertices
   * @returns {IPolygon} The rectangle in IPolygon format for plotting
   */
  toPlot(): IPolygon {
    if (this._vertices.length != 4) {
      throw new Error("Rectangle must have exactly 4 vertices!");
    }

    return this.toPlotInternal();
  }
}

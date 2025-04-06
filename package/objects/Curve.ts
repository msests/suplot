import { ICurve } from "../../public/Protocol";
import { assertLenGtTwo, isNum } from "../utils/Assert";
import { ColorEffect } from "../utils/ColorEffect";
import { Point } from "../utils/Coordinate";
import { SceneObject } from "./Object";

/**
 * A curve scene object represented by a series of connected points
 * @class Curve
 * @extends SceneObject
 */
export class Curve extends SceneObject {
  /**
   * Array of points that define the curve
   * @internal
   */
  private _points: Point[] = [];

  /**
   * The color of each point in the curve
   * If undefined for a point, uses default color
   * @internal
   */
  private _colors: (ColorEffect | undefined)[] = []; // default color

  /**
   * The width of the curve's stroke
   * If undefined, default to 1px
   * If 0, no stroke
   * If > 0, stroke width
   * @internal
   */
  private _width?: number;

  /**
   * The color of the curve's stroke
   * If undefined, default to theme color
   * @internal
   */
  private _stroke?: ColorEffect; // default fill

  /**
   * Creates a new Curve instance
   */
  constructor() {
    super();
  }

  /**
   * Adds a point to the curve with specified position and optional color
   * @param position The point position
   * @param color Optional color for this specific point
   * @returns This Curve instance for method chaining
   */
  public point(position: Point, color?: ColorEffect | string): Curve;
  /**
   * Adds a point to the curve with specified coordinates and optional color
   * @param x The x-coordinate of the point
   * @param y The y-coordinate of the point
   * @param color Optional color for this specific point
   * @returns This Curve instance for method chaining
   */
  public point(x: number, y: number, color?: ColorEffect | string): Curve;
  public point(...args: any): Curve {
    if (args[0] instanceof Point) {
      this._points.push(args[0]);
      this._colors.push(this.normColor(args[1]));
    } else if (isNum(args[0]) && isNum(args[1])) {
      this._points.push(this.normPoint([args[0], args[1]]));
      this._colors.push(this.normColor(args[2]));
    }
    return this;
  }

  /**
   * Sets the width of the curve's stroke
   * @param width The width in pixels, undefined for default (1px), 0 for no stroke
   * @returns This Curve instance for method chaining
   */
  public width(width?: number): Curve {
    this._width = width;
    return this;
  }

  /**
   * Sets the color of the curve's stroke
   * @param color The color of the stroke, undefined for theme default
   * @returns This Curve instance for method chaining
   */
  public stroke(color?: ColorEffect | string): Curve {
    this._stroke = this.normColor(color);
    return this;
  }

  /**
   * Converts the curve to a plot representation
   * @throws Error if the curve has fewer than 2 points
   * @returns The curve in ICurve format for plotting
   */
  public toPlot(): ICurve {
    assertLenGtTwo(this._points, "Curve must have at least 2 points");

    return {
      type: "curve",
      vertexes: this._points.map((point, index) => ({
        xyz: point.Xyz,
        color: this._colors[index]?.getRgba(),
      })),
      width: this._width,
      color: this._stroke?.getRgba(),
    };
  }
}

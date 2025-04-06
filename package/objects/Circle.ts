import { ICircle } from "../../public/Protocol";
import { ColorEffect, ColorType } from "../utils/ColorEffect";
import { Point } from "../utils/Coordinate";
import { assertNonNull, isNum } from "../utils/Assert";
import { SceneObject } from "./Object";

/**
 * A circle or arc scene object that can be rendered in a plot
 * @class Circle
 * @extends SceneObject
 */
export class Circle extends SceneObject {
  /**
   * The starting angle of the arc in radians
   * @internal
   */
  private _startAngle?: number;

  /**
   * The ending angle of the arc in radians
   * @internal
   */
  private _endAngle?: number;

  /**
   * Whether the arc should be drawn counter-clockwise
   * @internal
   */
  private _antiClockwise?: boolean;

  /**
   * The outer radius of the circle
   * @internal
   */
  private _outer?: number;

  /**
   * The inner radius of the circle
   * If undefined, the circle is a full circle
   * @internal
   */
  private _inner?: number;

  /**
   * The center of the circle
   * @internal
   */
  private _center?: Point;

  /**
   * The color of the circle
   * If empty, the circle is transparent
   * @internal
   */
  private _fill?: ColorEffect;

  /**
   * Sets the center point of the circle
   * @param pt The center point
   * @returns This Circle instance for method chaining
   */
  public center(pt: Point): Circle;
  /**
   * Sets the center point of the circle using x and y coordinates
   * @param x The x-coordinate of the center
   * @param y The y-coordinate of the center
   * @returns This Circle instance for method chaining
   */
  public center(x: number, y: number): Circle;
  public center(...args: any): Circle {
    if (args[0] instanceof Point) {
      this._center = args[0];
    } else if (isNum(args[0]) && isNum(args[1])) {
      this._center = this.normPoint([args[0], args[1]]);
    }
    return this;
  }

  /**
   * Sets the radius of the circle
   * @param outer The outer radius of the circle
   * @param inner The inner radius, if defined creates a ring/annulus
   * @returns This Circle instance for method chaining
   */
  public radius(outer: number, inner?: number): Circle {
    this._outer = outer;
    this._inner = inner;
    return this;
  }

  /**
   * Configures the circle as an arc with specified angles
   * @param startAngle The starting angle in radians (0 = right, π/2 = top)
   * @param endAngle The ending angle in radians
   * @param anticlockwise Whether the arc should be drawn counter-clockwise
   * @returns This Circle instance for method chaining
   * @example
   * // Create a semicircle from 0 to π radians
   * const semicircle = new Circle()
   *   .center(0, 0)
   *   .radius(5)
   *   .arc(0, Math.PI, false);
   */
  public arc(
    startAngle: number,
    endAngle: number,
    anticlockwise: boolean = false
  ): Circle {
    this._startAngle = startAngle;
    this._endAngle = endAngle;
    this._antiClockwise = anticlockwise;
    return this;
  }

  /**
   * Resets the circle to be a full circle (not an arc)
   * @returns This Circle instance for method chaining
   * @example
   * // Reset a previously configured arc back to a full circle
   * const fullCircle = someArc.circle();
   * @see arc - For creating partial circles/arcs
   */
  public circle(): Circle {
    this._startAngle = undefined;
    this._endAngle = undefined;
    this._antiClockwise = undefined;
    return this;
  }

  /**
   * Sets the fill color of the circle
   * @param color The color to fill the circle with, undefined for transparent
   * @returns This Circle instance for method chaining
   */
  public fill(color?: ColorType): Circle {
    this._fill = this.normColor(color);
    return this;
  }

  /**
   * Converts the circle to a plot representation
   * @throws Error if center or radius is not set
   * @returns The circle in ICircle format for plotting
   */
  public toPlot(): ICircle {
    assertNonNull(this._center, "Circle center is not set");
    assertNonNull(this._outer, "Circle radius is not set");

    return {
      type: "circle",
      center: {
        xyz: this._center.Xyz,
      },
      outerRadius: this._outer,
      innerRadius: this._inner,
      fill: this._fill?.getRgba(),
      startAngle: this._startAngle,
      endAngle: this._endAngle,
      anticlockwise: this._antiClockwise,
    };
  }
}

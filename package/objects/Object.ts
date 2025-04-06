import { ColorEffect, ColorType } from "../utils/ColorEffect";
import { CoordinateSystem, Point } from "../utils/Coordinate";

/**
 * Interface for objects that can be converted to plot representation
 */
export interface IServerObject {
  /**
   * Converts the object to a plot-compatible format
   * @returns Plot-compatible representation of the object
   */
  toPlot(): any;
}

/**
 * Base class for objects that can be rendered in a scene
 */
export class SceneObject implements IServerObject {
  /**
   * Creates a new scene object
   */
  constructor() {}

  /**
   * Normalizes color values to a consistent format
   * @param color - The color to normalize
   * @returns Normalized color effect
   * @throws Error if the color type is invalid
   */
  protected normColor(color: ColorType): ColorEffect {
    if (typeof color === "string") {
      return ColorEffect.fromCssColor(color);
    }
    if (color instanceof ColorEffect) {
      return color;
    }
    if (typeof color === "number") {
      return ColorEffect.fromValue(color);
    }

    if (color === undefined || color === null) {
      return undefined;
    }
    throw new Error("Invalid color type");
  }

  /**
   * Normalizes position values to a consistent Point format
   * @param position - The position to normalize
   * @returns Normalized point
   */
  protected normPoint(position: number[] | Point | undefined): Point {
    if (position instanceof Point) {
      return position;
    }
    if (position === undefined) {
      return new Point(CoordinateSystem.Cartesian, 0, 0);
    }
    return new Point(CoordinateSystem.Cartesian, position[0], position[1]);
  }

  /**
   * Converts the scene object to a plot-compatible format
   * @returns Plot-compatible representation of the object
   */
  toPlot(): any {
    return {};
  }
}

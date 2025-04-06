import { IAxis } from "../../public/Protocol";
import { ColorEffect } from "../utils/ColorEffect";

/**
 * Represents an axis in a plot
 */
export class Axis {
  /**
   * Range of the axis as [low, high]
   * undefined values indicate auto-scale
   * @internal
   */
  private _range: [number | undefined, number | undefined] = [
    undefined,
    undefined,
  ];

  /**
   * Color of the axis
   * @internal
   */
  private _color?: ColorEffect;

  /**
   * Whether the axis should be displayed
   * @internal
   * @default true
   */
  private _display: boolean = true;

  /**
   * Label text for the axis
   * @internal
   * @default ""
   */
  private _label: string = "";

  /**
   * Creates a new axis with the specified range
   * @param low The lower bound of the axis
   * @param high The upper bound of the axis
   */
  constructor(low: number, high: number) {
    this._range = [low, high];
  }

  /**
   * Sets the lower bound of the axis
   * @param value The lower bound value
   * @returns This Axis instance for method chaining
   */
  public low(value: number): Axis {
    this._range[0] = value;
    return this;
  }

  /**
   * Sets the upper bound of the axis
   * @param value The upper bound value
   * @returns This Axis instance for method chaining
   */
  public high(value: number): Axis {
    this._range[1] = value;
    return this;
  }

  /**
   * Sets the color of the axis
   * @param color The color to set
   * @throws Error If the color is not pure
   * @returns This Axis instance for method chaining
   */
  public color(color: ColorEffect): Axis {
    if (!color.IsPure()) {
      throw new Error("Axis color must be pure!");
    }
    this._color = color;
    return this;
  }

  /**
   * Sets whether the axis should be displayed
   * @param display True to display the axis, false to hide it
   * @returns This Axis instance for method chaining
   */
  public display(display: boolean): Axis {
    this._display = display;
    return this;
  }

  /**
   * Sets the label for the axis
   * @param label The text to display as the axis label
   * @returns This Axis instance for method chaining
   */
  public label(label: string): Axis {
    this._label = label;
    return this;
  }

  /**
   * Converts the axis to a plot representation
   * @returns The axis in IAxis format for plotting
   */
  public toPlot(): IAxis {
    return {
      label: this._label,
      lowerBound: this._range[0],
      upperBound: this._range[1],
      display: this._display,
      color: this._color?.getRgba(),
    };
  }
}

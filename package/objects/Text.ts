import { IText } from "../../public/Protocol";
import { assertNonNull, isNum } from "../utils/Assert";
import { ColorEffect, ColorType } from "../utils/ColorEffect";
import { Point } from "../utils/Coordinate";
import { SceneObject } from "./Object";

/**
 * A text object that can be rendered in the scene
 * @class Text
 * @extends SceneObject
 */
export class Text extends SceneObject {
  /**
   * The text content to be displayed
   * @internal
   */
  private _text?: string;

  /**
   * The position where the text will be rendered
   * @internal
   */
  private _position?: Point;

  /**
   * The font name/family for the text
   * @internal
   */
  private _font?: string;

  /**
   * The font size in pixels
   * @internal
   */
  private _size?: number;

  /**
   * The color of the text
   * @internal
   */
  private _color?: ColorEffect;

  /**
   * Sets the text content
   * @param {string} text - The string to display
   * @returns {Text} This Text instance for method chaining
   */
  public str(text: string): Text {
    this._text = text;
    return this;
  }

  /**
   * Sets the position of the text using x,y coordinates
   * @param {number} x - The x-coordinate
   * @param {number} y - The y-coordinate
   * @returns {Text} This Text instance for method chaining
   */
  public position(coord: [number, number]): Text;

  /**
   * Sets the position of the text using a Point object
   * @param {Point} pt - The point representing the position
   * @returns {Text} This Text instance for method chaining
   */
  public position(pt: Point): Text;
  public position(...args: any): Text {
    if (args[0] instanceof Point) {
      this._position = args[0];
    } else if (Array.isArray(args[0])) {
      if (args[0].length != 2 || !isNum(args[0][0]) || !isNum(args[0][1])) {
        throw new Error("Invalid position coordinates.");
      }
      this._position = this.normPoint([args[0][0], args[0][1]]);
    } else {
      throw new Error("Invalid arguments for position.");
    }
    return this;
  }

  /**
   * Sets the font for the text
   * @param {string} [font] - The font name/family, undefined for default font
   * @returns {Text} This Text instance for method chaining
   */
  public font(font?: string): Text {
    this._font = font;
    return this;
  }

  /**
   * Sets the size of the text
   * @param {number} [size] - The font size in pixels, undefined for default size
   * @returns {Text} This Text instance for method chaining
   */
  public size(size?: number): Text {
    this._size = size;
    return this;
  }

  /**
   * Sets the color of the text
   * @param {ColorType} [color] - The text color, undefined for default color
   * @returns {Text} This Text instance for method chaining
   */
  public color(color?: ColorType): Text {
    this._color = this.normColor(color);
    return this;
  }

  /**
   * Converts the text object to a plot representation
   * @throws Error if the text content is not set
   * @returns {IText} The text in IText format for plotting
   */
  public toPlot(): IText {
    assertNonNull(this._text, "Text is not set");

    return {
      type: "text",
      text: this._text,
      position: this._position.Xyz,
      font: this._font,
      size: this._size,
      color: this._color?.getRgba(),
    };
  }
}

import { SceneObject } from "./Object";
import { Point } from "../utils/Coordinate";
import { ColorEffect, ColorType } from "../utils/ColorEffect";
import { ILine } from "../../public/Protocol";

/**
 * Interface defining properties for line arrow decorations
 */
interface Arrow {
  /** The visual style of the arrow */
  style: "triangle-arrow" | "shape-arrow" | "circle" | "none";

  /** The size of the arrow in pixels */
  size?: number;

  /** The color of the arrow */
  color?: ColorEffect;
}

/**
 * A line segment connecting two points
 * @class Line
 * @extends SceneObject
 */
export class Line extends SceneObject {
  /** Index for the start arrow in the arrows array */
  static StartIndex = 0;

  /** Index for the end arrow in the arrows array */
  static EndIndex = 1;

  /** Array of two points defining the line */
  private eps: Point[] = new Array<Point>(2);

  /** Array of colors for each vertex */
  private colors: ColorEffect[] = new Array<ColorEffect>(2);

  /** Arrows at the start and end of the line */
  private arrows: Arrow[] = new Array<Arrow>(2);

  /** Width of the line in pixels */
  private _width?: number;

  /** Fill color of the line */
  private _fill?: ColorEffect;

  /**
   * Creates a new Line instance
   * @param eps - Array<Point> of two points defining the line
   * @param colors - Array<ColorEffect> of colors for each vertex
   */
  constructor() {
    super();
  }

  /**
   * Gets the arrow at the specified index
   * @param idx - number The index of the arrow (0 for start, 1 for end)
   * @returns The arrow at the specified index or undefined
   * @internal
   */
  private arrowAt(ep: number): Arrow | undefined {
    return this.arrows[ep];
  }

  /**
   * Set the coordinates of the start point.
   * @param coord - number[] The coordinates of the start point
   * @param color - ColorType The color to apply at the start point
   * @returns This Line instance for method chaining
   * @throws Error if the coordinate length is not 1 or 2
   */
  public start(coord: number[], color?: ColorType): Line {
    if (coord.length < 1 || coord.length > 2)
      throw new Error("Invalid coordinate length!");
    this.eps[Line.StartIndex] = this.normPoint(coord);
    this.colors[Line.StartIndex] = this.normColor(color);
    return this;
  }

  /**
   * Set the coordinates of the end point.
   * @param coord - number[] The coordinates of the end point
   * @param color - ColorType The color to apply at the end point
   * @returns This Line instance for method chaining
   * @throws Error if the coordinate length is not 1 or 2
   */
  public end(coord: number[], color?: ColorType): Line {
    if (coord.length < 1 || coord.length > 2)
      throw new Error("Invalid coordinate length!");
    this.eps[Line.EndIndex] = this.normPoint(coord);
    this.colors[Line.EndIndex] = this.normColor(color);
    return this;
  }

  /**
   * Sets the color of the line at a specific endpoint
   * @param ep - number The endpoint index (0 for start, 1 for end)
   * @param color - ColorType The color to set
   * @throws Error if the endpoint index is invalid
   * @returns This Line instance for method chaining
   */
  public color(ep: number, color?: ColorType): Line {
    if (ep < 0 || ep > 1) throw new Error("Invalid endpoint index!");
    this.colors[ep] = this.normColor(color);
    return this;
  }

  /**
   * Sets the arrow at the start of the line
   * @param arrow - Arrow The arrow configuration, undefined to remove
   * @throws Error if the arrow color is not pure
   * @returns This Line instance for method chaining
   */
  public startArrow(arrow?: Arrow): Line {
    if (arrow && arrow.color && !arrow.color.IsPure()) {
      throw new Error("Arrow's color must be pure!");
    }
    this.arrows[Line.StartIndex] = arrow;
    return this;
  }

  /**
   * Sets the arrow at the end of the line
   * @param arrow - Arrow The arrow configuration, undefined to remove
   * @throws Error if the arrow color is not pure
   * @returns This Line instance for method chaining
   */
  public endArrow(arrow?: Arrow): Line {
    if (arrow && arrow.color && !arrow.color.IsPure()) {
      throw new Error("Arrow's color must be pure!");
    }
    this.arrows[Line.EndIndex] = arrow;
    return this;
  }

  /**
   * Sets the width of the line
   * @param width - number The width in pixels
   * @returns This Line instance for method chaining
   */
  public width(width?: number): Line {
    this._width = width;
    return this;
  }

  /**
   * Sets the fill color of the line
   * @param color - ColorType The color to fill the line with
   * @returns This Line instance for method chaining
   */
  public fill(color?: ColorType): Line {
    this._fill = this.normColor(color);
    return this;
  }

  /**
   * Creates a line from a pair of vertices
   * @param vertexes - Array<{coord: Point, color?: ColorEffect}> Array of two vertices with coordinates and optional colors
   * @throws Error if there are not exactly 2 vertices or if a vertex color is not pure
   * @returns A new Line instance
   * @static
   */
  static fromVertex(
    vertexes: {
      coord: Point;
      color?: ColorEffect;
    }[]
  ): Line {
    const points: Point[] = [];
    const colors: ColorEffect[] = [];
    if (vertexes.length != 2) {
      throw new Error("Line must have 2 vertexes!");
    }

    vertexes.forEach((vertex) => {
      points.push(vertex.coord);

      if (!vertex.color) return;

      if (!vertex.color.IsPure()) {
        throw new Error("Vertex's color must be pure!");
      }
      colors.push(vertex.color);
    });
    return new Line().start(points[0].Xy).end(points[1].Xy);
  }

  /**
   * Converts the line to a plot representation
   * @returns The line in ILine format for plotting
   */
  public toPlot(): ILine {
    if (this.eps[0] == undefined)
      throw new Error("Start endpoint should be set!");
    if (this.eps[1] == undefined)
      throw new Error("End endpoint should be set!");

    const stArr = this.arrowAt(Line.StartIndex),
      stArrColor = stArr?.color?.getRgba();
    const edArr = this.arrowAt(Line.EndIndex),
      edArrColor = edArr?.color?.getRgba();

    const plot: ILine = {
      type: "line",
      endpoints: [
        {
          xyz: this.eps[0].Xyz,
          color: this.colors[0]?.getRgba(),
        },
        {
          xyz: this.eps[1].Xyz,
          color: this.colors[1]?.getRgba(),
        },
      ],
      fill: this._fill?.getRgba(),
      width: this._width,
      startArrow: stArr
        ? {
            style: stArr.style,
            size: stArr.size,
            color: stArrColor,
          }
        : undefined,
      endArrow: edArr
        ? {
            style: edArr.style,
            size: edArr.size,
            color: edArrColor,
          }
        : undefined,
    };
    return plot;
  }
}

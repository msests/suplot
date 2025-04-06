import { SceneObject } from "../objects/Object";
import { IScene2D } from "../../public/Protocol";
import { Axis } from "../axis/Axis";
import { ColorEffect } from "../utils/ColorEffect";

/**
 * A 2D scene that contains objects to be rendered
 * @class Scene2D
 * @extends SceneObject
 */
export class Scene2D extends SceneObject {
  /** The X-axis configuration
   * @internal
   */
  private _xAxis?: Axis;

  /** The Y-axis configuration
   * @internal
   */
  private _yAxis?: Axis;

  /** Whether to display grid lines
   * @internal
   */
  private _grid: boolean = false;

  /** Whether to display tick marks
   * @internal
   */
  private _tick: boolean = false;

  /** Collection of objects in the scene
   * @internal
   */
  private _objects: SceneObject[] = [];

  /** Background color of the scene
   * @internal
   */
  private _bgColor?: ColorEffect;

  /**
   * Creates a new empty 2D scene
   */
  constructor() {
    super();
  }

  /**
   * Sets the X-axis configuration
   * @param axis The Axis object for the X-axis
   * @returns This Scene2D instance for method chaining
   */
  public xAxis(axis: Axis): Scene2D {
    this._xAxis = axis;
    return this;
  }

  /**
   * Sets the Y-axis configuration
   * @param axis The Axis object for the Y-axis
   * @returns This Scene2D instance for method chaining
   */
  public yAxis(axis: Axis): Scene2D {
    this._yAxis = axis;
    return this;
  }

  /**
   * Sets whether to display grid lines
   * @param grid True to display grid lines, false to hide
   * @returns This Scene2D instance for method chaining
   */
  public grid(grid: boolean): Scene2D {
    this._grid = grid;
    return this;
  }

  /**
   * Sets whether to display tick marks on axes
   * @param tick True to display tick marks, false to hide
   * @returns This Scene2D instance for method chaining
   */
  public tick(tick: boolean): Scene2D {
    this._tick = tick;
    return this;
  }

  /**
   * Adds an object to the scene
   * @param object The SceneObject to add
   * @returns This Scene2D instance for method chaining
   */
  public addObject(object: SceneObject): Scene2D {
    this._objects.push(object);
    return this;
  }

  /**
   * Sets the background color of the scene
   * @param color The background color, undefined for default color
   * @returns This Scene2D instance for method chaining
   */
  public background(color?: ColorEffect | string): Scene2D {
    this._bgColor = this.normColor(color);
    return this;
  }

  /**
   * Converts the scene to a plot representation
   * @returns The scene in IScene2D format for plotting
   */
  public toPlot(): IScene2D {
    return {
      xAxis: this._xAxis?.toPlot(),
      yAxis: this._yAxis?.toPlot(),
      grid: this._grid,
      tick: this._tick,
      objects: this._objects.map((object) => object.toPlot()),
      background: this._bgColor ? this._bgColor.getRgba() : undefined,
    };
  }
}

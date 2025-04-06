import { RenderServer } from "../server/index";
import { CoordinateSystem, Point } from "../utils/Coordinate";
import { Scene2D } from "../scene/Scene";
import { Axis } from "../axis/Axis";
import { Line } from "../objects/Line";
import { Text } from "../objects/Text";
import { IRenderTask } from "../../public/Protocol";
import { ColorEffect } from "../utils/ColorEffect";
import { Circle } from "../objects/Circle";
import { Triangle } from "../objects/Triangle";
import { Rectangle } from "../objects/Rectangle";
import { Curve } from "../objects/Curve";

/**
 * Interface defining the world model with axes
 */
export interface WorldModel {
  xAxis: Axis;
  yAxis: Axis;
  zAxis: Axis;
}

/**
 * Base renderer for 2D scenes
 *
 * A class that provides functionality for rendering 2D scenes, including
 * various shapes, text, and axes.
 */
export class BaseRenderer2D {
  private _scene: Scene2D;
  private _server: RenderServer;
  private _title: string = "Default Title";
  private _figure?: [number, number];

  /**
   * Creates a new BaseRenderer2D instance
   *
   * Initializes a new Scene2D and RenderServer
   */
  constructor() {
    this._scene = new Scene2D();
    this._server = new RenderServer();
  }

  /**
   * Sets the figure dimensions
   * @param points - A tuple containing width and height of the figure
   */
  public figure(points: [number, number]): void {
    this._figure = points;
  }

  /**
   * Sets an axis for the scene
   * @param name - The axis name ("x" or "y")
   * @param axis - The axis object to set
   */
  public axis(name: string, axis: Axis) {
    if (name === "x") {
      this._scene.xAxis(axis);
    } else if (name === "y") {
      this._scene.yAxis(axis);
    }
  }

  /**
   * Creates a new scene
   * @returns A new Scene2D instance
   */
  public scene(): Scene2D {
    this._scene = new Scene2D();
    return this._scene;
  }

  /**
   * Creates a line and adds it to the scene
   * @param start - The starting point and optional color
   * @param end - The ending point and optional color
   * @returns The created Line object
   */
  public line(
    start: { point: number[]; color?: string },
    end: { point: number[]; color?: string }
  ): Line {
    const line = new Line()
      .start(start.point, start.color)
      .end(end.point, end.color);
    this._scene.addObject(line);
    return line;
  }

  /**
   * Creates a text object and adds it to the scene
   * @param text - The text content
   * @param x - Optional x-coordinate (defaults to 0)
   * @param y - Optional y-coordinate (defaults to 0)
   * @returns The created Text object
   */
  public text(text: string, pos?: number[]): Text {
    const textObject = new Text();
    textObject
      .str(text)
      .position(
        new Point(CoordinateSystem.Cartesian, pos[0] || 0, pos[1] || 0)
      );
    this._scene.addObject(textObject);
    return textObject;
  }

  /**
   * Creates a circle and adds it to the scene
   * @param center - The center coordinates [x, y]
   * @param radius - The radius of the circle
   * @param innerRadius - Optional inner radius for ring-like circles
   * @returns The created Circle object
   */
  public circle(
    center: [number, number],
    radius: number,
    innerRadius?: number
  ): Circle {
    const circle = new Circle()
      .center(center[0], center[1])
      .radius(radius, innerRadius);
    this._scene.addObject(circle);
    return circle;
  }

  /**
   * Creates a curve object defined by a series of points and adds it to the scene
   *
   * @param points - An array of points where each point is an array of two numbers [x, y]
   *                 representing coordinates in the Cartesian system. If undefined, an empty
   *                 curve will be created to which points can be added later.
   * @param width - The width of the curve in pixels. If undefined, the default width from
   *                the Curve class will be used.
   * @param color - The color of the curve specified as a CSS color string (e.g., '#FF0000',
   *                'rgb(255,0,0)', 'red'). If undefined, the default color from the
   *                Curve class will be used.
   * @returns The created Curve object instance that can be further customized using its methods
   *
   * @example
   * // Create a simple sine curve with 100 points
   * const points = Array.from({length: 100}, (_, i) => {
   *   const x = i / 10;
   *   return [x, Math.sin(x)];
   * });
   * const sineCurve = renderer.curve(points, 2, 'blue');
   */
  public curve(points?: number[][], width?: number, color?: string): Curve {
    const curve = new Curve();
    points?.forEach((point) => {
      curve.point(point[0], point[1]);
    });
    curve.width(width).stroke(color);
    this._scene.addObject(curve);
    return curve;
  }

  /**
   * Creates a triangle and adds it to the scene
   * @param p1 - The first vertex coordinates
   * @param p2 - The second vertex coordinates
   * @param p3 - The third vertex coordinates
   * @param fill - Optional fill color
   * @param border - Optional border properties
   * @returns The created Triangle object
   */
  public triangle(
    p1: number[],
    p2: number[],
    p3: number[],
    fill?: string,
    border?: { width: number }
  ): Triangle {
    const triangle = new Triangle()
      .vertexes(
        { position: new Point(CoordinateSystem.Cartesian, ...p1), border },
        { position: new Point(CoordinateSystem.Cartesian, ...p2), border },
        { position: new Point(CoordinateSystem.Cartesian, ...p3), border }
      )
      .fill(fill ? ColorEffect.fromCssColor(fill) : undefined);
    this._scene.addObject(triangle);
    return triangle;
  }

  /**
   * Creates a rectangle and adds it to the scene
   * @param p1 - The first vertex coordinates
   * @param p2 - The second vertex coordinates
   * @param p3 - The third vertex coordinates
   * @param p4 - The fourth vertex coordinates
   * @param fill - Optional fill color
   * @param border - Optional border properties
   * @returns The created Rectangle object
   */
  public rect(
    p1: number[],
    p2: number[],
    p3: number[],
    p4: number[],
    fill?: string,
    border?: { width: number }
  ): Rectangle {
    const rect = new Rectangle()
      .vertexes(
        { position: new Point(CoordinateSystem.Cartesian, ...p1), border },
        { position: new Point(CoordinateSystem.Cartesian, ...p2), border },
        { position: new Point(CoordinateSystem.Cartesian, ...p3), border },
        { position: new Point(CoordinateSystem.Cartesian, ...p4), border }
      )
      .fill(fill ? ColorEffect.fromCssColor(fill) : undefined);
    this._scene.addObject(rect);
    return rect;
  }

  /**
   * Creates a render task from the current scene
   * @returns The created render task
   * @internal
   */
  private createTask(): IRenderTask {
    const task: IRenderTask = {
      sceneType: "2D",
      scene2D: this._scene.toPlot(),
      figureSize: this._figure,
    };
    return task;
  }

  /**
   * Renders the current scene
   * @returns A promise that resolves when the render server has started
   */
  public async Render(): Promise<void> {
    // Start the server if not already running
    if (!this._server) {
      this._server = new RenderServer();
    }

    this._server.handleApiRequest("/api/get-task", async (req, res) => {
      res.send(this.createTask());
      res.status(200);
      res.end();
    });

    // Open browser and navigate to localhost:16000
    // @ts-ignore
    // const open = await import("open");
    // await open.default("http://localhost:16000").catch((err: string) => {
    //   console.error("Failed to open browser:", err);
    // });

    // Start server on port 16000 if not already running
    this._server.start();
  }
}

import { IDot } from "./RenderObject";
import { Vertex } from "../Misc/Vertex";
import { PureColor, ColorBase } from "../Misc/Color";
import { Tensor } from "../Misc/Tensor";
import { TextRenderer } from "../Renderer/TextRenderer";
import {
  IRenderTask,
  IScene2D,
  IAxis,
  ILine,
  ISize,
  IEndPointArrow,
  ICircle,
  IPolygon,
  IText,
  ICurve,
} from "../../../public/Protocol";
import { Polygon } from "./Polygon";
import { Border } from "../Misc/Border";
import { Text } from "./Text";
import { Curve } from "./Curve";
import { Axis } from "./Axis";

export interface VertexBufferData {
  position: [number, number, number, number];
  color: [number, number, number, number];
  texCoord: [number, number];
  texLayer: number;
  op: number;
}

export interface Transform2DParam {
  device: GPUDevice;
  task: IRenderTask;
  canvas: {
    width: number;
    height: number;
  };
}

export interface Transform2DContext {
  xScaleCoff: number;
  xScaleOffset: number;
  yScaleCoff: number;
  yScaleOffset: number;

  pixelToWorld: number;
  worldToPixel: number;
}

export class Transform2D {
  private context: Partial<Transform2DContext> = {};
  private textRenderer: TextRenderer;
  private phase = 0;

  private vertexes: VertexBufferData[] = [];
  private indices: number[] = [];
  private textures: Map<string, GPUTexture> = new Map();

  constructor(private param: Transform2DParam) {
    this.textRenderer = new TextRenderer(this.param.device);
    this.textRenderer.initialize();
  }

  private colorTransition(
    src: ColorBase,
    dst: ColorBase,
    t: number
  ): ColorBase {
    const r = src.R + (dst.R - src.R) * t;
    const g = src.G + (dst.G - src.G) * t;
    const b = src.B + (dst.B - src.B) * t;
    const a = src.A + (dst.A - src.A) * t;
    return new PureColor([r, g, b, a]);
  }

  private transformColor(color: any): ColorBase {
    if (Array.isArray(color)) {
      return color.length == 3
        ? PureColor.fromRgb(color[0], color[1], color[2])
        : PureColor.fromRgba(color[0], color[1], color[2], color[3]);
    } else if (typeof color === "object") {
      return color;
    } else if (typeof color === "string") {
      return PureColor.fromHex(color);
    } else {
      return PureColor.fromHex("#000000");
    }
  }

  private estimateRange({ x, y }: { x?: IAxis; y?: IAxis }): {
    x: Required<IAxis>;
    y: Required<IAxis>;
  } {
    this.phase = 0;

    x = x || { display: false };
    y = y || { display: false };

    if (x.lowerBound == undefined || x.upperBound == undefined) {
      x.lowerBound = Number.MAX_VALUE;
      x.upperBound = Number.MIN_VALUE;
      this.param.task.scene2D!.objects.forEach((object) => {
        switch (object.type) {
          case "line":
            {
              const line = object as ILine;
              line.width = this.toWorldSize(line.width || 1);
              x.lowerBound = Math.min(
                x.lowerBound!,
                line.endpoints[0].xyz[0] - line.width
              );
              x.upperBound = Math.max(
                x.upperBound!,
                line.endpoints[0].xyz[0] + line.width
              );
              x.lowerBound = Math.min(
                x.lowerBound!,
                line.endpoints[1].xyz[0] - line.width
              );
              x.upperBound = Math.max(
                x.upperBound!,
                line.endpoints[1].xyz[0] + line.width
              );
            }
            break;
          case "circle":
            {
              const circle = object as ICircle;
              circle.outerRadius = this.toWorldSize(circle.outerRadius || 1);
              x.lowerBound = Math.min(
                x.lowerBound!,
                circle.outerRadius + circle.center.xyz[0]
              );
              x.upperBound = Math.max(
                x.upperBound!,
                circle.outerRadius + circle.center.xyz[0]
              );
            }
            break;
          case "polygon":
            {
              const polygon = object as IPolygon;
              for (const vertex of polygon.vertexes) {
                x.lowerBound = Math.min(x.lowerBound!, vertex.xyz[0]);
                x.upperBound = Math.max(x.upperBound!, vertex.xyz[0]);
              }
            }
            break;
        }
      });
    }

    if (y.lowerBound == undefined || y.upperBound == undefined) {
      y.lowerBound = Number.MAX_VALUE;
      y.upperBound = Number.MIN_VALUE;
      this.param.task.scene2D!.objects.forEach((object) => {
        switch (object.type) {
          case "line":
            {
              const line = object as ILine;
              line.width = this.toWorldSize(line.width || 1);
              line.width = line.width || 1;
              y.lowerBound = Math.min(
                y.lowerBound!,
                line.endpoints[0].xyz[1] - line.width
              );
              y.upperBound = Math.max(
                y.upperBound!,
                line.endpoints[0].xyz[1] + line.width
              );
              y.lowerBound = Math.min(
                y.lowerBound!,
                line.endpoints[1].xyz[1] - line.width
              );
              y.upperBound = Math.max(
                y.upperBound!,
                line.endpoints[1].xyz[1] + line.width
              );
            }
            break;
          case "circle":
            {
              const circle = object as ICircle;
              circle.outerRadius = this.toWorldSize(circle.outerRadius || 1);
              y.lowerBound = Math.min(
                y.lowerBound!,
                circle.outerRadius + circle.center.xyz[1]
              );
              y.upperBound = Math.max(
                y.upperBound!,
                circle.outerRadius + circle.center.xyz[1]
              );
            }
            break;
          case "polygon":
            {
              const polygon = object as IPolygon;
              for (const vertex of polygon.vertexes) {
                y.lowerBound = Math.min(y.lowerBound!, vertex.xyz[1]);
                y.upperBound = Math.max(y.upperBound!, vertex.xyz[1]);
              }
            }
            break;
        }
      });
    }

    this.phase = 1;

    // @ts-ignore
    return { x, y };
  }

  /**
   * @brief Processes a circle object and converts it into renderable geometry
   *
   * This method approximates a circle or arc with triangles for rendering.
   * It supports:
   * - Full circles and partial arcs (using startAngle and endAngle)
   * - Filled circles (innerRadius = 0) and ring shapes (innerRadius > 0)
   * - Clockwise or anticlockwise drawing direction
   *
   * The circle is approximated using a configurable number of segments,
   * with more segments providing a smoother approximation at the cost of
   * performance.
   *
   * @param circle The circle object to process, containing center position, radius,
   *               optional inner radius, and optional arc parameters
   */
  private processCircle(circle: ICircle) {
    // Number of segments to approximate the circle
    const segments = circle.segments || 36;

    // Set default values for optional parameters
    const startAngle = circle.startAngle ?? 0;
    const endAngle = circle.endAngle ?? 2 * Math.PI;
    const anticlockwise = circle.anticlockwise ?? false;

    circle.innerRadius = this.toWorldSize(circle.innerRadius || 0);
    circle.outerRadius = this.toWorldSize(circle.outerRadius || 1);

    // Calculate angle increment based on whether to draw clockwise or counterclockwise
    let angleRange = anticlockwise
      ? startAngle - endAngle
      : endAngle - startAngle;
    // Ensure positive angle range
    if (angleRange <= 0) angleRange += 2 * Math.PI;

    const segmentCount = Math.ceil((angleRange / (2 * Math.PI)) * segments);
    const angleIncrement = angleRange / segmentCount;

    const centerPos = Tensor.fromArray(circle.center.xyz.slice(0, 2));
    const centerColor = circle.fill
      ? this.transformColor(circle.fill)
      : PureColor.fromHex("#000000");

    if (circle.innerRadius === 0) {
      // Case 1: Filled circle/arc (innerRadius = 0)
      const centerIndex = this.vertexes.length;

      // Add center vertex
      //   this.addVertex(centerPos.tolist(), centerColor.Data);
      this.vertexes.push({
        position: [centerPos[0], centerPos[1], 0, 1],
        color: centerColor.Data,
        texCoord: [0, 0],
        texLayer: 0,
        op: 0,
      });

      // Generate outer vertices and triangles
      for (let i = 0; i <= segmentCount; i++) {
        const angle = anticlockwise
          ? startAngle - i * angleIncrement
          : startAngle + i * angleIncrement;

        // Create direction vector using angle
        const direction = Tensor.fromArray([Math.cos(angle), Math.sin(angle)]);

        // Scale by radius and add to center position
        const outerPoint = centerPos.add(direction.scale(circle.outerRadius));

        const outerIndex = this.vertexes.length;

        this.vertexes.push({
          position: [outerPoint[0], outerPoint[1], 0, 1],
          color: centerColor.Data,
          texCoord: [0, 0],
          texLayer: 0,
          op: 0,
        });

        // Create a triangle except for the first vertex
        if (i > 0) {
          this.indices.push(centerIndex, outerIndex - 1, outerIndex);
        }
      }

      // If we're drawing a full circle, close the loop
      if (Math.abs(angleRange - 2 * Math.PI) < 0.001) {
        const firstOuterIndex = centerIndex + 1;
        const lastOuterIndex = this.vertexes.length - 1;
        this.indices.push(centerIndex, lastOuterIndex, firstOuterIndex);
      }
    } else {
      // Case 2: Ring/arc (innerRadius > 0)
      let prevInnerIndex = -1;
      let prevOuterIndex = -1;

      for (let i = 0; i <= segmentCount; i++) {
        const angle = anticlockwise
          ? startAngle - i * angleIncrement
          : startAngle + i * angleIncrement;

        // Create direction vector using angle
        const direction = Tensor.fromArray([Math.cos(angle), Math.sin(angle)]);

        // Outer vertex - center + direction * outerRadius
        const outerPoint = centerPos.add(direction.scale(circle.outerRadius));

        // Inner vertex - center + direction * innerRadius
        const innerPoint = centerPos.add(direction.scale(circle.innerRadius));

        // Add vertices
        const outerIndex = this.vertexes.length;
        this.vertexes.push({
          position: [outerPoint[0], outerPoint[1], 0, 1],
          color: centerColor.Data,
          texCoord: [0, 0],
          texLayer: 0,
          op: 0,
        });

        const innerIndex = this.vertexes.length;
        this.vertexes.push({
          position: [innerPoint[0], innerPoint[1], 0, 1],
          color: centerColor.Data,
          texCoord: [0, 0],
          texLayer: 0,
          op: 0,
        });

        // Create triangles after the first pair of vertices
        if (prevInnerIndex !== -1) {
          // Create two triangles to form a quad
          this.indices.push(prevOuterIndex, prevInnerIndex, outerIndex);
          this.indices.push(prevInnerIndex, innerIndex, outerIndex);
        }

        prevOuterIndex = outerIndex;
        prevInnerIndex = innerIndex;
      }

      // If we're drawing a full circle, close the loop
      if (Math.abs(angleRange - 2 * Math.PI) < 0.001) {
        const firstOuterIndex = 0;
        const firstInnerIndex = 1;
        this.indices.push(prevOuterIndex, prevInnerIndex, firstOuterIndex);
        this.indices.push(prevInnerIndex, firstInnerIndex, firstOuterIndex);
      }
    }
  }

  private toWorldSize(size: ISize): number {
    if (this.phase == 0 && typeof size === "string") {
      throw new Error("Size can't be in pixel if axis is not set");
    }

    return typeof size === "number"
      ? size
      : parseFloat(size) * this.context.pixelToWorld!;
  }

  private rotate(
    vec: Tensor,
    angle: number,
    anticlockwise: boolean = false
  ): Tensor {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return !anticlockwise
      ? new Tensor(
          [vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos],
          [2, 1]
        )
      : new Tensor(
          [vec[0] * cos + vec[1] * sin, -vec[0] * sin + vec[1] * cos],
          [2, 1]
        );
  }

  /**
   * @brief Processes border edges for a polygon using Tensor operations
   *
   * This method creates border lines with specified widths and colors around a polygon.
   * It calculates the vectors between vertices, computes angles between adjacent edges,
   * and creates properly oriented border quads along each edge.
   *
   * @param vertexes The vertices of the polygon
   * @param border Array of border specifications for each edge
   */
  private processBorder(vertexes: Vertex[], border: Border[]) {
    // Convert vertices to Tensor objects
    const vertexTensors: Tensor[] = vertexes.map((v) => Tensor.fromArray(v.Xy));

    // Calculate edge vectors using Tensor operations
    const edgeVectors: Tensor[] = [];
    for (let i = 0; i < vertexes.length; i++) {
      const i1 = i;
      const i2 = (i + 1) % vertexes.length;
      const vec = vertexTensors[i2].subtract(vertexTensors[i1]);
      edgeVectors.push(vec);
    }

    // Calculate angles between adjacent edges
    const angles: number[] = [];
    for (let i = 0; i < vertexes.length; i++) {
      if (!border[i]) break;

      const prevIndex = (i - 1 + edgeVectors.length) % edgeVectors.length;
      const vec1 = edgeVectors[prevIndex];
      const vec2 = edgeVectors[i];

      // Calculate the dot product of unit vectors
      const dotProduct = vec1.unit().dot(vec2.unit()).item();
      // Clamp to ensure valid acos input (-1 to 1)
      const clampedDot = Math.max(-1, Math.min(1, dotProduct));
      const angle = Math.acos(clampedDot);
      angles.push(Math.PI - angle);
    }

    // Process each border edge
    for (let i = 0; i < vertexes.length; i++) {
      if (!border[i] || border[i].Width == 0) break;

      const { Color: color, Width: width } = border[i];

      // Get the current vertex and next vertex as Tensors
      const vertex1 = vertexTensors[i];
      const vertex2 = vertexTensors[(i + 1) % vertexes.length];

      // Calculate parameters for the current edge
      const angle = angles[i];
      const widthGain = width / Math.sin(angle / 2);
      const angleRot = Math.PI - angle / 2;

      // Get unit vector along the edge
      const edgeUnit = edgeVectors[i].unit();
      const offsetVector = edgeUnit.scale(widthGain);

      // Rotate the offset vector
      const rotatedOffset = this.rotate(offsetVector, angleRot).squeeze();

      // Calculate the outer and inner points for the first vertex
      const outer1 = vertex1.add(rotatedOffset);
      const inner1 = vertex1.subtract(rotatedOffset);

      // Repeat for the next vertex with appropriate angle
      const nextAngle = angles[(i + 1) % vertexes.length];
      const nextWidthGain = width / Math.sin(nextAngle / 2);
      const nextAngleRot = Math.PI - nextAngle / 2;

      // Get unit vector in opposite direction
      const negEdgeUnit = edgeUnit.scale(-1);
      const nextOffsetVector = negEdgeUnit.scale(nextWidthGain);

      // Rotate the next offset vector
      const nextRotatedOffset = this.rotate(
        nextOffsetVector,
        nextAngleRot,
        true
      ).squeeze();

      // Calculate the outer and inner points for the second vertex
      const outer2 = vertex2.add(nextRotatedOffset);
      const inner2 = vertex2.subtract(nextRotatedOffset);

      // Create a quad for this border segment
      const borderQuad = new Polygon(
        [
          new Vertex(outer1.tolist(), color),
          new Vertex(outer2.tolist(), color),
          new Vertex(inner2.tolist(), color),
          new Vertex(inner1.tolist(), color),
        ],
        undefined,
        color
      );

      this.processPolygon(borderQuad);
    }
  }

  private processPolygon(poly: Polygon) {
    const fill = this.transformColor(poly.Fill);

    const startIndex = this.vertexes.length;
    poly.forEachVertex((vertex) => {
      this.vertexes.push({
        position: [vertex.Xy[0], vertex.Xy[1], 0, 1],
        color: vertex.Rgba || fill.Data,
        texCoord: [0, 0],
        texLayer: 0,
        op: 0,
      });
    });

    for (let i = 1; i < poly.Vertexes.length - 1; i++) {
      this.indices.push(startIndex, startIndex + i, startIndex + i + 1);
    }

    if (poly.hasBorder()) {
      this.processBorder(poly.Vertexes, poly.Borders || []);
    }
  }

  private calcRescale(x: Axis, y: Axis) {
    this.context.xScaleCoff = 2 / (x.UpperBound - x.LowerBound);
    this.context.xScaleOffset = (x.UpperBound + x.LowerBound) / 2;

    this.context.yScaleCoff = 2 / (y.UpperBound - y.LowerBound);
    this.context.yScaleOffset = (y.UpperBound + y.LowerBound) / 2;
  }

  private processAxis(x: Axis, y: Axis) {
    const onePixel = this.context.pixelToWorld!;
    const textSize = 16 * this.context.pixelToWorld!,
      gapSize = 4 * onePixel;

    if (x.Show) {
      if (x.Label && y.UpperBound > 0) {
        const above = (y.UpperBound + y.LowerBound) / 2 >= 0;
        this.processText(
          new Text(
            x.Label,
            [
              x.UpperBound - x.Label.length * textSize - gapSize,
              above ? gapSize + textSize : -gapSize,
              0,
            ],
            textSize
          )
        );
      }

      this.createLine(
        [x.LowerBound, 0.0, 0.0],
        [x.UpperBound, 0.0, 0.0],
        onePixel,
        x.Color,
        undefined,
        { style: "triangle-arrow", size: 8 * onePixel }
      );
    }

    if (y.Show) {
      if (y.Label && x.UpperBound > 0) {
        const right = (x.UpperBound + x.LowerBound) / 2 >= 0;
        this.processText(
          new Text(
            y.Label,
            [
              right ? gapSize : -(gapSize + textSize * y.Label.length),
              y.UpperBound - textSize,
              0,
            ],
            textSize
          )
        );
      }

      this.createLine(
        [0.0, y.LowerBound, 0.0],
        [0.0, y.UpperBound, 0.0],
        onePixel,
        y.Color,
        undefined,
        { style: "triangle-arrow", size: 8 * onePixel }
      );
    }
  }

  private scaleAllVertexes() {
    // Scale vertexes
    for (let i = 0; i < this.vertexes.length; i++) {
      this.vertexes[i].position[0] =
        (this.vertexes[i].position[0] - this.context.xScaleOffset!) *
        this.context.xScaleCoff!;
      this.vertexes[i].position[1] =
        (this.vertexes[i].position[1] - this.context.yScaleOffset!) *
        this.context.yScaleCoff!;
    }
  }

  private static RotateClockwise90Matrix = new Tensor([0, 1, -1, 0], [2, 2]);
  private static RotateAntiClockwise90Matrix = new Tensor(
    [0, -1, 1, 0],
    [2, 2]
  );
  private static RotateClockwise45Matrix = new Tensor(
    [Math.sqrt(2) / 2, Math.sqrt(2) / 2, -Math.sqrt(2) / 2, Math.sqrt(2) / 2],
    [2, 2]
  );
  private static RotateAntiClockwise45Matrix = new Tensor(
    [Math.sqrt(2) / 2, -Math.sqrt(2) / 2, Math.sqrt(2) / 2, Math.sqrt(2) / 2],
    [2, 2]
  );
  private static RotateClockwise135Matrix = new Tensor(
    [-Math.sqrt(2) / 2, Math.sqrt(2) / 2, -Math.sqrt(2) / 2, -Math.sqrt(2) / 2],
    [2, 2]
  );
  private static RotateAntiClockwise135Matrix = new Tensor(
    [-Math.sqrt(2) / 2, -Math.sqrt(2) / 2, Math.sqrt(2) / 2, -Math.sqrt(2) / 2],
    [2, 2]
  );

  private createTriangleStartArrow(
    p0: Tensor,
    p1: Tensor,
    width: number,
    colors: {
      start: ColorBase;
      end: ColorBase;
      startArrow: ColorBase;
      endArrow: ColorBase;
    }
  ): Tensor {
    const vt = p1.subtract(p0);
    const vtUnit = vt.unit();
    const vtArrow = vtUnit.scale(width);

    const len = vt.norm();

    const newP0 = p0.add(vtArrow);
    const arrowVec = newP0.subtract(p0).scale(0.5);

    // Rotate arrowVec by 90 degree counter-clockwise
    const arrowVe1 = Transform2D.RotateClockwise90Matrix.dot(
      arrowVec.unsqueeze(1)
    ).squeeze();

    // Rotate arrowVec by 90 degree clockwise
    const arrowVe2 = Transform2D.RotateAntiClockwise90Matrix.dot(
      arrowVec.unsqueeze(1)
    ).squeeze();

    const arrow1 = newP0.add(arrowVe1);
    const arrow2 = newP0.add(arrowVe2);

    colors.startArrow = this.colorTransition(
      colors.start,
      colors.end,
      width / len
    );

    const arrow = new Polygon([
      new Vertex(p0.tolist(), colors.start),
      new Vertex(arrow1.tolist(), colors.startArrow),
      new Vertex(arrow2.tolist(), colors.startArrow),
    ]);

    this.processPolygon(arrow);

    return newP0;
  }

  private createShapeStartArrow(
    p0: Tensor,
    p1: Tensor,
    width: number,
    colors: {
      start: ColorBase;
      end: ColorBase;
      startArrow: ColorBase;
      endArrow: ColorBase;
    }
  ): Tensor {
    const vt = p1.subtract(p0);
    const vtUnit = vt.unit();
    const vtWidth = vtUnit.scale(-width);
    const vtArrow = vtWidth.scale(Math.sqrt(2));

    const newP0 = p0.subtract(vtArrow);

    const vtA = Transform2D.RotateClockwise45Matrix.dot(
        vtWidth.unsqueeze(1)
      ).squeeze(),
      vtB = Transform2D.RotateAntiClockwise45Matrix.dot(
        vtWidth.unsqueeze(1)
      ).squeeze();

    const vtC = Transform2D.RotateClockwise135Matrix.dot(
        vtArrow.unsqueeze(1)
      ).squeeze(),
      vtD = Transform2D.RotateAntiClockwise135Matrix.dot(
        vtArrow.unsqueeze(1)
      ).squeeze();

    const vtE = vtC.add(vtA);
    const vtF = vtD.add(vtB);

    colors.startArrow = this.colorTransition(
      colors.start,
      colors.end,
      vtArrow.norm() / vt.norm()
    );

    const poly1 = new Polygon([
      new Vertex(newP0.tolist(), colors.startArrow),
      new Vertex(newP0.add(vtArrow).tolist(), colors.start),
      new Vertex(newP0.add(vtE).tolist(), colors.startArrow),
      new Vertex(newP0.add(vtC).tolist(), colors.startArrow),
    ]);
    this.processPolygon(poly1);

    const poly2 = new Polygon([
      new Vertex(newP0.tolist(), colors.startArrow),
      new Vertex(newP0.add(vtArrow).tolist(), colors.start),
      new Vertex(newP0.add(vtF).tolist(), colors.startArrow),
      new Vertex(newP0.add(vtD).tolist(), colors.startArrow),
    ]);
    this.processPolygon(poly2);

    return newP0;
  }

  private createTriangleEndArrow(
    p0: Tensor,
    p1: Tensor,
    width: number,
    colors: {
      start: ColorBase;
      end: ColorBase;
      startArrow: ColorBase;
      endArrow: ColorBase;
    }
  ): Tensor {
    const vt = p1.subtract(p0);
    const vtUnit = vt.unit();
    const vtArrow = vtUnit.scale(width);

    const len = vt.norm();

    const newP1 = p1.subtract(vtArrow);
    const arrowVec = p1.subtract(newP1).scale(0.5);

    // Rotate arrowVec by 90 degree counter-clockwise
    const arrowVe1 = Transform2D.RotateAntiClockwise90Matrix.dot(
      arrowVec.unsqueeze(1)
    ).squeeze();

    // Rotate arrowVec by 90 degree clockwise
    const arrowVe2 = Transform2D.RotateClockwise90Matrix.dot(
      arrowVec.unsqueeze(1)
    ).squeeze();

    const arrow1 = newP1.add(arrowVe1);
    const arrow2 = newP1.add(arrowVe2);

    colors.endArrow = this.colorTransition(
      colors.end,
      colors.start,
      length / len
    );

    const arrow = new Polygon([
      new Vertex(p1.tolist(), colors.end),
      new Vertex(arrow1.tolist(), colors.endArrow),
      new Vertex(arrow2.tolist(), colors.endArrow),
    ]);

    this.processPolygon(arrow);

    return newP1;
  }

  private createShapeEndArrow(
    p0: Tensor,
    p1: Tensor,
    width: number,
    colors: {
      start: ColorBase;
      end: ColorBase;
      startArrow: ColorBase;
      endArrow: ColorBase;
    }
  ): Tensor {
    const vt = p1.subtract(p0);
    const vtUnit = vt.unit();
    const vtWidth = vtUnit.scale(width);
    const vtArrow = vtWidth.scale(Math.sqrt(2));

    const newP1 = p1.subtract(vtArrow);

    const vtA = Transform2D.RotateClockwise45Matrix.dot(
        vtWidth.unsqueeze(1)
      ).squeeze(),
      vtB = Transform2D.RotateAntiClockwise45Matrix.dot(
        vtWidth.unsqueeze(1)
      ).squeeze();

    const vtC = Transform2D.RotateClockwise135Matrix.dot(
        vtArrow.unsqueeze(1)
      ).squeeze(),
      vtD = Transform2D.RotateAntiClockwise135Matrix.dot(
        vtArrow.unsqueeze(1)
      ).squeeze();

    const vtE = vtC.add(vtA);
    const vtF = vtD.add(vtB);

    colors.endArrow = this.colorTransition(
      colors.end,
      colors.start,
      vtArrow.norm() / vt.norm()
    );

    const poly1 = new Polygon([
      new Vertex(newP1.tolist(), colors.endArrow),
      new Vertex(newP1.add(vtArrow).tolist(), colors.end),
      new Vertex(newP1.add(vtE).tolist(), colors.endArrow),
      new Vertex(newP1.add(vtC).tolist(), colors.endArrow),
    ]);
    this.processPolygon(poly1);

    const poly2 = new Polygon([
      new Vertex(newP1.tolist(), colors.endArrow),
      new Vertex(newP1.add(vtArrow).tolist(), colors.end),
      new Vertex(newP1.add(vtF).tolist(), colors.endArrow),
      new Vertex(newP1.add(vtD).tolist(), colors.endArrow),
    ]);
    this.processPolygon(poly2);

    return newP1;
  }

  private processLine(line: ILine) {
    let p0 = Tensor.fromArray(line.endpoints[0].xyz.slice(0, 2)),
      p1 = Tensor.fromArray(line.endpoints[1].xyz.slice(0, 2));
    const width = this.toWorldSize(line.width ?? 1);

    // Handle colors
    const fill = line.fill
      ? this.transformColor(line.fill)
      : PureColor.fromHex("#000000");

    const colors = {
      start: fill,
      startArrow: fill,
      endArrow: fill,
      end: fill,
    };
    if (line.endpoints[0].color) {
      colors.startArrow = colors.start = this.transformColor(
        line.endpoints[0].color
      );
    }
    if (line.endpoints[1].color) {
      colors.endArrow = colors.end = this.transformColor(
        line.endpoints[1].color
      );
    }

    if (line.startArrow) {
      if (line.startArrow.style == "shape-arrow") {
        const aWidth = this.toWorldSize(line.startArrow.size || width);
        p0 = this.createShapeStartArrow(p0, p1, aWidth, colors);
      } else if (line.startArrow.style == "triangle-arrow") {
        const aWidth = this.toWorldSize(line.startArrow.size || width * 1.5);
        p0 = this.createTriangleStartArrow(p0, p1, aWidth, colors);
      }
    }

    if (line.endArrow) {
      if (line.endArrow.style == "shape-arrow") {
        const aWidth = this.toWorldSize(line.endArrow.size || width);
        p1 = this.createShapeEndArrow(p0, p1, aWidth, colors);
      } else if (line.endArrow.style == "triangle-arrow") {
        const aWidth = this.toWorldSize(line.endArrow.size || width * 1.5);
        p1 = this.createTriangleEndArrow(p0, p1, aWidth, colors);
      }
    }

    // if (line.round) {
    //   const vecArrowRef = vecUnit.scale(width);
    //   const angle = Math.atan2(vecArrowRef[1], vecArrowRef[0]);

    //   // Create a circle at the start point
    //   const newP0 = p0.add(vecArrowRef);

    //   let circle: ICircle = {
    //     type: "circle",
    //     center: { xyz: newP0.tolist(), color: line.endpoints[0].color },
    //     outerRadius: width / 2,
    //     fill,
    //     startAngle: angle + Math.PI / 2,
    //     endAngle: angle + (Math.PI / 2) * 3,
    //     anticlockwise: false,
    //   };
    //   this.processCircle(circle);

    //   // Update p0 to the new position
    //   p0 = newP0;

    //   // Create a circle at the end point
    //   const newP1 = p1.subtract(vecArrowRef);

    //   circle.center = {
    //     xyz: newP1.tolist(),
    //     color: line.endpoints[1].color,
    //   };
    //   circle.anticlockwise = true;

    //   this.processCircle(circle);

    //   // Update p1 to the new position
    //   p1 = newP1;
    // }

    const dx = p1[0] - p0[0],
      dy = p1[1] - p0[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    // 法线方向
    const normalX = -dy / length,
      normalY = dx / length;

    // 偏移量
    const offset = width / 2;
    const offsetX = normalX * offset;
    const offsetY = normalY * offset;

    // 计算矩形的四个顶点
    const p0Offset = [p0[0] + offsetX, p0[1] + offsetY];
    const p1Offset = [p1[0] + offsetX, p1[1] + offsetY];
    const p0Offset2 = [p0[0] - offsetX, p0[1] - offsetY];
    const p1Offset2 = [p1[0] - offsetX, p1[1] - offsetY];

    const rect = new Polygon(
      [
        new Vertex(p0Offset, colors.startArrow),
        new Vertex(p1Offset, colors.endArrow),
        new Vertex(p1Offset2, colors.endArrow),
        new Vertex(p0Offset2, colors.startArrow),
      ],
      undefined,
      fill
    );

    this.processPolygon(rect);
  }

  private processGrid(x: Axis, y: Axis) {
    const xLower = x.LowerBound;
    const xUpper = x.UpperBound;
    const yLower = y.LowerBound;
    const yUpper = y.UpperBound;

    const xStep = (xUpper - xLower) / 10;
    const yStep = (yUpper - yLower) / 10;

    for (let i = 0; i <= 10; i++) {
      const x = xLower + i * xStep;
      this.createLine(
        [x, yLower, 0.0],
        [x, yUpper, 0.0],
        this.context.pixelToWorld,
        PureColor.fromHex("#8d8d8d")
      );
    }

    for (let i = 0; i <= 10; i++) {
      const y = yLower + i * yStep;
      this.createLine(
        [xLower, y, 0.0],
        [xUpper, y, 0.0],
        this.context.pixelToWorld,
        PureColor.fromHex("#8d8d8d")
      );
    }
  }

  private vertexToTensor(vertex: Vertex): Tensor {
    return Tensor.fromArray(vertex.Xy);
  }

  /**
   * @brief Processes a plot object and converts it into renderable geometry
   *
   * This method takes a plot object (IPlot) and creates line segments using
   * polygons for each consecutive pair of vertices. Each line segment is
   * represented as a quad with the specified width and color.
   *
   * @param plot The plot object to process, containing vertices, width, and color information
   * @throws Error if less than two vertices are provided
   */
  private processCurve(curve: Curve) {
    const vertexes = curve.Vertexes;
    const width = curve.Width;
    const color = curve.Stroke;

    if (vertexes.length < 2) {
      throw new Error("At least two vertexes are required to create a line.");
    }

    for (let i = 0; i < vertexes.length - 1; i++) {
      // Create tensor objects from vertex coordinates
      const vecP0 = this.vertexToTensor(vertexes[i]),
        vecP1 = this.vertexToTensor(vertexes[i + 1]);

      // Calculate the direction vector from p0 to p1
      const vec = vecP1.subtract(vecP0);

      // Get unit vector and normal vector
      const vecUnit = vec.unit();

      // Create perpendicular unit vector for the normal
      // For a 2D vector (x,y), the perpendicular is (-y,x)
      const normalVec = Tensor.fromArray([-vecUnit[1], vecUnit[0]]);

      // Scale the normal vector by half the width
      const offsetVec = normalVec.scale(width / 2);

      // Create colors for the start and end of the line segment
      const colors = {
        start: vertexes[i].Color,
        end: vertexes[i + 1].Color,
      };

      // Ensure the vertices are in the correct order
      const vertices: [Tensor, ColorBase | undefined][] = [
        [vecP0.add(offsetVec), colors.start],
        [vecP1.add(offsetVec), colors.end],
        [vecP1.subtract(offsetVec), colors.end],
        [vecP0.subtract(offsetVec), colors.start],
      ];

      const rect = new Polygon(
        vertices.map(([v, c]) => new Vertex(v.tolist(), c)),
        undefined,
        color
      );

      // Create a polygon for the line segment
      this.processPolygon(rect);
    }
  }

  private createLine(
    start: Tensor | number[],
    end: Tensor | number[],
    width?: number,
    color?: ColorBase,
    startArrow?: IEndPointArrow,
    endArrow?: IEndPointArrow
  ) {
    color = color || PureColor.fromHex("#000000");
    width = width || 1;
    if (start instanceof Tensor) {
      start = start.tolist();
    }
    if (end instanceof Tensor) {
      end = end.tolist();
    }

    const line: ILine = {
      type: "line",
      endpoints: [
        { xyz: [start[0], start[1], 0.0], color: color.Data },
        { xyz: [end[0], end[1], 0.0], color: color.Data },
      ],
      width,
    };
    if (startArrow) {
      line.startArrow = startArrow;
    }
    if (endArrow) {
      line.endArrow = endArrow;
    }

    this.processLine(line);
  }

  private processAxisTick(x: Required<IAxis>, y: Required<IAxis>) {
    const onePixel = this.context.pixelToWorld!;
    const xLower = x.lowerBound;
    const xUpper = x.upperBound;
    const yLower = y.lowerBound;
    const yUpper = y.upperBound;

    const xStep = (xUpper - xLower) / 10;
    const yStep = (yUpper - yLower) / 10;

    if (x.display) {
      for (let i = 0; i <= 10; i++) {
        const x = xLower + i * xStep;
        this.createLine([x, 0.0, 0.0], [x, 8 * onePixel, 0.0], onePixel);
      }
    }

    if (y.display) {
      for (let i = 0; i <= 10; i++) {
        const y = yLower + i * yStep;
        this.createLine([0.0, y, 0.0], [8 * onePixel, y, 0.0], onePixel);
      }
    }
  }

  private processText(text: Text) {
    const { vertexes: textVertexes, indices: textIndices } =
      this.textRenderer.createTextGeometry(text, this.context.pixelToWorld!);

    const startIndex = this.vertexes.length;
    textVertexes.forEach((vertex, idx) => {
      this.vertexes.push({
        position: [vertex.position[0], vertex.position[1], 0, 1],
        color: text.Color.Data,
        texCoord: [vertex.texCoord[0], vertex.texCoord[1]], // Adjusted to match the shader input
        texLayer: vertex.texLayer,
        op: 1,
      });

      textIndices.forEach((index) => {
        this.indices.push(index + startIndex);
      });
    });
  }

  public transform() {
    const task = this.param.task;
    if (!task.scene2D) {
      return;
    }

    const objects = task.scene2D.objects;

    const { x: detX, y: detY } = this.estimateRange({
      x: task.scene2D.xAxis,
      y: task.scene2D.yAxis,
    });

    const x = Axis.fromPlot(detX),
      y = Axis.fromPlot(detY);

    this.calcRescale(x, y);

    this.context.pixelToWorld =
      (1 / this.param.canvas.width) * (x.UpperBound - x.LowerBound);
    this.context.worldToPixel = 1 / this.context.pixelToWorld;

    if (task.scene2D.grid) {
      // @ts-ignore
      this.processGrid(x, y);
    }

    if (task.scene2D.tick) {
      // @ts-ignore
      this.processAxisTick(x, y);
    }

    // @ts-ignore
    this.processAxis(x, y);

    for (const obj of objects) {
      switch (obj.type) {
        case "circle":
          this.processCircle(obj as ICircle);
          break;
        case "polygon":
          this.processPolygon(Polygon.fromPlot(obj as IPolygon));
          break;
        case "line":
          this.processLine(obj as ILine);
          break;
        case "curve":
          this.processCurve(
            Curve.fromPlot(obj as ICurve, this.context as Transform2DContext)
          );
          break;
        case "text":
          this.processText(Text.fromPlot(obj as IText));
          break;
      }
    }

    this.textures.set("text", this.textRenderer.getTexture());

    this.scaleAllVertexes();
  }

  public get ShaderBuffers() {
    return {
      vertexes: this.vertexes,
      indices: this.indices,
      textures: Array.from(this.textures.values()),
    };
  }

  public get OnePixel() {
    return this.context.pixelToWorld;
  }
}

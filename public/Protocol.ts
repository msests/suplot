// All color should be in RGBA format, with values between 0 and 255
type IColor = [number, number, number, number];

// 3d world coordinate
type ICoordinate = [number, number, number];

// Size can either be in unit of pixel or in unit of world coordinate
// number if in unit of world coordinate
// string if in unit of pixel
export type ISize = number | string;

export interface IVertex {
  xyz: ICoordinate;
  color?: IColor;
}

type ArrowStyle = "triangle-arrow" | "shape-arrow" | "circle" | "none";

export interface IEndPointArrow {
  style: ArrowStyle;
  size?: ISize;
  // If arrow has color, it will be filled with it's own color
  // Otherwise, it will be consistent with container's style.
  color?: IColor;
}

type RenderObjectType =
  | "line"
  | "circle"
  | "polygon"
  | "dot"
  | "text"
  | "curve";

export interface IRenderObject {
  type: RenderObjectType;
}

export interface ILine extends IRenderObject {
  endpoints: [IVertex, IVertex];
  width?: ISize;
  fill?: IColor;
  startArrow?: IEndPointArrow;
  endArrow?: IEndPointArrow;
  dashPattern?: number[];
}

export interface ICircle extends IRenderObject {
  center: IVertex;
  outerRadius: ISize;
  innerRadius?: ISize;
  fill?: IColor;
  startAngle?: number;
  endAngle?: number;
  anticlockwise?: boolean;
  segments?: number;
}

export interface IText extends IRenderObject {
  text: string;
  position: ICoordinate;
  color?: IColor;
  size?: number;
  font?: string;
}

export interface IBorder {
  width: ISize;
  color?: IColor;
}

export interface IPolygon extends IRenderObject {
  vertexes: IVertex[];
  borders?: IBorder[];
  fill?: IColor;
}

export interface ICurve extends IRenderObject {
  vertexes: IVertex[];
  width?: number;
  color?: IColor;
}

export interface IAxis {
  label?: string;
  lowerBound?: number;
  upperBound?: number;
  display?: boolean;
  color?: IColor;
}

export interface IScene2D {
  xAxis?: IAxis;
  yAxis?: IAxis;
  grid?: boolean;
  tick?: boolean;
  background?: IColor;
  objects: IRenderObject[];
}

export interface IScene3D {}

export interface IRenderTask {
  sceneType: "2D" | "3D";
  scene2D?: IScene2D;
  scene3D?: IScene3D;
  figureSize?: [number, number];
}

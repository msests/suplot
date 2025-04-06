import { ISize, IText } from "../../../public/Protocol";
import { ColorBase, PureColor } from "../Misc/Color";

export class Text {
  private _content: string;
  private _xyz: [number, number, number];
  private _font: string;
  private _size: ISize;
  private _color: ColorBase;

  constructor(
    content: string = "",
    xyz: [number, number, number] = [0, 0, 0],
    size: ISize = 0,
    color: ColorBase = PureColor.fromRgba(0, 0, 0, 1),
    font: string = "Arial"
  ) {
    this._content = content;
    this._xyz = xyz;
    this._font = font;
    this._size = size;
    this._color = color;
  }

  public get Content(): string {
    return this._content;
  }

  public get Font(): string {
    return this._font;
  }

  public get Size(): ISize {
    return this._size;
  }

  public get Color(): ColorBase {
    return this._color;
  }

  public get Xyz(): [number, number, number] {
    return this._xyz;
  }

  static fromPlot(text: IText) {
    const instance = new Text();
    instance._content = text.text;
    instance._xyz = text.position as [number, number, number];
    instance._font = text.font || "Arial";
    instance._size = text.size || "12px";
    instance._color = text.color
      ? PureColor.fromRgba(
          text.color[0],
          text.color[1],
          text.color[2],
          text.color[3]
        )
      : PureColor.fromRgba(0, 0, 0, 1);
    return instance;
  }
}

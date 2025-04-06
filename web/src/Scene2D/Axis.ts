import { IAxis } from "../../../public/Protocol";
import { ColorBase, PureColor } from "../Misc/Color";

export class Axis {
  private _lowerBound: number;
  private _upperBound: number;
  private _display: boolean;
  private _color: ColorBase;
  private _label: string;

  public get LowerBound(): number {
    return this._lowerBound;
  }

  public get UpperBound(): number {
    return this._upperBound;
  }

  public get Show(): boolean {
    return this._display;
  }

  public get Color(): ColorBase {
    return this._color;
  }

  public get Label(): string {
    return this._label;
  }

  static fromPlot(axis: IAxis) {
    const instance = new Axis();

    if (axis.lowerBound === undefined || axis.upperBound === undefined) {
      throw new Error("Axis bounds are not defined");
    }

    instance._lowerBound = axis.lowerBound;
    instance._upperBound = axis.upperBound;
    instance._display = !!axis.display;
    instance._label = axis.label || "";
    instance._color = axis.color
      ? PureColor.fromRgba(
          axis.color[0],
          axis.color[1],
          axis.color[2],
          axis.color[3]
        )
      : PureColor.fromRgba(0, 0, 0, 1);
    return instance;
  }
}

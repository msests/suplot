import { ColorBase, PureColor } from "./Color";

export class Border {
  private width: number;
  private color?: ColorBase;

  constructor(width: number, color?: ColorBase) {
    this.width = width;
    this.color = color;
    if (!color) {
      this.color = new PureColor([0, 0, 0, 1]); // Default to black if no color is provided
    }
  }

  public get Color(): ColorBase | undefined {
    return this.color;
  }

  public get Width(): number {
    return this.width;
  }
}

// @ts-ignore
import Color, { ColorInstance } from "color";

export class ColorEffect {
  private colors: ColorInstance[] = [];
  private colorStops: number[] = [];

  constructor(color: ColorInstance[]) {
    this.colors.push(...color);
  }

  public IsPure(): boolean {
    return this.colors.length === 1 && this.colorStops.length === 0;
  }

  public getRgba(): [number, number, number, number] | undefined {
    if (this.IsPure()) {
      const color = this.colors[0];
      return [color.red(), color.green(), color.blue(), color.alpha()];
    }
  }

  static fromCssColor(cssColor: string): ColorEffect {
    cssColor = cssColor.trim();
    if (cssColor.startsWith("linear-gradient")) {
      throw new Error("linear-gradient is not supported");
    } else if (cssColor.startsWith("radial-gradient")) {
      throw new Error("radial-gradient is not supported");
    } else {
      const color = Color(cssColor);
      return new ColorEffect([color]);
    }
  }

  static fromColorInstance(color: ColorInstance) {
    return new ColorEffect([color]);
  }

  static fromValue(value: number): ColorEffect {
    const color = Color(value);
    return new ColorEffect([color]);
  }
}

export type ColorType = ColorEffect | ColorInstance | string | number;

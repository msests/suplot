export interface ColorBase {
  type: "pure" | "gradient" | "image";
  get Data(): [number, number, number, number];
  get R(): number;
  get G(): number;
  get B(): number;
  get A(): number;
}

export class PureColor implements ColorBase {
  type: "pure" = "pure";

  constructor(private color: [number, number, number, number]) {}

  get R(): number {
    return this.color[0];
  }

  get G(): number {
    return this.color[1];
  }

  get B(): number {
    return this.color[2];
  }

  get A(): number {
    return this.color[3];
  }

  static fromHex(hex: string): PureColor {
    const hexWithoutHash = hex.replace("#", "");
    const r = parseInt(hexWithoutHash.substring(0, 2), 16) / 255;
    const g = parseInt(hexWithoutHash.substring(2, 4), 16) / 255;
    const b = parseInt(hexWithoutHash.substring(4, 6), 16) / 255;
    // Check if the hex code has an alpha channel
    const a =
      hexWithoutHash.length === 8
        ? parseInt(hexWithoutHash.substring(6, 8), 16) / 255
        : 1;
    return new PureColor([r, g, b, a]);
  }

  static fromRgb(r: number, g: number, b: number): PureColor {
    return new PureColor([r / 255, g / 255, b / 255, 1]);
  }

  static fromRgba(r: number, g: number, b: number, a: number): PureColor {
    return new PureColor([r / 255, g / 255, b / 255, a]);
  }

  static fromValues(values: number[]): PureColor {
    if (values.length !== 4) {
      throw new Error("Array length must be 4");
    }
    return new PureColor([
      values[0] / 255,
      values[1] / 255,
      values[2] / 255,
      values[3],
    ]);
  }

  public get Data(): [number, number, number, number] {
    return this.color;
  }
}

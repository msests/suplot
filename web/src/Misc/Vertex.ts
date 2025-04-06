import { ColorBase } from "./Color";

export class Vertex {
  private xyz: number[] = [0, 0, 0];
  private uv: number[] = [0, 0];
  private color?: ColorBase;

  constructor(coords: number[], color?: ColorBase) {
    if (coords.length < 2) {
      throw new Error("Vertex coordinates must have at least 2 values.");
    }
    if (coords.length == 2) {
      coords.push(0);
    }

    this.xyz[0] = coords[0];
    this.xyz[1] = coords[1];
    this.xyz[2] = coords[2];

    this.color = color;
  }

  public get Xyz(): [number, number, number] {
    return [this.xyz[0], this.xyz[1], this.xyz[2]];
  }

  public get Xy(): [number, number] {
    return [this.xyz[0], this.xyz[1]];
  }

  public get Uv(): [number, number] {
    return [this.uv[0], this.uv[1]];
  }

  public get Color(): ColorBase | undefined {
    return this.color;
  }

  public get Rgba(): [number, number, number, number] | undefined {
    if (this.color) {
      return this.color.Data;
    }
  }
}

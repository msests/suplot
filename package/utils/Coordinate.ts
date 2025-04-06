function GetCartesianCoordinatePosition(values: number[]): number[] {
  return [values[0], values[1], values[2]];
}

function GetPolarCoordinatePosition(values: number[]): number[] {
  const x = values[0] * Math.cos(values[1]) * Math.sin(values[2]);
  const y = values[0] * Math.sin(values[1]) * Math.sin(values[2]);
  const z = values[0] * Math.cos(values[2]);
  return [x, y, z];
}

export enum CoordinateSystem {
  Cartesian = "xyz",
  Polar = "polar",
}

export class Point {
  private position: number[] = [0, 0, 0];

  constructor(coord: CoordinateSystem, ...values: number[]) {
    if (values.length == 2) {
      values.push(0);
    }

    // Default to Cartesian coordinates
    if (coord === CoordinateSystem.Cartesian) {
      this.position = GetCartesianCoordinatePosition(values);
    } else if (coord === CoordinateSystem.Polar) {
      this.position = GetPolarCoordinatePosition(values);
    }
  }

  get X(): number {
    return this.position[0];
  }

  get Y(): number {
    return this.position[1];
  }

  get Z(): number {
    return this.position[2];
  }

  get Xyz(): [number, number, number] {
    return [this.position[0], this.position[1], this.position[2]];
  }

  get Xy(): [number, number] {
    return [this.position[0], this.position[1]];
  }
}

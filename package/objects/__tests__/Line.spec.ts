import { ColorEffect } from "../../utils/ColorEffect";
import { Line } from "../Line";

const jsonPs = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

describe("Line", () => {
  it("Create line with basic attributes.", () => {
    const start = { x: 1, y: 1 };
    const end = { x: 5, y: 5 };
    const line = new Line().start([start.x, start.y]).end([end.x, end.y]);

    expect(jsonPs(line.toPlot())).toStrictEqual({
      type: "line",
      endpoints: [
        {
          xyz: [start.x, start.y, 0],
        },
        {
          xyz: [end.x, end.y, 0],
        },
      ],
    });
  });

  it("Create line with all attributes.", () => {
    const start = { x: 1, y: 1 };
    const end = { x: 5, y: 5 };
    const width = 2;
    const color = "red";

    const line = new Line()
      .start([start.x, start.y])
      .end([end.x, end.y])
      .width(width)
      .fill(color)
      .color(0, 0x00ff00)
      .startArrow({
        style: "triangle-arrow",
        size: 5,
        color: ColorEffect.fromCssColor("blue"),
      })
      .endArrow({
        style: "shape-arrow",
        size: 10,
        color: ColorEffect.fromValue(0x00ff00),
      });

    expect(jsonPs(line.toPlot())).toStrictEqual({
      type: "line",
      endpoints: [
        {
          xyz: [start.x, start.y, 0],
          color: [0, 255, 0, 1],
        },
        {
          xyz: [end.x, end.y, 0],
        },
      ],
      width: width,
      fill: [255, 0, 0, 1],
      startArrow: {
        style: "triangle-arrow",
        size: 5,
        color: [0, 0, 255, 1],
      },
      endArrow: {
        style: "shape-arrow",
        size: 10,
        color: [0, 255, 0, 1],
      },
    });
  });

  it("should throw an error if start or end is not set", () => {
    const line = new Line().start([1, 1]);
    expect(() => line.toPlot()).toThrow("End endpoint should be set!");

    const line2 = new Line().end([5, 5]);
    expect(() => line2.toPlot()).toThrow("Start endpoint should be set!");
  });
});

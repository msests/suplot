import { Circle } from "../Circle";

const jsonPs = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

describe("Circle Test", () => {
  it("Create circle with basic attributes.", () => {
    const center = { x: 1, y: 1 };
    const radius = 5;
    const circle = new Circle().center(center.x, center.y).radius(radius);
    expect(jsonPs(circle.toPlot())).toStrictEqual({
      type: "circle",
      center: {
        xyz: [center.x, center.y, 0],
      },
      outerRadius: 5,
    });
  });

  it("Create circle with all attributes.", () => {
    const center = { x: 1, y: 1 };
    const radius = 5;
    const innerRadius = 3;
    const startAngle = Math.PI / 4;
    const endAngle = (Math.PI * 3) / 4;
    const anticlockwise = true;
    const fillColor = "red";

    const circle = new Circle()
      .center(center.x, center.y)
      .radius(radius, innerRadius)
      .arc(startAngle, endAngle, anticlockwise)
      .fill(fillColor);

    expect(jsonPs(circle.toPlot())).toStrictEqual({
      type: "circle",
      center: {
        xyz: [center.x, center.y, 0],
      },
      outerRadius: radius,
      innerRadius: innerRadius,
      startAngle: startAngle,
      endAngle: endAngle,
      anticlockwise: anticlockwise,
      fill: [255, 0, 0, 1],
    });
  });

  it("should throw an error if center is not set", () => {
    const circle = new Circle().radius(5);
    expect(() => circle.toPlot()).toThrow("Circle center is not set");
  });

  it("should throw an error if radius is not set", () => {
    const center = { x: 1, y: 1 };
    const circle = new Circle().center(center.x, center.y);
    expect(() => circle.toPlot()).toThrow("Circle radius is not set");
  });
});

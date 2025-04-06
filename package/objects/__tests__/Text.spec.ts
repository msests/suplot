import { Text } from "../Text";

const jsonPs = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

describe("Text", () => {
  it("Create text with basic attributes.", () => {
    const text = new Text().str("Hello, World!").position([1, 2]);

    expect(jsonPs(text.toPlot())).toStrictEqual({
      type: "text",
      text: "Hello, World!",
      position: [1, 2, 0],
    });
  });

  it("Create text with all attributes.", () => {
    const text = new Text()
      .str("Hello, World!")
      .position([1, 2])
      .color(0x00ff00)
      .font("Arial")
      .size(0.4);

    expect(jsonPs(text.toPlot())).toStrictEqual({
      type: "text",
      text: "Hello, World!",
      position: [1, 2, 0],
      font: "Arial",
      size: 0.4,
      color: [0, 255, 0, 1],
    });
  });

  it("should throw an error if text is not set", () => {
    const text = new Text().position([1, 2]);
    expect(() => text.toPlot()).toThrow("Text is not set");
  });
});

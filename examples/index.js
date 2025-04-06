import * as R from "../dist/index.js";

const eng = new R.BaseRenderer2D();

const x = new R.Axis().low(-2).high(2).label("X").display(true);
const y = new R.Axis().low(-2).high(2).label("Y").display(true);

eng.figure([640, 640]);

eng.scene().background("#ff000000").xAxis(x).yAxis(y);

eng
  .line(
    { point: [-1.5, -1.5], color: "#00ff00" },
    { point: [1.5, 1], color: "#ff0000" }
  )
  .width(0.1)
  .startArrow({
    style: "triangle-arrow",
  })
  .endArrow({
    style: "shape-arrow",
  });

eng.text("Hello WebGPU", [0, 0]).size(0.3).color("#ff00ff80");

const curve = eng.curve().stroke("#ffffff");

for (let i = 0; i < 50; i++) {
  const x = -1 + i * (2 / 50);
  const y = Math.sin(x * Math.PI) * Math.cos(x * Math.PI);
  curve.point(x, y);
}

eng.circle([-1.5, 1.5], 0.1).fill("#ff0000");

eng
  .triangle([1.3, 1.3], [1.3, 1.5], [1.5, 1.5], undefined, { width: 0.01 })
  .fill("#00ff00");

// eng.rect([-2, 2], [-1, 2], [-1, 1], [-2, 1]).fill("#ffff00");

eng.Render();

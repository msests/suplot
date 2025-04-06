interface IPerfTimeStatistic {
  durations: number[];
  mean: number;
  min: number;
  max: number;
  temp: number;
}

class PerfMon {
  private triangleCount: number = 0;
  private vertexCount: number = 0;

  private times: Map<string, IPerfTimeStatistic> = new Map();

  constructor() {}

  private getStat(name: string): IPerfTimeStatistic {
    if (!this.times.has(name)) {
      this.times.set(name, {
        durations: [],
        mean: 0,
        min: Infinity,
        max: -Infinity,
        temp: 0,
      });
    }
    return this.times.get(name)!;
  }

  public addTriangle() {
    this.triangleCount++;
  }

  public addVertex() {
    this.vertexCount++;
  }

  public start(name: string) {
    const stat = this.getStat(name);
    stat.temp = performance.now();
  }

  public end(name: string) {
    const stat = this.getStat(name);
    const duration = performance.now() - stat.temp;

    // Only keep the last 100 durations
    if (stat.durations.length > 100) {
      stat.durations.shift();
    }
    stat.durations.push(duration);

    // Update mean, min, and max
    stat.mean =
      stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length;
    stat.min = Math.min(stat.min, duration);
    stat.max = Math.max(stat.max, duration);
  }

  public reset() {
    this.triangleCount = 0;
    this.vertexCount = 0;
    this.times.clear();
  }

  public print() {
    console.log("Triangle Count:", this.triangleCount);
    console.log("Vertex Count:", this.vertexCount);
    console.log("Performance Statistics:");

    for (const [name, stat] of this.times.entries()) {
      console.log(
        `${name}: Mean: ${stat.mean.toFixed(2)}ms, Min: ${stat.min.toFixed(
          2
        )}ms, Max: ${stat.max.toFixed(2)}ms`
      );
    }
  }
}

const perfMon = new PerfMon();
export { perfMon };

export class Tensor {
  private shape: number[];

  [key: number]: number;

  constructor(public data: number[], shape?: number[]) {
    if (shape) {
      // Verify shape matches data length
      const totalElements = shape.reduce((a, b) => a * b, 1);
      if (totalElements !== data.length) {
        throw new Error(
          `Shape ${shape} requires ${totalElements} elements, but got ${data.length}`
        );
      }
      this.shape = shape;
    } else {
      // Default to 1D tensor
      this.shape = [data.length];
    }

    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "string" && !isNaN(Number(prop))) {
          return target.data[Number(prop)];
        }
        return (target as any)[prop];
      },
      set(target, prop, value) {
        if (typeof prop === "string" && !isNaN(Number(prop))) {
          target.data[Number(prop)] = value;
          return true;
        }
        (target as any)[prop] = value;
        return true;
      },
    });
  }

  // Get tensor shape
  getShape(): number[] {
    return [...this.shape];
  }

  // Get total number of elements
  size(): number {
    return this.data.length;
  }

  // Get value at index (for 1D tensor)
  get(index: number): number {
    if (index < 0 || index >= this.data.length) {
      throw new Error(
        `Index ${index} out of bounds for tensor of size ${this.data.length}`
      );
    }
    return this.data[index];
  }

  tolist(): number[] {
    return [...this.data];
  }

  item(): number {
    if (this.data.length !== 1) {
      throw new Error("Tensor must be scalar to call item()");
    }
    return this.data[0];
  }

  copy(): Tensor {
    return new Tensor([...this.data], [...this.shape]);
  }

  // Get value at multidimensional index
  at(indices: number[]): number {
    if (indices.length !== this.shape.length) {
      throw new Error(
        `Expected ${this.shape.length} indices but got ${indices.length}`
      );
    }

    let flatIndex = 0;
    let multiplier = 1;

    for (let i = this.shape.length - 1; i >= 0; i--) {
      if (indices[i] < 0 || indices[i] >= this.shape[i]) {
        throw new Error(
          `Index ${indices[i]} out of bounds for dimension ${i} with size ${this.shape[i]}`
        );
      }
      flatIndex += indices[i] * multiplier;
      multiplier *= this.shape[i];
    }

    return this.data[flatIndex];
  }

  // Element-wise operations
  add(other: Tensor | number): Tensor {
    if (typeof other === "number") {
      return new Tensor(
        this.data.map((val) => val + other),
        this.shape
      );
    } else {
      if (this.data.length !== other.data.length) {
        throw new Error(
          "Tensors must have the same number of elements for addition"
        );
      }
      return new Tensor(
        this.data.map((val, i) => val + other.data[i]),
        this.shape
      );
    }
  }

  subtract(other: Tensor | number): Tensor {
    if (typeof other === "number") {
      return new Tensor(
        this.data.map((val) => val - other),
        this.shape
      );
    } else {
      if (this.data.length !== other.data.length) {
        throw new Error(
          "Tensors must have the same number of elements for subtraction"
        );
      }
      return new Tensor(
        this.data.map((val, i) => val - other.data[i]),
        this.shape
      );
    }
  }

  multiply(other: Tensor | number): Tensor {
    if (typeof other === "number") {
      return new Tensor(
        this.data.map((val) => val * other),
        this.shape
      );
    } else {
      if (this.data.length !== other.data.length) {
        throw new Error(
          "Tensors must have the same elements for element-wise multiplication"
        );
      }
      return new Tensor(
        this.data.map((val, i) => val * other.data[i]),
        this.shape
      );
    }
  }

  divide(other: Tensor | number): Tensor {
    if (typeof other === "number") {
      if (other === 0) throw new Error("Division by zero");
      return new Tensor(
        this.data.map((val) => val / other),
        this.shape
      );
    } else {
      if (this.data.length !== other.data.length) {
        throw new Error(
          "Tensors must have the same elements for element-wise division"
        );
      }
      const result = this.data.map((val, i) => {
        if (other.data[i] === 0) throw new Error("Division by zero");
        return val / other.data[i];
      });
      return new Tensor(result, this.shape);
    }
  }

  // Reshape tensor
  reshape(newShape: number[]): Tensor {
    const totalElements = newShape.reduce((a, b) => a * b, 1);
    if (totalElements !== this.data.length) {
      throw new Error(
        `Cannot reshape tensor of size ${this.data.length} to shape ${newShape}`
      );
    }
    return new Tensor([...this.data], newShape);
  }

  // Compute sum of all elements
  sum(): number {
    return this.data.reduce((sum, val) => sum + val, 0);
  }

  // Compute mean of all elements
  mean(): number {
    if (this.data.length === 0) return 0;
    return this.sum() / this.data.length;
  }

  // Scale the tensor by a scalar value
  scale(value: number): Tensor {
    return new Tensor(
      this.data.map((val) => val * value),
      this.shape
    );
  }

  // Normalize the tensor
  normalize(): Tensor {
    const sum = this.data.reduce((sum, val) => sum + val, 0);
    return new Tensor(
      this.data.map((val) => val / sum),
      this.shape
    );
  }

  // Get the unit vector
  unit(): Tensor {
    const norm = Math.sqrt(this.data.reduce((sum, val) => sum + val ** 2, 0));
    return new Tensor(
      this.data.map((val) => val / norm),
      this.shape
    );
  }

  // Transpose the tensor (for 2D tensors)
  transpose(): Tensor {
    if (this.shape.length !== 2) {
      throw new Error("Transpose operation is only supported for 2D tensors");
    }

    const [rows, cols] = this.shape;
    const newData: number[] = [];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        newData.push(this.data[r * cols + c]);
      }
    }

    return new Tensor(newData, [cols, rows]);
  }

  // Matrix multiplication and vector dot product
  dot(other: Tensor): Tensor {
    // Vector dot product (1D * 1D)
    if (this.shape.length === 1 && other.shape.length === 1) {
      if (this.shape[0] !== other.shape[0]) {
        throw new Error(
          `Incompatible dimensions for dot product: ${this.shape[0]} and ${other.shape[0]}`
        );
      }

      let result = 0;
      for (let i = 0; i < this.shape[0]; i++) {
        result += this.data[i] * other.data[i];
      }

      return new Tensor([result], [1]);
    }

    // High-dimensional dot product
    if (this.shape.length >= 2 || other.shape.length >= 2) {
      const sharedDim = this.shape[this.shape.length - 1];
      if (sharedDim !== other.shape[other.shape.length - 2]) {
        throw new Error(
          `Incompatible dimensions for high-dimensional dot product: ${sharedDim} and ${
            other.shape[other.shape.length - 2]
          }`
        );
      }

      const newShape = [...this.shape.slice(0, -1), ...other.shape.slice(1)];
      const resultSize = newShape.reduce((a, b) => a * b, 1);
      const resultData = new Array(resultSize).fill(0);

      const indices = new Array(newShape.length).fill(0);
      const incrementIndices = () => {
        let i = indices.length - 1;
        while (i >= 0) {
          indices[i]++;
          if (indices[i] < newShape[i]) {
            break;
          }
          indices[i] = 0;
          i--;
        }
      };

      for (let r = 0; r < resultSize; r++) {
        let sum = 0;
        for (let k = 0; k < sharedDim; k++) {
          const thisIndices = [...indices.slice(0, this.shape.length - 1), k];
          const otherIndices = [k, ...indices.slice(this.shape.length - 1)];

          let thisFlatIndex = 0;
          let thisMultiplier = 1;
          for (let i = this.shape.length - 1; i >= 0; i--) {
            thisFlatIndex += thisIndices[i] * thisMultiplier;
            thisMultiplier *= this.shape[i];
          }

          let otherFlatIndex = 0;
          let otherMultiplier = 1;
          for (let i = other.shape.length - 1; i >= 0; i--) {
            otherFlatIndex += otherIndices[i] * otherMultiplier;
            otherMultiplier *= other.shape[i];
          }

          sum += this.data[thisFlatIndex] * other.data[otherFlatIndex];
        }
        resultData[r] = sum;
        incrementIndices();
      }

      return new Tensor(resultData, newShape);
    }

    throw new Error(`Dot product not implemented for these tensor shapes`);
  }

  /**
   * Removes dimensions of size 1 from the tensor shape.
   *
   * @returns A new tensor with all single-dimension entries removed from the shape
   *
   * @example
   * const t = new Tensor([1, 2, 3, 4], [1, 4, 1]);
   * const squeezed = t.squeeze(); // Shape becomes [4]
   */
  squeeze(): Tensor {
    const newShape = this.shape.filter((dim) => dim !== 1);
    return new Tensor([...this.data], newShape);
  }

  /**
   * Adds a dimension of size 1 at the specified position in the tensor shape.
   *
   * @param dim - The position where the new dimension of size 1 will be inserted
   * @returns A new tensor with an additional dimension of size 1 at the specified position
   * @throws Error if the dimension is not between 0 and the number of dimensions
   *
   * @example
   * const t = new Tensor([1, 2, 3, 4], [4]);
   * const unsqueezed = t.unsqueeze(0); // Shape becomes [1, 4]
   * const unsqueezed2 = t.unsqueeze(1); // Shape becomes [4, 1]
   */
  unsqueeze(dim: number): Tensor {
    if (dim < 0 || dim > this.shape.length) {
      throw new Error(
        `Invalid dimension ${dim} for unsqueeze operation. Should be between 0 and ${this.shape.length}`
      );
    }
    const newShape = [...this.shape];
    newShape.splice(dim, 0, 1);
    return new Tensor([...this.data], newShape);
  }

  // Static utility methods
  static zeros(shape: number[]): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    return new Tensor(new Array(size).fill(0), shape);
  }

  static ones(shape: number[]): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    return new Tensor(new Array(size).fill(1), shape);
  }

  static random(shape: number[]): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    const data = new Array(size).fill(0).map(() => Math.random());
    return new Tensor(data, shape);
  }

  static normal(shape: number[], mean = 0, std = 1): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    const data = new Array(size).fill(0).map(() => {
      return mean + std * Math.random();
    });
    return new Tensor(data, shape);
  }

  static fromArray(arr: number[]): Tensor {
    return new Tensor(arr, [arr.length]);
  }
}

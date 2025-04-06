export function isNum(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function assertNonNull(
  value: unknown,
  message: string = "Expected value to be null"
): asserts value {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

export function assertLenGtOne(
  values: unknown[],
  message: string = "Expected at least one element."
): asserts values {
  if (values.length === 0) {
    throw new Error(message);
  }
}

export function assertLenGtTwo(
  values: unknown[],
  message: string = "Expected at least two elements."
): asserts values {
  if (values.length < 2) {
    throw new Error(message);
  }
}

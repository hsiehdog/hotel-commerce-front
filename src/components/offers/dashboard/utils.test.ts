import { describe, expect, it } from "vitest";

import { asRecord, firstNumber, formatMoney, safeStringify, scoreCell, toString } from "./utils";

describe("dashboard utils", () => {
  it("formats money and score values", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
    expect(formatMoney(null)).toBe("n/a");
    expect(scoreCell(0.8731)).toBe("0.87");
    expect(scoreCell(null)).toBe("-");
  });

  it("parses basic primitive values", () => {
    expect(toString("abc")).toBe("abc");
    expect(toString(42)).toBe("42");
    expect(firstNumber(undefined, "5.2", 7)).toBe(5.2);
  });

  it("handles records and stringify safely", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord([1, 2])).toEqual({});
    expect(safeStringify({ a: 1 })).toContain('"a": 1');
  });
});

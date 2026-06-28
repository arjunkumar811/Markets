import { expect, test } from "bun:test";
import { calculateProbability } from "./probability";

test("50 / 50 -> 50%", () => {
  const result = calculateProbability(50, 50);
  expect(result.yes).toBe(50);
  expect(result.no).toBe(50);
});

test("55 / 50 -> 52.38%", () => {
  const result = calculateProbability(55, 50);
  expect(result.yes).toBe(52.38);
  expect(result.no).toBe(47.62);
});

test("60 / 40 -> 60%", () => {
  const result = calculateProbability(60, 40);
  expect(result.yes).toBe(60);
  expect(result.no).toBe(40);
});

test("0 / 100 -> 0%", () => {
  const result = calculateProbability(0, 100);
  expect(result.yes).toBe(0);
  expect(result.no).toBe(100);
});

test("100 / 0 -> 100%", () => {
  const result = calculateProbability(100, 0);
  expect(result.yes).toBe(100);
  expect(result.no).toBe(0);
});

test("0 / 0 -> 50%", () => {
  const result = calculateProbability(0, 0);
  expect(result.yes).toBe(50);
  expect(result.no).toBe(50);
});

import { describe, it, expect } from "vitest";

import { alphaBounds, keepLargestPerson, maskToAlpha } from "./photo-cutout";

describe("maskToAlpha", () => {
  it("clear background is transparent, a clear person is solid", () => {
    const a = maskToAlpha(new Float32Array([1, 0.9, 0.1, 0]));
    expect(a[0]).toBe(0);
    expect(a[1]).toBe(0); // 10% person: below the soft edge, no halo
    expect(a[2]).toBe(255); // 90% person: fully kept
    expect(a[3]).toBe(255);
  });

  it("keeps a soft edge where the model is unsure (hair)", () => {
    const [mid] = maskToAlpha(new Float32Array([0.5]));
    expect(mid).toBeGreaterThan(100);
    expect(mid).toBeLessThan(155);
  });
});

describe("keepLargestPerson", () => {
  it("drops a smaller person in the background but keeps the main one's soft edge", () => {
    // 6x3 frame: a 1px "person" at x=0, a 3px-wide one at x=3..5, soft edge at x=2.
    const w = 6, h = 3;
    const a = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) {
      a[y * w + 0] = 255; // small person
      a[y * w + 2] = 60; // soft edge next to the main person
      for (let x = 3; x < 6; x++) a[y * w + x] = 255; // main person
    }
    const out = keepLargestPerson(a, w, h);
    for (let y = 0; y < h; y++) {
      expect(out[y * w + 0]).toBe(0);
      expect(out[y * w + 2]).toBe(60);
      expect(out[y * w + 4]).toBe(255);
    }
  });

  it("returns an empty mask when there is no solid person", () => {
    expect(keepLargestPerson(new Uint8ClampedArray([10, 20, 30, 40]), 2, 2).every((v) => v === 0)).toBe(true);
  });
});

describe("alphaBounds", () => {
  // 4x4 frame, person in the middle two columns of the bottom three rows.
  const w = 4, h = 4;
  const alpha = new Uint8ClampedArray(w * h);
  for (const [x, y] of [[1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3]]) alpha[y * w + x] = 255;

  it("finds the box around the person and their share of the frame", () => {
    expect(alphaBounds(alpha, w, h)).toEqual({ x: 1, y: 1, w: 2, h: 3, share: 6 / 16 });
  });

  it("is null when nothing is opaque", () => {
    expect(alphaBounds(new Uint8ClampedArray(16), w, h)).toBeNull();
  });
});

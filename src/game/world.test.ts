import { describe, it, expect } from "vitest";
import { hexNeighbors, hexKey } from "./world";

describe("hexNeighbors", () => {
  it("returns the 6 axial neighbors", () => {
    const got = hexNeighbors(0, 0).map(({ q, r }) => hexKey(q, r)).sort();
    expect(got).toEqual(["-1,0", "-1,1", "0,-1", "0,1", "1,-1", "1,0"].sort());
  });
  it("is offset correctly from a non-origin hex", () => {
    const got = hexNeighbors(2, -1).map(({ q, r }) => hexKey(q, r));
    expect(got).toContain("3,-1");
    expect(got).toContain("2,0");
  });
});

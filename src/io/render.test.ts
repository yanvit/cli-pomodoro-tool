import { describe, expect, it } from "vitest";
import { initialState } from "../core/cycle.js";
import { renderFrame } from "./render.js";

describe("renderFrame", () => {
  it("returns a boxed frame with consistent, equal-width lines", () => {
    const frame = renderFrame(initialState);
    const width = frame[0].length;
    frame.forEach((line) => expect(line.length).toBe(width));
    expect(frame[0].startsWith("┌")).toBe(true);
    expect(frame[frame.length - 1].startsWith("└")).toBe(true);
  });

  it("includes the phase label and round", () => {
    const frame = renderFrame(initialState).join("\n");
    expect(frame).toContain("Work");
    expect(frame).toContain("Round 1/4");
  });

  it("shows 0% right at the start of a phase", () => {
    const frame = renderFrame(initialState).join("\n");
    expect(frame).toContain("0%");
  });

  it("centers within a terminal wider than the box", () => {
    const narrow = renderFrame(initialState, 40);
    const wide = renderFrame(initialState, 120);
    expect(wide[0].length).toBeGreaterThan(narrow[0].length);
  });

  it("AC-08/AC-02 (review 2026-10-01 #1/#3): appends PAUSED to the header line when paused, and omits it when not", () => {
    const paused = renderFrame(initialState, undefined, true).join("\n");
    expect(paused).toContain("PAUSED");

    const running = renderFrame(initialState, undefined, false).join("\n");
    expect(running).not.toContain("PAUSED");

    const defaulted = renderFrame(initialState).join("\n");
    expect(defaulted).not.toContain("PAUSED");
  });
});

import { describe, expect, it } from "vitest";
import { initialState, type CycleState } from "../core/cycle.js";
import { renderCompactLine } from "./compactLine.js";

describe("renderCompactLine", () => {
  it("fits within the given terminal width", () => {
    const line = renderCompactLine(initialState, 60);
    expect(line.length).toBeLessThanOrEqual(60);
  });

  it("includes the phase label and formatted time", () => {
    const line = renderCompactLine(initialState, 60);
    expect(line).toContain("Work");
    expect(line).toContain("25:00");
  });

  it("never shrinks the bar below the minimum width, even in a tiny terminal", () => {
    const line = renderCompactLine(initialState, 10);
    expect(line).toContain("░");
  });

  it("fills more of the bar as time elapses", () => {
    const start: CycleState = { phase: "work", round: 1, secondsRemaining: 1500 };
    const halfway: CycleState = { phase: "work", round: 1, secondsRemaining: 750 };
    const startFilled = renderCompactLine(start, 60).split("█").length - 1;
    const halfwayFilled = renderCompactLine(halfway, 60).split("█").length - 1;
    expect(halfwayFilled).toBeGreaterThan(startFilled);
  });

  it("AC-08/AC-01 (review 2026-10-01 #2/#3): prepends PAUSED when paused, never exceeding terminalWidth", () => {
    const line = renderCompactLine(initialState, 40, true);
    expect(line.startsWith("PAUSED ")).toBe(true);
    expect(line.length).toBeLessThanOrEqual(40);

    const notPaused = renderCompactLine(initialState, 40, false);
    expect(notPaused).not.toContain("PAUSED");

    const defaulted = renderCompactLine(initialState, 40);
    expect(defaulted).not.toContain("PAUSED");
  });
});

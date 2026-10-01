import { describe, expect, it } from "vitest";
import { PHASE_DURATIONS_SEC, type CycleState } from "../core/cycle.js";
import { phaseColorAnsi, phaseColorRGB } from "./phaseColor.js";

function workState(secondsRemaining: number): CycleState {
  return { phase: "work", round: 1, secondsRemaining };
}

function distance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

describe("phaseColorRGB", () => {
  it("stays at the phase's base color above the urgency threshold", () => {
    const full = phaseColorRGB(workState(PHASE_DURATIONS_SEC.work));
    const halfway = phaseColorRGB(workState(Math.round(PHASE_DURATIONS_SEC.work * 0.5)));
    expect(halfway).toEqual(full);
  });

  it("reaches the urgent red exactly when time runs out", () => {
    expect(phaseColorRGB(workState(0))).toEqual({ r: 230, g: 50, b: 50 });
  });

  it("gets monotonically closer to urgent red as the phase's last 15% ticks down", () => {
    const urgent = { r: 230, g: 50, b: 50 };
    const early = phaseColorRGB(workState(Math.round(PHASE_DURATIONS_SEC.work * 0.14)));
    const late = phaseColorRGB(workState(Math.round(PHASE_DURATIONS_SEC.work * 0.02)));
    expect(distance(late, urgent)).toBeLessThan(distance(early, urgent));
  });

  it("differs per phase above the threshold (break colors aren't the work color)", () => {
    const work = phaseColorRGB({ phase: "work", round: 1, secondsRemaining: PHASE_DURATIONS_SEC.work });
    const shortBreak = phaseColorRGB({
      phase: "short_break",
      round: 1,
      secondsRemaining: PHASE_DURATIONS_SEC.short_break,
    });
    expect(shortBreak).not.toEqual(work);
  });
});

describe("phaseColorAnsi", () => {
  it("renders a 24-bit ANSI foreground color escape", () => {
    expect(phaseColorAnsi(workState(PHASE_DURATIONS_SEC.work))).toBe("\x1b[38;2;255;140;90m");
  });
});

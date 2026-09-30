import { describe, expect, it } from "vitest";
import { initialState, PHASE_DURATIONS_SEC, tick, type CycleState, type Transition } from "./cycle.js";

function advance(state: CycleState, ticks: number): Transition {
  let transition: Transition = { type: "tick", state };
  for (let i = 0; i < ticks; i++) {
    transition = tick(transition.state);
  }
  return transition;
}

function phaseChangesUntil(count: number): Transition[] {
  const changes: Transition[] = [];
  let state = initialState;
  while (changes.length < count) {
    const transition = tick(state);
    state = transition.state;
    if (transition.type === "phase-change") {
      changes.push(transition);
    }
  }
  return changes;
}

describe("initialState", () => {
  it("starts on work, round 1, full duration", () => {
    expect(initialState).toEqual({
      phase: "work",
      round: 1,
      secondsRemaining: PHASE_DURATIONS_SEC.work,
    });
  });
});

describe("tick", () => {
  it("counts down without changing phase", () => {
    const transition = tick(initialState);
    expect(transition.type).toBe("tick");
    expect(transition.state.phase).toBe("work");
    expect(transition.state.secondsRemaining).toBe(PHASE_DURATIONS_SEC.work - 1);
  });

  it("transitions work -> short_break after the work duration elapses, same round", () => {
    const transition = advance(initialState, PHASE_DURATIONS_SEC.work);
    expect(transition).toMatchObject({
      type: "phase-change",
      from: "work",
      to: "short_break",
      state: { phase: "short_break", round: 1, secondsRemaining: PHASE_DURATIONS_SEC.short_break },
    });
  });

  it("transitions short_break -> work, incrementing the round", () => {
    const afterWork = advance(initialState, PHASE_DURATIONS_SEC.work);
    const transition = advance(afterWork.state, PHASE_DURATIONS_SEC.short_break);
    expect(transition).toMatchObject({
      type: "phase-change",
      from: "short_break",
      to: "work",
      state: { phase: "work", round: 2, secondsRemaining: PHASE_DURATIONS_SEC.work },
    });
  });
});

describe("full cycle", () => {
  it("takes a long break only after the 4th work round, then resets to round 1", () => {
    const changes = phaseChangesUntil(8);
    expect(changes.map((c) => ({ to: c.state.phase, round: c.state.round }))).toEqual([
      { to: "short_break", round: 1 },
      { to: "work", round: 2 },
      { to: "short_break", round: 2 },
      { to: "work", round: 3 },
      { to: "short_break", round: 3 },
      { to: "work", round: 4 },
      { to: "long_break", round: 4 },
      { to: "work", round: 1 },
    ]);
  });
});

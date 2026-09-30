export type Phase = "work" | "short_break" | "long_break";

export interface CycleState {
  phase: Phase;
  round: number;
  secondsRemaining: number;
}

export const PHASE_DURATIONS_SEC: Record<Phase, number> = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

export const initialState: CycleState = {
  phase: "work",
  round: 1,
  secondsRemaining: PHASE_DURATIONS_SEC.work,
};

export type Transition =
  | { type: "tick"; state: CycleState }
  | { type: "phase-change"; state: CycleState; from: Phase; to: Phase };

function nextPhase(phase: Phase, round: number): { phase: Phase; round: number } {
  switch (phase) {
    case "work":
      return round < 4 ? { phase: "short_break", round } : { phase: "long_break", round };
    case "short_break":
      return { phase: "work", round: round + 1 };
    case "long_break":
      return { phase: "work", round: 1 };
  }
}

export function tick(state: CycleState): Transition {
  if (state.secondsRemaining > 1) {
    return { type: "tick", state: { ...state, secondsRemaining: state.secondsRemaining - 1 } };
  }

  const { phase, round } = nextPhase(state.phase, state.round);
  const next: CycleState = { phase, round, secondsRemaining: PHASE_DURATIONS_SEC[phase] };
  return { type: "phase-change", state: next, from: state.phase, to: phase };
}

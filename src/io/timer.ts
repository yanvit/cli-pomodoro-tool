import { initialState, tick, type CycleState, type Phase } from "../core/cycle.js";

const PHASE_LABEL: Record<Phase, string> = {
  work: "Work",
  short_break: "Short break",
  long_break: "Long break",
};

const BELL = "\x07";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function printCountdown(state: CycleState): void {
  process.stdout.write(`\r${PHASE_LABEL[state.phase]} — ${formatTime(state.secondsRemaining)} remaining `);
}

function announcePhase(state: CycleState): void {
  process.stdout.write(`${BELL}${PHASE_LABEL[state.phase]} started — ${formatTime(state.secondsRemaining)}\n`);
}

export function startTimer(): void {
  let state: CycleState = initialState;
  announcePhase(state);

  const interval = setInterval(() => {
    const transition = tick(state);
    state = transition.state;

    if (transition.type === "phase-change") {
      announcePhase(state);
    } else {
      printCountdown(state);
    }
  }, 1000);

  process.on("SIGINT", () => {
    clearInterval(interval);
    process.stdout.write("\n");
    process.exit(0);
  });
}

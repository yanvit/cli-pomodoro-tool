import { initialState, tick, type CycleState } from "../core/cycle.js";
import { recordCompletedPhase } from "../history/record.js";
import { renderCompactLine } from "./compactLine.js";
import { phaseColorAnsi } from "./phaseColor.js";
import { formatTime, PHASE_LABEL, renderFrame } from "./render.js";
import { pickRenderMode, type RenderMode } from "./renderMode.js";

const RESET = "\x1b[0m";
const ENTER_ALT_SCREEN = "\x1b[?1049h";
const EXIT_ALT_SCREEN = "\x1b[?1049l";
const CURSOR_HOME = "\x1b[H";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_TO_EOL = "\x1b[K";
const BELL = "\x07";

function drawDashboard(state: CycleState): void {
  const frame = renderFrame(state, process.stdout.columns);
  const lines = frame.map((line) => line + CLEAR_TO_EOL).join("\n");
  process.stdout.write(CURSOR_HOME + phaseColorAnsi(state) + lines + RESET);
}

function drawCompact(state: CycleState): void {
  const line = renderCompactLine(state, process.stdout.columns);
  process.stdout.write("\r" + phaseColorAnsi(state) + line + RESET + CLEAR_TO_EOL);
}

function logPlainPhaseStart(state: CycleState): void {
  process.stdout.write(`${PHASE_LABEL[state.phase]} started — ${formatTime(state.secondsRemaining)}\n`);
}

export function startTimer(): void {
  const mode: RenderMode = pickRenderMode(Boolean(process.stdout.isTTY), process.stdout.columns);
  let state: CycleState = initialState;
  let cleanedUp = false;

  function cleanup(): void {
    if (cleanedUp) return;
    cleanedUp = true;
    if (mode === "dashboard") {
      process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
    } else if (mode === "compact") {
      process.stdout.write(SHOW_CURSOR + "\n");
    }
  }
  process.on("exit", cleanup);

  if (mode === "dashboard") {
    process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);
    drawDashboard(state);
    process.stdout.write(BELL);
  } else if (mode === "compact") {
    process.stdout.write(HIDE_CURSOR);
    drawCompact(state);
    process.stdout.write(BELL);
  } else {
    logPlainPhaseStart(state);
  }

  const interval = setInterval(() => {
    const completedRound = state.round;
    const transition = tick(state);
    state = transition.state;

    if (transition.type === "phase-change") {
      recordCompletedPhase(transition.from, completedRound);
    }

    if (mode === "dashboard") {
      drawDashboard(state);
      if (transition.type === "phase-change") process.stdout.write(BELL);
    } else if (mode === "compact") {
      drawCompact(state);
      if (transition.type === "phase-change") process.stdout.write(BELL);
    } else if (transition.type === "phase-change") {
      logPlainPhaseStart(state);
    }
  }, 1000);

  process.on("SIGINT", () => {
    clearInterval(interval);
    process.exit(0);
  });
}

import { initialState, tick, type CycleState } from "../core/cycle.js";
import { renderCompactLine } from "./compactLine.js";
import { startKeypressCapture, type KeypressHandle } from "./keypress.js";
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

function drawDashboard(state: CycleState, paused = false): void {
  const frame = renderFrame(state, process.stdout.columns, paused);
  const lines = frame.map((line) => line + CLEAR_TO_EOL).join("\n");
  process.stdout.write(CURSOR_HOME + phaseColorAnsi(state) + lines + RESET);
}

function drawCompact(state: CycleState, paused = false): void {
  const line = renderCompactLine(state, process.stdout.columns, paused);
  process.stdout.write("\r" + phaseColorAnsi(state) + line + RESET + CLEAR_TO_EOL);
}

function logPlainPhaseStart(state: CycleState): void {
  process.stdout.write(`${PHASE_LABEL[state.phase]} started — ${formatTime(state.secondsRemaining)}\n`);
}

export function startTimer(): void {
  const mode: RenderMode = pickRenderMode(Boolean(process.stdout.isTTY), process.stdout.columns);
  let state: CycleState = initialState;
  let paused = false;
  let pausedAt: number | undefined;
  let cleanedUp = false;
  let keypressHandle: KeypressHandle | undefined;

  function cleanup(): void {
    if (cleanedUp) return;
    cleanedUp = true;
    keypressHandle?.stop();
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

  function onTick(): void {
    const transition = tick(state);
    state = transition.state;

    if (mode === "dashboard") {
      drawDashboard(state);
      if (transition.type === "phase-change") process.stdout.write(BELL);
    } else if (mode === "compact") {
      drawCompact(state);
      if (transition.type === "phase-change") process.stdout.write(BELL);
    } else if (transition.type === "phase-change") {
      logPlainPhaseStart(state);
    }
  }

  let interval = setInterval(onTick, 1000);

  if (mode === "dashboard" || mode === "compact") {
    keypressHandle = startKeypressCapture(
      () => {
        if (!paused) {
          paused = true;
          pausedAt = Date.now();
          clearInterval(interval);
          if (mode === "dashboard") drawDashboard(state, true);
          else drawCompact(state, true);
          return;
        }

        paused = false;
        const pausedForMs = Date.now() - (pausedAt ?? Date.now());
        pausedAt = undefined;
        if (state.secondsRemaining <= 1 && pausedForMs >= 1000) {
          // the phase was already due to end — a full second's worth of
          // real time actually passed while paused — so flush the
          // deferred transition immediately rather than waiting for the
          // next 1s interval tick (AC-05). A near-instant pause/resume at
          // secondsRemaining === 1 falls through to the re-armed interval
          // below instead, exactly like an unpaused tick would.
          const transition = tick(state);
          state = transition.state;
          if (transition.type === "phase-change") process.stdout.write(BELL);
        }
        // re-arm fresh rather than reuse the original interval's leftover
        // phase, so the next tick lands a full second after resume, not
        // whenever the original schedule happened to land (review #7).
        interval = setInterval(onTick, 1000);
        if (mode === "dashboard") drawDashboard(state, false);
        else drawCompact(state, false);
      },
      () => {
        clearInterval(interval);
        process.exit(0);
      },
    );
  }

  process.on("SIGINT", () => {
    clearInterval(interval);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    clearInterval(interval);
    process.exit(0);
  });

  process.on("SIGHUP", () => {
    clearInterval(interval);
    process.exit(0);
  });
}

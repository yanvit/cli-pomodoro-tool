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

  // activeMsInQuantum accumulates only real, unpaused time toward the
  // current 1s quantum — reset whenever a tick actually fires. Pausing
  // banks whatever has accrued in the current segment; resuming starts a
  // new segment and schedules only the remainder, never a fresh full
  // second. No number of pause/resume cycles can stretch a phase past its
  // nominal duration this way (AC-02) — re-review 2026-10-01 residual #1.
  let activeMsInQuantum = 0;
  let segmentStartedAt = Date.now();
  let nextTickTimer: ReturnType<typeof setTimeout>;

  function scheduleNextTick(delayMs: number): void {
    nextTickTimer = setTimeout(() => {
      onTick();
      activeMsInQuantum = 0;
      segmentStartedAt = Date.now();
      scheduleNextTick(1000);
    }, delayMs);
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

  scheduleNextTick(1000);

  if (mode === "dashboard" || mode === "compact") {
    keypressHandle = startKeypressCapture(
      () => {
        if (!paused) {
          paused = true;
          pausedAt = Date.now();
          activeMsInQuantum += pausedAt - segmentStartedAt;
          clearTimeout(nextTickTimer);
          if (mode === "dashboard") drawDashboard(state, true);
          else drawCompact(state, true);
          return;
        }

        paused = false;
        const resumedAt = Date.now();
        const pausedForMs = resumedAt - (pausedAt ?? resumedAt);
        pausedAt = undefined;
        segmentStartedAt = resumedAt;
        if (state.secondsRemaining <= 1 && pausedForMs >= 1000) {
          // the phase was already due to end — a full second's worth of
          // real time actually passed while paused — so flush the
          // deferred transition immediately rather than waiting for the
          // next tick (AC-05). A near-instant pause/resume at
          // secondsRemaining === 1 falls through to the remaining-time
          // schedule below instead, exactly like an unpaused tick would.
          const transition = tick(state);
          state = transition.state;
          if (transition.type === "phase-change") process.stdout.write(BELL);
          activeMsInQuantum = 0;
          scheduleNextTick(1000);
        } else {
          // only the remaining part of the interrupted quantum is owed —
          // the time already spent before pausing still counts (it's
          // banked in activeMsInQuantum), and the paused duration itself
          // never does.
          scheduleNextTick(Math.max(0, 1000 - activeMsInQuantum));
        }
        if (mode === "dashboard") drawDashboard(state, false);
        else drawCompact(state, false);
      },
      () => {
        clearTimeout(nextTickTimer);
        process.exit(0);
      },
    );
  }

  process.on("SIGINT", () => {
    clearTimeout(nextTickTimer);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    clearTimeout(nextTickTimer);
    process.exit(0);
  });

  process.on("SIGHUP", () => {
    clearTimeout(nextTickTimer);
    process.exit(0);
  });
}

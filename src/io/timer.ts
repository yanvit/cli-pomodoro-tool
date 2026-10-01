import { initialState, tick, type CycleState, type Phase } from "../core/cycle.js";
import { renderFrame } from "./render.js";

const PHASE_COLOR: Record<Phase, string> = {
  work: "\x1b[38;5;209m",
  short_break: "\x1b[38;5;114m",
  long_break: "\x1b[38;5;75m",
};

const RESET = "\x1b[0m";
const ENTER_ALT_SCREEN = "\x1b[?1049h";
const EXIT_ALT_SCREEN = "\x1b[?1049l";
const CURSOR_HOME = "\x1b[H";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_TO_EOL = "\x1b[K";
const BELL = "\x07";

function draw(state: CycleState): void {
  const frame = renderFrame(state, process.stdout.columns);
  const lines = frame.map((line) => line + CLEAR_TO_EOL).join("\n");
  process.stdout.write(CURSOR_HOME + PHASE_COLOR[state.phase] + lines + RESET);
}

export function startTimer(): void {
  let state: CycleState = initialState;
  let cleanedUp = false;

  function cleanup(): void {
    if (cleanedUp) return;
    cleanedUp = true;
    process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
  }
  process.on("exit", cleanup);

  process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);
  draw(state);
  process.stdout.write(BELL);

  const interval = setInterval(() => {
    const transition = tick(state);
    state = transition.state;
    draw(state);
    if (transition.type === "phase-change") {
      process.stdout.write(BELL);
    }
  }, 1000);

  process.on("SIGINT", () => {
    clearInterval(interval);
    process.exit(0);
  });
}

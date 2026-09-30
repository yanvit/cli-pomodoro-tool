import { initialState, tick, type CycleState, type Phase } from "../core/cycle.js";
import { renderFrame } from "./render.js";

const PHASE_COLOR: Record<Phase, string> = {
  work: "\x1b[38;5;209m",
  short_break: "\x1b[38;5;114m",
  long_break: "\x1b[38;5;75m",
};

const RESET = "\x1b[0m";
const CLEAR_AND_HOME = "\x1b[2J\x1b[H";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const BELL = "\x07";

function draw(state: CycleState): void {
  const frame = renderFrame(state, process.stdout.columns);
  process.stdout.write(CLEAR_AND_HOME + PHASE_COLOR[state.phase] + frame.join("\n") + RESET + "\n");
}

export function startTimer(): void {
  let state: CycleState = initialState;
  process.stdout.write(HIDE_CURSOR);
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
    process.stdout.write(SHOW_CURSOR + "\n");
    process.exit(0);
  });
}

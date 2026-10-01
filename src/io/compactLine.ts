import { PHASE_DURATIONS_SEC, type CycleState } from "../core/cycle.js";
import { formatTime, PHASE_LABEL } from "./render.js";

const MIN_BAR_WIDTH = 4;
const DEFAULT_WIDTH = 80;

export function renderCompactLine(
  state: CycleState,
  terminalWidth = DEFAULT_WIDTH,
  paused = false,
): string {
  // A default parameter only applies when the argument is omitted
  // (undefined) — but process.stdout.columns can genuinely report 0 on a
  // pty with no winsize set, which is a defined-but-falsy value the
  // default wouldn't catch. Treat anything non-positive as "unknown
  // width" rather than let it force the overflow guard below to zero
  // everything out (ship-verification real-run finding).
  const width = terminalWidth > 0 ? terminalWidth : DEFAULT_WIDTH;
  const prefix = `${paused ? "PAUSED " : ""}${PHASE_LABEL[state.phase]} ${formatTime(state.secondsRemaining)} `;
  const barWidth = Math.max(MIN_BAR_WIDTH, width - prefix.length);

  if (paused && prefix.length + barWidth > width) {
    // The PAUSED prefix plus the bar's floor (MIN_BAR_WIDTH) would overflow
    // a narrow terminal — drop the bar rather than wrap the line onto the
    // next row (AC-01/AC-08). Unpaused sizing is untouched: this is scoped
    // to the prefix pause/resume adds, not the pre-existing bar algorithm.
    return prefix.slice(0, width);
  }

  const total = PHASE_DURATIONS_SEC[state.phase];
  const elapsed = total - state.secondsRemaining;
  const filled = Math.round((elapsed / total) * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

  return `${prefix}${bar}`;
}

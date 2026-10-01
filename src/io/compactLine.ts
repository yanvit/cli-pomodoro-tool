import { PHASE_DURATIONS_SEC, type CycleState } from "../core/cycle.js";
import { formatTime, PHASE_LABEL } from "./render.js";

const MIN_BAR_WIDTH = 4;
const DEFAULT_WIDTH = 80;

export function renderCompactLine(
  state: CycleState,
  terminalWidth = DEFAULT_WIDTH,
  paused = false,
): string {
  const prefix = `${paused ? "PAUSED " : ""}${PHASE_LABEL[state.phase]} ${formatTime(state.secondsRemaining)} `;
  const barWidth = Math.max(MIN_BAR_WIDTH, terminalWidth - prefix.length);

  if (paused && prefix.length + barWidth > terminalWidth) {
    // The PAUSED prefix plus the bar's floor (MIN_BAR_WIDTH) would overflow
    // a narrow terminal — drop the bar rather than wrap the line onto the
    // next row (AC-01/AC-08). Unpaused sizing is untouched: this is scoped
    // to the prefix pause/resume adds, not the pre-existing bar algorithm.
    return prefix.slice(0, terminalWidth);
  }

  const total = PHASE_DURATIONS_SEC[state.phase];
  const elapsed = total - state.secondsRemaining;
  const filled = Math.round((elapsed / total) * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

  return `${prefix}${bar}`;
}

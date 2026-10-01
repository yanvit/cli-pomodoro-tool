import { PHASE_DURATIONS_SEC, type CycleState } from "../core/cycle.js";
import { formatTime, PHASE_LABEL } from "./render.js";

const MIN_BAR_WIDTH = 4;
const DEFAULT_WIDTH = 80;

export function renderCompactLine(state: CycleState, terminalWidth = DEFAULT_WIDTH): string {
  const prefix = `${PHASE_LABEL[state.phase]} ${formatTime(state.secondsRemaining)} `;
  const barWidth = Math.max(MIN_BAR_WIDTH, terminalWidth - prefix.length);

  const total = PHASE_DURATIONS_SEC[state.phase];
  const elapsed = total - state.secondsRemaining;
  const filled = Math.round((elapsed / total) * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

  return `${prefix}${bar}`;
}

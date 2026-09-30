import { PHASE_DURATIONS_SEC, type CycleState, type Phase } from "../core/cycle.js";
import { renderBigText } from "./bigDigits.js";

const PHASE_LABEL: Record<Phase, string> = {
  work: "Work",
  short_break: "Short break",
  long_break: "Long break",
};

const PROGRESS_BAR_WIDTH = 24;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function progressBar(state: CycleState): string {
  const total = PHASE_DURATIONS_SEC[state.phase];
  const elapsed = total - state.secondsRemaining;
  const ratio = elapsed / total;
  const filled = Math.round(ratio * PROGRESS_BAR_WIDTH);
  const percent = Math.round(ratio * 100);
  const bar = "█".repeat(filled) + "░".repeat(PROGRESS_BAR_WIDTH - filled);
  return `${bar}  ${percent}%`;
}

function center(line: string, width: number): string {
  const pad = Math.max(0, width - line.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return " ".repeat(left) + line + " ".repeat(right);
}

export function renderFrame(state: CycleState, terminalWidth?: number): string[] {
  const header = `${PHASE_LABEL[state.phase]} · Round ${state.round}/4`;
  const digitLines = renderBigText(formatTime(state.secondsRemaining));
  const bar = progressBar(state);
  const footer = "Ctrl+C to quit";

  const content = [header, "", ...digitLines, "", bar, "", footer];
  const innerWidth = Math.max(...content.map((line) => line.length));
  const body = content.map((line) => `│ ${center(line, innerWidth)} │`);
  const boxWidth = innerWidth + 4;

  const frame = [`┌${"─".repeat(boxWidth - 2)}┐`, ...body, `└${"─".repeat(boxWidth - 2)}┘`];

  if (terminalWidth && terminalWidth > boxWidth) {
    const leftPad = " ".repeat(Math.floor((terminalWidth - boxWidth) / 2));
    return frame.map((line) => leftPad + line);
  }
  return frame;
}

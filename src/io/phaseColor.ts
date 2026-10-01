import { PHASE_DURATIONS_SEC, type CycleState, type Phase } from "../core/cycle.js";

interface RGB {
  r: number;
  g: number;
  b: number;
}

const START_RGB: Record<Phase, RGB> = {
  work: { r: 255, g: 140, b: 90 },
  short_break: { r: 110, g: 220, b: 130 },
  long_break: { r: 90, g: 170, b: 230 },
};

const URGENT_RGB: RGB = { r: 230, g: 50, b: 50 };

const URGENT_THRESHOLD = 0.15;

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function phaseColorRGB(state: CycleState): RGB {
  const total = PHASE_DURATIONS_SEC[state.phase];
  const remainingRatio = state.secondsRemaining / total;
  const start = START_RGB[state.phase];

  if (remainingRatio > URGENT_THRESHOLD) {
    return start;
  }

  const t = 1 - remainingRatio / URGENT_THRESHOLD;
  return {
    r: lerp(start.r, URGENT_RGB.r, t),
    g: lerp(start.g, URGENT_RGB.g, t),
    b: lerp(start.b, URGENT_RGB.b, t),
  };
}

export function phaseColorAnsi(state: CycleState): string {
  const { r, g, b } = phaseColorRGB(state);
  return `\x1b[38;2;${r};${g};${b}m`;
}

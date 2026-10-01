import { DASHBOARD_WIDTH } from "./render.js";

export type RenderMode = "dashboard" | "compact" | "plain";

export function pickRenderMode(isTTY: boolean, columns: number | undefined): RenderMode {
  if (!isTTY) {
    return "plain";
  }
  const width = columns ?? 80;
  return width >= DASHBOARD_WIDTH ? "dashboard" : "compact";
}

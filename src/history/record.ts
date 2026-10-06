import { appendFileSync, mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { Phase } from "../core/cycle.js";
import { resolveHistoryDir } from "./paths.js";

const HISTORY_FILE = "history.jsonl";

export function isHistoryEnabled(): boolean {
  return process.env.POMODORO_HISTORY === "1";
}

export function recordCompletedPhase(completedPhase: Phase, completedRound: number): void {
  if (!isHistoryEnabled()) {
    return;
  }

  const dir = resolveHistoryDir();
  if (!isAbsolute(dir)) {
    return;
  }

  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    return;
  }

  try {
    const record = {
      phase: completedPhase,
      round: completedRound,
      completedAt: new Date().toISOString(),
    };
    appendFileSync(join(dir, HISTORY_FILE), JSON.stringify(record) + "\n");
  } catch {
    return;
  }
}

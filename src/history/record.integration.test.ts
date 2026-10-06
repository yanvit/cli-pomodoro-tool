import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import { join } from "node:path";
import { recordCompletedPhase } from "./record.js";
import { resolveHistoryDir } from "./paths.js";

// NFR: history-write added latency ≤5ms, measured against a real temp-file
// write (spec.md §6 row 1 / sad.md §10 QG-4) — never a mocked `fs`. This bound
// is spec.md's own and is not loosened for a slower CI disk.
describe("recordCompletedPhase — real filesystem integration", () => {
  let tempDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(join(os.tmpdir(), "pomodoro-history-"));
    process.env.POMODORO_HISTORY = "1";
    process.env.HOME = tempDir;
    process.env.XDG_DATA_HOME = join(tempDir, "xdg-data");
    process.env.LOCALAPPDATA = join(tempDir, "local-appdata");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("adds no more than 5ms of real wall-clock time to write one record", () => {
    const start = performance.now();
    recordCompletedPhase("work", 1);
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThanOrEqual(5);
  });

  it("actually appends the record with the correct content to a real file under the resolved dir", () => {
    recordCompletedPhase("work", 3);

    const dir = resolveHistoryDir();
    const content = fs.readFileSync(join(dir, "history.jsonl"), "utf8");
    const lines = content.trim().split("\n").map((line) => JSON.parse(line));

    expect(lines).toHaveLength(1);
    expect(Object.keys(lines[0]).sort()).toEqual(["completedAt", "phase", "round"]);
    expect(lines[0]).toMatchObject({ phase: "work", round: 3 });
    expect(() => new Date(lines[0].completedAt).toISOString()).not.toThrow();
  });

  it("writes nothing under the real cwd when HOME, XDG_DATA_HOME, and LOCALAPPDATA are all unset", () => {
    delete process.env.HOME;
    delete process.env.XDG_DATA_HOME;
    delete process.env.LOCALAPPDATA;

    const cwdBefore = process.cwd();
    process.chdir(tempDir);
    try {
      recordCompletedPhase("work", 1);
      expect(fs.readdirSync(tempDir, { recursive: true })).toEqual([]);
    } finally {
      process.chdir(cwdBefore);
    }
  });
});

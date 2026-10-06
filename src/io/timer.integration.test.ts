import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import { join } from "node:path";
import { startTimer } from "./timer.js";
import { resolveHistoryDir } from "../history/paths.js";

// Integration tests for the real io/timer.ts call site added in T3 — real
// filesystem, never a mocked `fs` or a mocked history/record module.
describe("startTimer — session-history integration", () => {
  let tempDir: string;
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let isTTYOriginal: boolean | undefined;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    tempDir = fs.mkdtempSync(join(os.tmpdir(), "pomodoro-timer-integration-"));
    isTTYOriginal = process.stdout.isTTY;
    process.stdout.isTTY = false;
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    writeSpy.mockRestore();
    exitSpy.mockRestore();
    process.stdout.isTTY = isTTYOriginal;
    process.env = { ...originalEnv };
    vi.useRealTimers();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("AC-02: with POMODORO_HISTORY unset, a full cycle creates no file under the data dir and stdout matches the no-history baseline", () => {
    delete process.env.POMODORO_HISTORY;
    process.env.HOME = tempDir;
    process.env.XDG_DATA_HOME = join(tempDir, "xdg-data");
    process.env.LOCALAPPDATA = join(tempDir, "local-appdata");

    startTimer();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Work started — 25:00"));

    writeSpy.mockClear();
    vi.advanceTimersByTime(25 * 60 * 1000);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Short break started — 05:00"));
    expect(fs.readdirSync(tempDir)).toEqual([]);
  });

  it("AC-03: an unwritable resolved data dir leaves the countdown's ticks running uninterrupted end-to-end", () => {
    process.env.POMODORO_HISTORY = "1";
    process.env.HOME = tempDir;
    delete process.env.XDG_DATA_HOME;
    delete process.env.LOCALAPPDATA;

    // Create a *file* where the writer expects to mkdir a directory, so
    // mkdirSync throws ENOTDIR/EEXIST for every completed phase.
    const blockingFilePath = resolveHistoryDir();
    fs.mkdirSync(join(blockingFilePath, ".."), { recursive: true });
    fs.writeFileSync(blockingFilePath, "not a directory");

    startTimer();

    expect(() => vi.advanceTimersByTime(25 * 60 * 1000)).not.toThrow();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Short break started — 05:00"));

    expect(() => vi.advanceTimersByTime(5 * 60 * 1000)).not.toThrow();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Work started — 25:00"));
  });
});

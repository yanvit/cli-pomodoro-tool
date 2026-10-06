import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

import * as fs from "node:fs";
import { isHistoryEnabled, recordCompletedPhase } from "./record.js";
import * as paths from "./paths.js";

const mkdirSync = vi.mocked(fs.mkdirSync);
const appendFileSync = vi.mocked(fs.appendFileSync);

describe("isHistoryEnabled", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("is true only for the exact string '1'", () => {
    process.env.POMODORO_HISTORY = "1";
    expect(isHistoryEnabled()).toBe(true);
  });

  it("is false when unset", () => {
    delete process.env.POMODORO_HISTORY;
    expect(isHistoryEnabled()).toBe(false);
  });

  it("is false for empty string", () => {
    process.env.POMODORO_HISTORY = "";
    expect(isHistoryEnabled()).toBe(false);
  });

  it("is false for any other value, including '0' and 'true'", () => {
    process.env.POMODORO_HISTORY = "0";
    expect(isHistoryEnabled()).toBe(false);
    process.env.POMODORO_HISTORY = "true";
    expect(isHistoryEnabled()).toBe(false);
  });
});

describe("recordCompletedPhase", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(paths, "resolveHistoryDir").mockReturnValue("/fake/history/dir");
    mkdirSync.mockReset();
    appendFileSync.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("no-ops entirely when not opted in — no fs call at all", () => {
    delete process.env.POMODORO_HISTORY;

    recordCompletedPhase("work", 1);

    expect(mkdirSync).not.toHaveBeenCalled();
    expect(appendFileSync).not.toHaveBeenCalled();
  });

  it("writes exactly one line with phase, round, completedAt when opted in", () => {
    process.env.POMODORO_HISTORY = "1";
    mkdirSync.mockImplementation(() => undefined);
    appendFileSync.mockImplementation(() => undefined);

    recordCompletedPhase("short_break", 2);

    expect(appendFileSync).toHaveBeenCalledTimes(1);
    const [, content] = appendFileSync.mock.calls[0]!;
    const written = JSON.parse(String(content).trim());
    expect(Object.keys(written).sort()).toEqual(["completedAt", "phase", "round"]);
    expect(written.phase).toBe("short_break");
    expect(written.round).toBe(2);
    expect(() => new Date(written.completedAt).toISOString()).not.toThrow();
    expect(written.completedAt).toBe(new Date(written.completedAt).toISOString());
  });

  it("silently absorbs an mkdirSync failure and returns normally", () => {
    process.env.POMODORO_HISTORY = "1";
    mkdirSync.mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });

    expect(() => recordCompletedPhase("work", 1)).not.toThrow();
    expect(appendFileSync).not.toHaveBeenCalled();
  });

  it("silently absorbs an appendFileSync failure and returns normally", () => {
    process.env.POMODORO_HISTORY = "1";
    mkdirSync.mockImplementation(() => undefined);
    appendFileSync.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device");
    });

    expect(() => recordCompletedPhase("work", 1)).not.toThrow();
  });

  it("independently re-attempts both mkdir and append on the next call after a failure", () => {
    process.env.POMODORO_HISTORY = "1";
    mkdirSync
      .mockImplementationOnce(() => {
        throw new Error("EACCES");
      })
      .mockImplementationOnce(() => undefined);
    appendFileSync.mockImplementation(() => undefined);

    recordCompletedPhase("work", 1);
    recordCompletedPhase("work", 1);

    expect(mkdirSync).toHaveBeenCalledTimes(2);
    expect(appendFileSync).toHaveBeenCalledTimes(1);
  });
});

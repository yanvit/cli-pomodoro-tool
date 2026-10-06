import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveHistoryDir } from "./paths.js";

describe("resolveHistoryDir", () => {
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };

  function setPlatform(platform: string): void {
    Object.defineProperty(process, "platform", { value: platform });
  }

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    process.env = { ...originalEnv };
  });

  beforeEach(() => {
    delete process.env.XDG_DATA_HOME;
    delete process.env.HOME;
    delete process.env.LOCALAPPDATA;
  });

  it("uses XDG_DATA_HOME on linux when set", () => {
    setPlatform("linux");
    process.env.XDG_DATA_HOME = "/custom/data";
    expect(resolveHistoryDir()).toBe("/custom/data/pomodoro-timer");
  });

  it("falls back to ~/.local/share on linux when XDG_DATA_HOME is unset", () => {
    setPlatform("linux");
    process.env.HOME = "/home/dev";
    expect(resolveHistoryDir()).toBe("/home/dev/.local/share/pomodoro-timer");
  });

  it("uses ~/Library/Application Support on macOS", () => {
    setPlatform("darwin");
    process.env.HOME = "/Users/dev";
    expect(resolveHistoryDir()).toBe(
      "/Users/dev/Library/Application Support/pomodoro-timer",
    );
  });

  it("uses %LOCALAPPDATA%\\pomodoro-timer on Windows", () => {
    setPlatform("win32");
    process.env.LOCALAPPDATA = "C:\\Users\\dev\\AppData\\Local";
    expect(resolveHistoryDir()).toBe(
      "C:\\Users\\dev\\AppData\\Local\\pomodoro-timer",
    );
  });

  it("falls back to the linux branch for an unrecognized platform", () => {
    setPlatform("freebsd");
    process.env.HOME = "/home/dev";
    expect(resolveHistoryDir()).toBe("/home/dev/.local/share/pomodoro-timer");
  });

  it("is a pure function with no side effects", () => {
    setPlatform("linux");
    process.env.HOME = "/home/dev";
    resolveHistoryDir();
    resolveHistoryDir();
    expect(resolveHistoryDir()).toBe("/home/dev/.local/share/pomodoro-timer");
  });
});

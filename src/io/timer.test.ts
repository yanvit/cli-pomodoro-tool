import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startTimer } from "./timer.js";

describe("startTimer smoke test", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let isTTYOriginal: boolean | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    isTTYOriginal = process.stdout.isTTY;
    process.stdout.isTTY = false;
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
    process.stdout.isTTY = isTTYOriginal;
    vi.useRealTimers();
  });

  it("prints the first phase on start and ticks without throwing in plain mode", () => {
    expect(() => startTimer()).not.toThrow();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Work started — 25:00"));

    writeSpy.mockClear();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../history/record.js", () => ({
  recordCompletedPhase: vi.fn(),
}));

import { startTimer } from "./timer.js";
import { recordCompletedPhase } from "../history/record.js";

const recordCompletedPhaseMock = vi.mocked(recordCompletedPhase);

describe("startTimer smoke test", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let isTTYOriginal: boolean | undefined;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    isTTYOriginal = process.stdout.isTTY;
    process.stdout.isTTY = false;
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    recordCompletedPhaseMock.mockClear();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    exitSpy.mockRestore();
    process.stdout.isTTY = isTTYOriginal;
    vi.useRealTimers();
  });

  it("prints the first phase on start and ticks without throwing in plain mode", () => {
    expect(() => startTimer()).not.toThrow();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Work started — 25:00"));

    writeSpy.mockClear();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });

  it("calls recordCompletedPhase with the completed phase and its pre-tick round on a natural phase-change", () => {
    startTimer();

    vi.advanceTimersByTime(25 * 60 * 1000);

    expect(recordCompletedPhaseMock).toHaveBeenCalledTimes(1);
    expect(recordCompletedPhaseMock).toHaveBeenCalledWith("work", 1);
  });

  it("never calls recordCompletedPhase when SIGINT fires mid-countdown", () => {
    startTimer();

    vi.advanceTimersByTime(10 * 1000);
    process.emit("SIGINT");

    expect(recordCompletedPhaseMock).not.toHaveBeenCalled();
  });
});

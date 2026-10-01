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

describe("startTimer pause/resume (compact mode)", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let isTTYOriginal: boolean | undefined;
  let columnsOriginal: number | undefined;
  let setRawModeOriginal: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    isTTYOriginal = process.stdout.isTTY;
    columnsOriginal = process.stdout.columns;
    process.stdout.isTTY = true;
    process.stdout.columns = 20; // narrow -> compact mode, not dashboard
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    // process.stdin.setRawMode is undefined outside a real TTY; stub it so
    // keypress.ts's capability check succeeds and wires a real listener.
    setRawModeOriginal = (process.stdin as unknown as { setRawMode?: unknown }).setRawMode;
    (process.stdin as unknown as { setRawMode: (mode: boolean) => void }).setRawMode = vi.fn();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    process.stdout.isTTY = isTTYOriginal;
    process.stdout.columns = columnsOriginal;
    (process.stdin as unknown as { setRawMode: unknown }).setRawMode = setRawModeOriginal;
    process.stdin.removeAllListeners("keypress");
    vi.useRealTimers();
  });

  function pressSpace(): void {
    process.stdin.emit("keypress", " ", { name: "space" });
  }

  function written(): string {
    return writeSpy.mock.calls.map((call) => String(call[0])).join("\n");
  }

  it("AC-01/AC-05: pause freezes secondsRemaining and the interval skips ticks while paused", () => {
    startTimer();

    // advance one real tick first so we're not sitting on the initial draw
    vi.advanceTimersByTime(1000); // 25:00 -> 24:59
    writeSpy.mockClear();

    pressSpace(); // pause
    expect(written()).toContain("PAUSED");
    expect(written()).toContain("24:59");

    writeSpy.mockClear();
    vi.advanceTimersByTime(10_000); // time passes while paused

    expect(written()).not.toContain("24:58");
    expect(writeSpy).not.toHaveBeenCalled(); // paused interval ticks must not redraw at all
  });

  it("AC-02: resume with no time elapsed continues counting down from the exact frozen value", () => {
    startTimer();
    vi.advanceTimersByTime(1000); // 25:00 -> 24:59
    pressSpace(); // pause at 24:59
    expect(written()).toContain("PAUSED"); // sanity: the pause actually took effect
    writeSpy.mockClear();

    pressSpace(); // resume immediately, no time elapsed
    expect(written()).not.toContain("PAUSED");

    writeSpy.mockClear();
    vi.advanceTimersByTime(1000); // next ordinary tick
    expect(written()).toContain("24:58");
  });

  it("AC-05: resuming a phase that was already due flushes the transition and bell immediately on the resume keypress", () => {
    startTimer();

    // drive secondsRemaining from 1500 down to 1 (1499 ordinary ticks)
    vi.advanceTimersByTime(1499 * 1000);
    writeSpy.mockClear();

    pressSpace(); // pause at secondsRemaining === 1 (phase is due on the next tick)
    expect(written()).toContain("PAUSED");
    expect(written()).toContain("00:01");

    writeSpy.mockClear();
    vi.advanceTimersByTime(5000); // paused: no transition, no bell, however long real time passes
    expect(writeSpy).not.toHaveBeenCalled();

    pressSpace(); // resume: the deferred transition must fire synchronously, right here
    expect(written()).toContain("Short break");
    expect(written()).toContain("\x07"); // bell fires on resume, not on the next interval tick
  });
});

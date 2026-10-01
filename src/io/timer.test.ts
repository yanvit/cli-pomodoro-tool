import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startTimer } from "./timer.js";

// startTimer() owns no listener-teardown of its own beyond its per-run
// cleanup() (review 2026-10-01 #8: that used to be done in production code
// via a blanket removeAllListeners, which could silently drop a host's own
// handlers). Each describe block below calls startTimer() repeatedly in one
// process, so each is responsible for removing exactly the listeners that
// one startTimer() call could have registered, in its own afterEach.
function clearProcessListeners(): void {
  process.removeAllListeners("exit");
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");
  process.removeAllListeners("SIGHUP");
}

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
    clearProcessListeners();
    vi.useRealTimers();
  });

  it("prints the first phase on start and ticks without throwing in plain mode", () => {
    expect(() => startTimer()).not.toThrow();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Work started — 25:00"));

    writeSpy.mockClear();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });

  it("review 2026-10-01 #9 / AC-03: plain mode never wires keystroke capture, so spacebar does nothing", () => {
    startTimer();
    writeSpy.mockClear();

    // no keypress listener was ever attached, so emitting one is a no-op —
    // unlike dashboard/compact mode, nothing should be written for it.
    expect(() => process.stdin.emit("keypress", " ", { name: "space" })).not.toThrow();
    expect(writeSpy).not.toHaveBeenCalled();

    // the phase still transitions on schedule — nothing was frozen by the keypress.
    expect(() => vi.advanceTimersByTime(1500 * 1000)).not.toThrow();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Short break started"));
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
    clearProcessListeners();
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

  it("review 2026-10-01 #4: pausing and resuming near-instantly at secondsRemaining === 1 must NOT flush the transition early", () => {
    startTimer();
    vi.advanceTimersByTime(1499 * 1000); // secondsRemaining === 1
    writeSpy.mockClear();

    pressSpace(); // pause at secondsRemaining === 1
    writeSpy.mockClear();
    pressSpace(); // resume with ~0 real time elapsed while paused

    expect(written()).not.toContain("Short break"); // must not transition yet
    expect(written()).not.toContain("\x07"); // no premature bell

    writeSpy.mockClear();
    vi.advanceTimersByTime(1000); // the ordinary tick, exactly 1s after resume
    expect(written()).toContain("Short break");
    expect(written()).toContain("\x07");
  });

  it("review 2026-10-01 #7: resume only waits out the REMAINING part of the interrupted second, not a fresh full second", () => {
    startTimer();
    vi.advanceTimersByTime(500); // 500ms already elapsed in the current quantum
    pressSpace(); // pause at 25:00 — no tick has occurred yet

    vi.advanceTimersByTime(2000); // real time passes while paused — must not count
    writeSpy.mockClear();
    pressSpace(); // resume — only 500ms remains before the next tick is due

    writeSpy.mockClear();
    vi.advanceTimersByTime(499);
    expect(written()).toBe(""); // not yet — only 999ms of active time has passed since the last tick

    vi.advanceTimersByTime(1);
    expect(written()).toContain("24:59"); // exactly 1000ms of ACTIVE time since start, tick fires
  });

  it("re-review 2026-10-01 (residual #1): across several pause/resume cycles, only active time accumulates toward the next tick — a phase can never be stretched beyond its nominal duration (AC-02)", () => {
    startTimer();

    vi.advanceTimersByTime(300); // 300ms active
    pressSpace(); // pause
    vi.advanceTimersByTime(5000); // long pause — must not count
    pressSpace(); // resume — 300ms of the quantum spent, 700ms remains

    vi.advanceTimersByTime(200); // 500ms active total now
    pressSpace(); // pause again, mid-quantum
    vi.advanceTimersByTime(3000); // another long pause — must not count
    pressSpace(); // resume — 500ms spent, 500ms remains

    writeSpy.mockClear();
    vi.advanceTimersByTime(499);
    expect(written()).toBe(""); // 999ms active total — not due yet

    vi.advanceTimersByTime(1);
    expect(written()).toContain("24:59"); // exactly 1000ms of active time, regardless of how many times or how long it paused
  });
});

describe("startTimer pause/resume (dashboard mode)", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let isTTYOriginal: boolean | undefined;
  let columnsOriginal: number | undefined;
  let setRawModeOriginal: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    isTTYOriginal = process.stdout.isTTY;
    columnsOriginal = process.stdout.columns;
    process.stdout.isTTY = true;
    process.stdout.columns = 120; // wide -> dashboard mode, not compact
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
    clearProcessListeners();
    vi.useRealTimers();
  });

  function pressSpace(): void {
    process.stdin.emit("keypress", " ", { name: "space" });
  }

  function written(): string {
    return writeSpy.mock.calls.map((call) => String(call[0])).join("\n");
  }

  it("AC-08: PAUSED indicator is visible in dashboard mode when paused, and absent once resumed", () => {
    startTimer();
    vi.advanceTimersByTime(1000); // 25:00 -> 24:59
    writeSpy.mockClear();

    pressSpace(); // pause
    expect(written()).toContain("PAUSED");

    writeSpy.mockClear();
    pressSpace(); // resume
    expect(written()).not.toContain("PAUSED");
  });

  it("review 2026-10-01 #1: resume redraws the exact same number of lines as the pause draw, so no stale PAUSED row is ever left uncleared", () => {
    startTimer();
    vi.advanceTimersByTime(1000);
    writeSpy.mockClear();

    pressSpace(); // pause
    const pausedLineCount = written().split("\n").length;

    writeSpy.mockClear();
    pressSpace(); // resume
    const resumedLineCount = written().split("\n").length;

    expect(resumedLineCount).toBe(pausedLineCount);
  });
});

describe("startTimer exit-path handling", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let isTTYOriginal: boolean | undefined;
  let columnsOriginal: number | undefined;
  let setRawModeOriginal: unknown;
  let setRawModeMock: ReturnType<typeof vi.fn>;

  // SHOW_CURSOR + "\n" — the exact terminal-restoration write cleanup()
  // performs in compact mode.
  const CLEANUP_WRITE = "\x1b[?25h\n";

  beforeEach(() => {
    vi.useFakeTimers();
    isTTYOriginal = process.stdout.isTTY;
    columnsOriginal = process.stdout.columns;
    process.stdout.isTTY = true;
    process.stdout.columns = 20; // narrow -> compact mode, not dashboard
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    setRawModeOriginal = (process.stdin as unknown as { setRawMode?: unknown }).setRawMode;
    setRawModeMock = vi.fn();
    (process.stdin as unknown as { setRawMode: (mode: boolean) => void }).setRawMode =
      setRawModeMock;
    // process.exit must never actually terminate the test runner. Mimic
    // Node's real behaviour instead: process.exit() synchronously runs
    // "exit" listeners before the process would actually go away.
    exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      process.emit("exit", (code ?? 0) as never);
      return undefined as never;
    }) as typeof process.exit);
  });

  afterEach(() => {
    writeSpy.mockRestore();
    exitSpy.mockRestore();
    process.stdout.isTTY = isTTYOriginal;
    process.stdout.columns = columnsOriginal;
    (process.stdin as unknown as { setRawMode: unknown }).setRawMode = setRawModeOriginal;
    process.stdin.removeAllListeners("keypress");
    clearProcessListeners();
    vi.useRealTimers();
  });

  function cleanupWriteCount(): number {
    return writeSpy.mock.calls.filter((call) => call[0] === CLEANUP_WRITE).length;
  }

  it("AC-06: SIGTERM runs cleanup() exactly once, restoring the terminal", () => {
    startTimer();
    writeSpy.mockClear();

    process.emit("SIGTERM");

    expect(cleanupWriteCount()).toBe(1);
  });

  it("AC-06: SIGHUP runs cleanup() exactly once, restoring the terminal", () => {
    startTimer();
    writeSpy.mockClear();

    process.emit("SIGHUP");

    expect(cleanupWriteCount()).toBe(1);
  });

  it("AC-06: cleanup() is idempotent across repeated exit signals (SIGTERM then SIGTERM again)", () => {
    startTimer();
    writeSpy.mockClear();

    process.emit("SIGTERM");
    process.emit("SIGTERM"); // a second signal arriving before the process has
    // actually gone away must not re-run the terminal-restoration write

    expect(cleanupWriteCount()).toBe(1);
  });

  it("AC-07: Ctrl+C via keypress exits cleanly (process.exit(0)) and runs cleanup() exactly once", () => {
    startTimer();
    writeSpy.mockClear();

    process.stdin.emit("keypress", "", { name: "c", ctrl: true });

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(cleanupWriteCount()).toBe(1);
  });

  it("AC-06: SIGTERM also disables raw mode (stops keypress capture), not just the Ctrl+C path", () => {
    startTimer();
    setRawModeMock.mockClear();

    process.emit("SIGTERM");

    expect(setRawModeMock).toHaveBeenCalledWith(false);
  });

  it("review 2026-10-01 #9 / AC-06: an unhandled internal error still restores the terminal, via the generic 'exit' event cleanup() is registered on", () => {
    startTimer();
    writeSpy.mockClear();

    // Node's own handling of an uncaught exception ends by calling
    // process.exit() with a nonzero code, which (like every exit path) fires
    // the 'exit' event — this simulates that without actually throwing
    // out of the test.
    process.emit("exit", 1 as never);

    expect(cleanupWriteCount()).toBe(1);
  });

  it("review 2026-10-01 #9 / AC-07: the native SIGINT handler (not via keypress) also exits cleanly and runs cleanup() exactly once", () => {
    startTimer();
    writeSpy.mockClear();

    process.emit("SIGINT");

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(cleanupWriteCount()).toBe(1);
  });
});

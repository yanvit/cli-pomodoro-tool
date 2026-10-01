import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emitKeypressEvents } from "node:readline";
import { startKeypressCapture } from "./keypress.js";

// node:readline's builtin exports are non-configurable under Node's native ESM
// loader, so `vi.spyOn(readline, "emitKeypressEvents")` throws
// "TypeError: Cannot redefine property: emitKeypressEvents" (vi.spyOn uses
// Object.defineProperty internally). Module-replacement mocking via vi.mock
// (hoisted by vitest) works against native ESM builtins instead.
vi.mock("node:readline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:readline")>();
  return {
    ...actual,
    emitKeypressEvents: vi.fn(),
  };
});

const emitKeypressEventsMock = vi.mocked(emitKeypressEvents);

describe("startKeypressCapture", () => {
  let setRawModeOriginal: typeof process.stdin.setRawMode;
  let onSpy: ReturnType<typeof vi.spyOn>;
  let removeListenerSpy: ReturnType<typeof vi.spyOn>;
  let keypressHandler: ((str: string, key: { name?: string; ctrl?: boolean }) => void) | undefined;

  beforeEach(() => {
    setRawModeOriginal = process.stdin.setRawMode;
    keypressHandler = undefined;

    emitKeypressEventsMock.mockClear();

    onSpy = vi.spyOn(process.stdin, "on").mockImplementation(((event: string, cb: (...args: unknown[]) => void) => {
      if (event === "keypress") {
        keypressHandler = cb as typeof keypressHandler;
      }
      return process.stdin;
    }) as typeof process.stdin.on);

    removeListenerSpy = vi.spyOn(process.stdin, "removeListener").mockImplementation(
      () => process.stdin,
    );
  });

  afterEach(() => {
    process.stdin.setRawMode = setRawModeOriginal;
    onSpy.mockRestore();
    removeListenerSpy.mockRestore();
  });

  it("returns a no-op handle without throwing when stdin.setRawMode is not a function (non-TTY)", () => {
    // @ts-expect-error -- simulating a non-TTY stdin where setRawMode is undefined
    process.stdin.setRawMode = undefined;

    const onTogglePause = vi.fn();
    const onSigint = vi.fn();

    let handle: { stop: () => void } | undefined;
    expect(() => {
      handle = startKeypressCapture(onTogglePause, onSigint);
    }).not.toThrow();

    expect(handle).toBeDefined();
    expect(() => handle!.stop()).not.toThrow();
    // no-op handle means no keypress listener was ever attached
    expect(onSpy).not.toHaveBeenCalledWith("keypress", expect.anything());
  });

  it("returns a no-op handle without throwing when setRawMode throws for any other reason", () => {
    process.stdin.setRawMode = vi.fn(() => {
      throw new Error("pseudo-TTY rejects raw mode");
    }) as unknown as typeof process.stdin.setRawMode;

    const onTogglePause = vi.fn();
    const onSigint = vi.fn();

    let handle: { stop: () => void } | undefined;
    expect(() => {
      handle = startKeypressCapture(onTogglePause, onSigint);
    }).not.toThrow();

    expect(handle).toBeDefined();
    expect(() => handle!.stop()).not.toThrow();
  });

  it("calls onTogglePause when the spacebar is pressed", () => {
    process.stdin.setRawMode = vi.fn(() => process.stdin) as unknown as typeof process.stdin.setRawMode;

    const onTogglePause = vi.fn();
    const onSigint = vi.fn();

    startKeypressCapture(onTogglePause, onSigint);

    expect(keypressHandler).toBeDefined();
    keypressHandler!(" ", { name: "space" });

    expect(onTogglePause).toHaveBeenCalledTimes(1);
    expect(onSigint).not.toHaveBeenCalled();
  });

  it("calls onSigint when Ctrl+C is pressed", () => {
    process.stdin.setRawMode = vi.fn(() => process.stdin) as unknown as typeof process.stdin.setRawMode;

    const onTogglePause = vi.fn();
    const onSigint = vi.fn();

    startKeypressCapture(onTogglePause, onSigint);

    expect(keypressHandler).toBeDefined();
    keypressHandler!("c", { name: "c", ctrl: true });

    expect(onSigint).toHaveBeenCalledTimes(1);
    expect(onTogglePause).not.toHaveBeenCalled();
  });

  it("calls neither callback for an unrecognized key", () => {
    process.stdin.setRawMode = vi.fn(() => process.stdin) as unknown as typeof process.stdin.setRawMode;

    const onTogglePause = vi.fn();
    const onSigint = vi.fn();

    startKeypressCapture(onTogglePause, onSigint);

    expect(keypressHandler).toBeDefined();
    keypressHandler!("a", { name: "a" });

    expect(onTogglePause).not.toHaveBeenCalled();
    expect(onSigint).not.toHaveBeenCalled();
  });
});

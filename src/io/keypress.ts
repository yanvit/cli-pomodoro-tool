import { emitKeypressEvents } from "node:readline";

export interface KeypressHandle {
  stop(): void;
}

type KeypressKey = { name?: string; ctrl?: boolean };

const NO_OP_HANDLE: KeypressHandle = {
  stop(): void {
    // nothing to tear down — capability was never enabled
  },
};

/**
 * Attempts to capture individual keystrokes from this process's own stdin,
 * wiring spacebar to `onTogglePause` and Ctrl+C to `onSigint`. Any other key
 * is read and discarded.
 *
 * If the environment can't support keystroke capture (stdin isn't a TTY, or
 * `setRawMode` fails for any other reason), this degrades gracefully to a
 * no-op handle — it never throws.
 */
export function startKeypressCapture(
  onTogglePause: () => void,
  onSigint: () => void,
): KeypressHandle {
  if (typeof process.stdin.setRawMode !== "function") {
    return NO_OP_HANDLE;
  }

  try {
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
  } catch {
    return NO_OP_HANDLE;
  }

  const handleKeypress = (_str: string, key: KeypressKey): void => {
    if (key?.name === "space") {
      onTogglePause();
      return;
    }
    if (key?.ctrl && key?.name === "c") {
      onSigint();
      return;
    }
    // any other key is read and discarded
  };

  process.stdin.on("keypress", handleKeypress);

  let stopped = false;
  return {
    stop(): void {
      if (stopped) {
        return;
      }
      stopped = true;
      process.stdin.removeListener("keypress", handleKeypress);
      if (typeof process.stdin.setRawMode === "function") {
        process.stdin.setRawMode(false);
      }
    },
  };
}

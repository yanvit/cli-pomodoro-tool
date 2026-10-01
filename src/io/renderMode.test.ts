import { describe, expect, it } from "vitest";
import { DASHBOARD_WIDTH } from "./render.js";
import { pickRenderMode } from "./renderMode.js";

describe("pickRenderMode", () => {
  it("is plain when stdout is not a TTY, regardless of column count", () => {
    expect(pickRenderMode(false, 200)).toBe("plain");
    expect(pickRenderMode(false, undefined)).toBe("plain");
  });

  it("is dashboard on a TTY wide enough for the box", () => {
    expect(pickRenderMode(true, DASHBOARD_WIDTH)).toBe("dashboard");
    expect(pickRenderMode(true, DASHBOARD_WIDTH + 20)).toBe("dashboard");
  });

  it("is compact on a TTY narrower than the box", () => {
    expect(pickRenderMode(true, DASHBOARD_WIDTH - 1)).toBe("compact");
  });

  it("defaults to an 80-column assumption when columns is unknown on a TTY", () => {
    expect(pickRenderMode(true, undefined)).toBe(DASHBOARD_WIDTH <= 80 ? "dashboard" : "compact");
  });
});

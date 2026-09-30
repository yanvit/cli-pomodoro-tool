import { describe, expect, it } from "vitest";
import { run } from "./cli.js";

describe("cli smoke test", () => {
  it("exits 0 on --help", () => {
    expect(run(["--help"])).toBe(0);
  });
});

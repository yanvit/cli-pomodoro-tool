import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { run } from "./cli.js";

describe("cli smoke test", () => {
  it("exits 0 on --help", () => {
    expect(run(["--help"])).toBe(0);
  });
});

describe("cli entry point via a symlinked bin (as npm link/global install do)", () => {
  it("still runs when invoked through a symlink, not just the real path", () => {
    const realCliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    const dir = mkdtempSync(join(tmpdir(), "pomodoro-bin-"));
    const linkPath = join(dir, "pomodoro");
    try {
      symlinkSync(realCliPath, linkPath);
      const output = execFileSync(process.execPath, [linkPath, "--version"], { encoding: "utf8" });
      expect(output.trim()).toBe("0.1.0");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

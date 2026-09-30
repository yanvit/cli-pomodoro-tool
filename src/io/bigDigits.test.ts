import { describe, expect, it } from "vitest";
import { renderBigText } from "./bigDigits.js";

describe("renderBigText", () => {
  it("renders a single character as a 5-row glyph", () => {
    const lines = renderBigText("1");
    expect(lines).toHaveLength(5);
    lines.forEach((line) => expect(line.length).toBe(6));
  });

  it("renders multiple characters side by side with a gap", () => {
    const lines = renderBigText("12");
    lines.forEach((line) => expect(line.length).toBe(6 + 2 + 6));
  });

  it("renders every supported character without throwing", () => {
    for (const char of "0123456789:") {
      expect(() => renderBigText(char)).not.toThrow();
    }
  });

  it("throws on an unsupported character", () => {
    expect(() => renderBigText("x")).toThrow();
  });
});

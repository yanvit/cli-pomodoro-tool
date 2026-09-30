const DIGIT_BITS: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  ":": ["000", "010", "000", "010", "000"],
};

const FILLED = "██";
const EMPTY = "  ";
const GLYPH_HEIGHT = 5;
const GLYPH_GAP = "  ";

function glyphRows(char: string): string[] {
  const bits = DIGIT_BITS[char];
  if (!bits) {
    throw new Error(`renderBigText: unsupported character "${char}"`);
  }
  return bits.map((row) => [...row].map((bit) => (bit === "1" ? FILLED : EMPTY)).join(""));
}

export function renderBigText(text: string): string[] {
  const glyphs = [...text].map(glyphRows);
  const lines: string[] = [];
  for (let row = 0; row < GLYPH_HEIGHT; row++) {
    lines.push(glyphs.map((glyph) => glyph[row]).join(GLYPH_GAP));
  }
  return lines;
}

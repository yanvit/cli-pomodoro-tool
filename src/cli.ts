#!/usr/bin/env node

const HELP_TEXT = `pomodoro — a CLI Pomodoro timer

Usage:
  pomodoro          Start the classic 25/5/15 work/break cycle
  pomodoro --help   Show this help text
  pomodoro --version  Print the version number

The cycle is fixed: 25 min work, 5 min short break, 15 min long break
every 4th round. Ctrl+C exits immediately.`;

const VERSION = "0.1.0";

export function run(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP_TEXT);
    return 0;
  }

  if (argv.includes("--version") || argv.includes("-v")) {
    console.log(VERSION);
    return 0;
  }

  console.log("pomodoro timer not wired up yet");
  return 0;
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  process.exitCode = run(process.argv.slice(2));
}

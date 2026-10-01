# cli-pomodoro-timer

A single-purpose CLI Pomodoro timer. Running `pomodoro` walks the classic 25 min work / 5 min
short break / 15 min long break (every 4th round) cycle, alerting with a terminal bell + printed
message at each transition, and exits immediately and cleanly on Ctrl+C.

No history, no task binding, no configurable durations, no background/daemon mode, no OS
notifications, no pause/resume. This is deliberate — see `docs/idea-brief.md §5`.

## Install

Requires Node.js >=18.

```sh
git clone <this-repo>
cd cli-pomodoro-timer
npm install
npm run build
npm link
```

`npm link` makes the `pomodoro` command available globally from this checkout.

## Usage

```sh
pomodoro          # start the classic 25/5/15 cycle
pomodoro --help   # show usage
pomodoro --version
```

Press **spacebar** to pause and resume the countdown (dashboard and compact modes only — not
available when output isn't a terminal). Ctrl+C exits immediately — nothing is saved, paused or
not.

## Terminal compatibility

The timer renders a full-screen dashboard in wide TTYs and degrades to a compact line or
plain text in narrow/non-TTY ones (see `src/io/renderMode.ts`). The dashboard uses ANSI escape
sequences for color, cursor control, and the alternate screen buffer.

- **macOS / Linux terminals, Windows Terminal, PowerShell 7+, Git Bash:** full support.
- **Legacy `cmd.exe` (plain conhost, not opened via Windows Terminal):** the bell (`\x07`) always
  works — it's a raw control character, not an ANSI sequence — but the dashboard's color and
  cursor-control escapes may render as literal garbage (e.g. `←[31m`) if virtual terminal
  processing isn't enabled. Use Windows Terminal or PowerShell 7+ for correct rendering.

## Development

```sh
npm run build   # tsc
npm test        # vitest
npm run lint    # eslint
```

See `CLAUDE.md` for module structure and conventions, `docs/architecture-map.md` for the
rationale and C4 diagram, and `docs/roadmap.md` for what's shipped and what's open.

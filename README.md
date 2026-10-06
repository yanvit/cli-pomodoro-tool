# cli-pomodoro-timer

A single-purpose CLI Pomodoro timer. Running `pomodoro` walks the classic 25 min work / 5 min
short break / 15 min long break (every 4th round) cycle, alerting with a terminal bell + printed
message at each transition, and exits immediately and cleanly on Ctrl+C.

No task binding, no configurable durations, no background/daemon mode, no OS notifications, no
pause/resume by default. Session history is available but off by default — see below. This is
deliberate — see `docs/idea-brief.md §5` and `docs/roadmap.md §Decisions so far`.

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

Ctrl+C exits immediately — nothing is saved.

## Terminal compatibility

The timer renders a full-screen dashboard in wide TTYs and degrades to a compact line or
plain text in narrow/non-TTY ones (see `src/io/renderMode.ts`). The dashboard uses ANSI escape
sequences for color, cursor control, and the alternate screen buffer.

- **macOS / Linux terminals, Windows Terminal, PowerShell 7+, Git Bash:** full support.
- **Legacy `cmd.exe` (plain conhost, not opened via Windows Terminal):** the bell (`\x07`) always
  works — it's a raw control character, not an ANSI sequence — but the dashboard's color and
  cursor-control escapes may render as literal garbage (e.g. `←[31m`) if virtual terminal
  processing isn't enabled. Use Windows Terminal or PowerShell 7+ for correct rendering.

## Session history (opt-in)

Set `POMODORO_HISTORY=1` (exact match — unset, empty, or any other value leaves it off) before
running `pomodoro` to start recording. Each work or break phase that reaches zero naturally
appends one record — phase, round, and an ISO-8601 UTC timestamp — to an append-only log file at
the OS's own conventional per-user data location:

- **Linux:** `$XDG_DATA_HOME/pomodoro-timer/` (falls back to `~/.local/share/pomodoro-timer/` if
  `XDG_DATA_HOME` is unset)
- **macOS:** `~/Library/Application Support/pomodoro-timer/`
- **Windows:** `%LOCALAPPDATA%\pomodoro-timer\`

Only phases that complete naturally are recorded — Ctrl+C, a signal, or any other interruption
never produces a record. If the write ever fails (permissions, a missing directory, a full disk)
it is silently absorbed and the timer keeps running unaffected; a logging problem never breaks
your countdown.

Without the opt-in, `pomodoro` behaves exactly as if this feature didn't exist: no file is
created, nothing is written. Note that any process or user with access to your shell environment
could set this variable without your knowledge — there's no detection for that, which is why it's
documented here rather than hidden.

## Development

```sh
npm run build   # tsc
npm test        # vitest
npm run lint    # eslint
```

See `CLAUDE.md` for module structure and conventions, `docs/architecture-map.md` for the
rationale and C4 diagram, and `docs/roadmap.md` for what's shipped and what's open.

import posixPath from "node:path/posix";
import win32Path from "node:path/win32";

const APP_DIR = "pomodoro-timer";

export function resolveHistoryDir(): string {
  switch (process.platform) {
    case "darwin":
      return posixPath.join(
        process.env.HOME ?? "",
        "Library",
        "Application Support",
        APP_DIR,
      );
    case "win32":
      return win32Path.join(process.env.LOCALAPPDATA ?? "", APP_DIR);
    case "linux":
    default:
      return process.env.XDG_DATA_HOME
        ? posixPath.join(process.env.XDG_DATA_HOME, APP_DIR)
        : posixPath.join(process.env.HOME ?? "", ".local", "share", APP_DIR);
  }
}

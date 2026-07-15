// Config parsed once from env. Targets: comma-separated list, each "url" or "Label=url".
export interface Target {
  name: string;
  url: string;
  host: string;
}

function parseTargets(raw: string): Target[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf("=");
      let name: string | undefined;
      let url = entry;
      if (eq > -1 && !entry.slice(0, eq).includes("://")) {
        name = entry.slice(0, eq).trim();
        url = entry.slice(eq + 1).trim();
      }
      const host = new URL(url).hostname;
      return { name: name || host, url, host };
    });
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  targets: parseTargets(process.env.TARGETS ?? ""),
  intervalMs: Number(process.env.CHECK_INTERVAL_MS ?? 60_000),
  timeoutMs: Number(process.env.CHECK_TIMEOUT_MS ?? 10_000),
  tlsWarnDays: Number(process.env.TLS_WARN_DAYS ?? 14),
  historyLen: Number(process.env.HISTORY_LEN ?? 60),
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN ?? "",
    chatId: process.env.TELEGRAM_CHAT_ID ?? "",
  },
};

export { parseTargets };

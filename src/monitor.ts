import { config, type Target } from "./config";
import { httpCheck, tlsCheck } from "./checks";
import { escapeHtml, notify } from "./telegram";

export interface TargetState {
  name: string;
  url: string;
  host: string;
  up: boolean | null;
  status: number;
  latencyMs: number;
  error?: string;
  tlsDaysLeft: number | null;
  tlsValidTo: string | null;
  lastCheck: number;
  history: boolean[]; // ring buffer of recent up/down samples
  uptimePct: number;
}

export class Monitor {
  private states = new Map<string, TargetState>();
  private tlsWarned = new Set<string>();
  private timer?: ReturnType<typeof setInterval>;

  constructor(targets: Target[]) {
    for (const t of targets) {
      this.states.set(t.url, {
        name: t.name,
        url: t.url,
        host: t.host,
        up: null,
        status: 0,
        latencyMs: 0,
        tlsDaysLeft: null,
        tlsValidTo: null,
        lastCheck: 0,
        history: [],
        uptimePct: 0,
      });
    }
  }

  snapshot(): TargetState[] {
    return [...this.states.values()];
  }

  private async checkOne(t: Target): Promise<void> {
    const state = this.states.get(t.url)!;
    const http = await httpCheck(t.url, config.timeoutMs);
    const wasUp = state.up;

    state.status = http.status;
    state.latencyMs = http.latencyMs;
    state.error = http.error;
    state.up = http.ok;
    state.lastCheck = Date.now();

    state.history.push(http.ok);
    if (state.history.length > config.historyLen) state.history.shift();
    const upCount = state.history.filter(Boolean).length;
    state.uptimePct = Math.round((upCount / state.history.length) * 100);

    // TLS only for https targets.
    if (t.url.startsWith("https://")) {
      const tlsRes = await tlsCheck(t.host, config.timeoutMs);
      state.tlsDaysLeft = tlsRes.daysLeft;
      state.tlsValidTo = tlsRes.validTo;
      if (tlsRes.daysLeft !== null && tlsRes.daysLeft <= config.tlsWarnDays) {
        if (!this.tlsWarned.has(t.url)) {
          this.tlsWarned.add(t.url);
          await notify(`🔐 <b>${escapeHtml(t.name)}</b> TLS expira em <b>${tlsRes.daysLeft}d</b> (${escapeHtml(t.host)})`);
        }
      } else {
        this.tlsWarned.delete(t.url);
      }
    }

    // Alert on state transition only (avoids spam).
    if (wasUp !== null && wasUp !== http.ok) {
      if (http.ok) {
        await notify(`✅ <b>${escapeHtml(t.name)}</b> voltou (${http.status}, ${http.latencyMs}ms)`);
      } else {
        await notify(`🔴 <b>${escapeHtml(t.name)}</b> caiu — ${escapeHtml(http.error ?? "HTTP " + http.status)} (${escapeHtml(t.url)})`);
      }
    }
  }

  async runOnce(): Promise<void> {
    await Promise.all(
      this.snapshot().map((s) => this.checkOne({ name: s.name, url: s.url, host: s.host })),
    );
  }

  start(): void {
    if (config.targets.length === 0) {
      console.warn("[monitor] no TARGETS configured; dashboard will be empty");
      return;
    }
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), config.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

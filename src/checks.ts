import tls from "node:tls";

export interface HttpResult {
  ok: boolean;
  status: number;
  latencyMs: number;
  error?: string;
}

export async function httpCheck(url: string, timeoutMs: number): Promise<HttpResult> {
  const started = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: ctrl.signal,
      headers: { "user-agent": "cluster-pulse/1.0" },
    });
    const latencyMs = Math.round(performance.now() - started);
    // 2xx/3xx are healthy; a served 4xx still proves the ingress is up.
    const ok = res.status > 0 && res.status < 500;
    return { ok, status: res.status, latencyMs };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - started),
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface TlsResult {
  daysLeft: number | null;
  validTo: string | null;
  error?: string;
}

// Opens a raw TLS socket to host:443 and reads the leaf cert expiry.
export function tlsCheck(host: string, timeoutMs: number): Promise<TlsResult> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: TlsResult) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {}
      resolve(r);
    };
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: timeoutMs },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) return done({ daysLeft: null, validTo: null, error: "no cert" });
        const expiry = new Date(cert.valid_to).getTime();
        const daysLeft = Math.floor((expiry - Date.now()) / 86_400_000);
        done({ daysLeft, validTo: cert.valid_to });
      },
    );
    socket.on("timeout", () => done({ daysLeft: null, validTo: null, error: "tls timeout" }));
    socket.on("error", (e) => done({ daysLeft: null, validTo: null, error: e.message }));
  });
}

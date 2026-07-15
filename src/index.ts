import { Hono } from "hono";
import { config } from "./config";
import { Monitor } from "./monitor";
import { dashboardHtml } from "./dashboard";

const monitor = new Monitor(config.targets);

const app = new Hono();

app.get("/", (c) => c.html(dashboardHtml));

app.get("/api/status", (c) =>
  c.json({
    generatedAt: new Date().toISOString(),
    intervalMs: config.intervalMs,
    targets: monitor.snapshot(),
  }),
);

app.get("/health", (c) => c.json({ ok: true, targets: config.targets.length }));

// Only start the loop + server when run as the entrypoint (keeps tests side-effect free).
if (import.meta.main) {
  monitor.start();
  console.log(`cluster-pulse on :${config.port} watching ${config.targets.length} target(s)`);
  Bun.serve({ port: config.port, fetch: app.fetch });
}

export { app, monitor };

import { test, expect } from "bun:test";
import { escapeHtml } from "../src/telegram";
import { dashboardHtml } from "../src/dashboard";

test("escapeHtml neutralises Telegram HTML tags and entities", () => {
  expect(escapeHtml("<b>x</b> & y")).toBe("&lt;b&gt;x&lt;/b&gt; &amp; y");
});

test("dashboard escapes target name and error before innerHTML", () => {
  expect(dashboardHtml).toContain("esc(t.name)");
  expect(dashboardHtml).toContain("esc(t.error || 'down')");
});

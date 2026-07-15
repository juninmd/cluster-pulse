import { test, expect } from "bun:test";
import { parseTargets } from "../src/config";
import { Monitor } from "../src/monitor";

test("parseTargets handles bare urls and Label=url", () => {
  const t = parseTargets("https://a.example.org, API=https://b.example.org/health");
  expect(t.length).toBe(2);
  expect(t[0].name).toBe("a.example.org");
  expect(t[1].name).toBe("API");
  expect(t[1].host).toBe("b.example.org");
});

test("parseTargets ignores empties", () => {
  expect(parseTargets("").length).toBe(0);
  expect(parseTargets(" , ,").length).toBe(0);
});

test("monitor snapshot mirrors configured targets", () => {
  const m = new Monitor(parseTargets("https://x.example.org"));
  const snap = m.snapshot();
  expect(snap.length).toBe(1);
  expect(snap[0].up).toBeNull();
  expect(snap[0].uptimePct).toBe(0);
});

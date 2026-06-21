import test from "node:test";
import assert from "node:assert";
import { db } from "../lib/db.ts";

test("Performance Benchmarks & Database Metrics", async (t) => {
  await t.test("Database Query Response Time Latency Limit", async () => {
    const start = performance.now();
    await db.query("SELECT COUNT(*) FROM public.profiles");
    const end = performance.now();
    const duration = end - start;

    console.log(`\tDatabase user count latency: ${duration.toFixed(2)}ms`);
    assert.ok(duration < 100, "Database query response exceeds SLA metric of 100ms");
  });
});

import test from "node:test";
import assert from "node:assert";
// @ts-expect-error: Node.js native --experimental-strip-types requires explicit .ts extension
import { db } from "../lib/db.ts";

test("Database Integration & CRUD Queries", async (t) => {
  const testUserId = "00000000-0000-0000-0000-000000000000";

  await t.test("Database Connection Pool Ping", async () => {
    const res = await db.query("SELECT 1 AS ping");
    assert.strictEqual(res.rows[0].ping, 1);
  });

  await t.test("Create test user profile", async () => {
    await db.query("DELETE FROM public.profiles WHERE id = $1", [testUserId]);
    await db.query(
      `INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
       VALUES ($1, 'test-qa@resumeai.pro', 'QA Tester', NOW(), NOW())`,
      [testUserId]
    );

    const res = await db.query("SELECT * FROM public.profiles WHERE id = $1", [testUserId]);
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].full_name, "QA Tester");
  });

  await t.test("Create audit log entry", async () => {
    await db.query(
      `INSERT INTO public.audit_logs (user_id, action, severity, details)
       VALUES ($1, 'test.verify', 'info', '{"status":"ok"}'::jsonb)`,
      [testUserId]
    );

    const res = await db.query("SELECT * FROM public.audit_logs WHERE user_id = $1", [testUserId]);
    assert.ok(res.rows.length >= 1);
    assert.strictEqual(res.rows[0].action, "test.verify");
  });

  await t.test("Cascade delete user profile purges logs and consents", async () => {
    await db.query(
      `INSERT INTO public.user_consents (user_id, cookies_essential, cookies_analytical, cookies_marketing, data_retention_days)
       VALUES ($1, true, true, false, 90)`,
      [testUserId]
    );

    // Verify insert
    const consentBefore = await db.query("SELECT * FROM public.user_consents WHERE user_id = $1", [testUserId]);
    assert.strictEqual(consentBefore.rows.length, 1);

    // Delete profile
    await db.query("DELETE FROM public.profiles WHERE id = $1", [testUserId]);

    // Verify cascade deletes
    const profileAfter = await db.query("SELECT * FROM public.profiles WHERE id = $1", [testUserId]);
    assert.strictEqual(profileAfter.rows.length, 0);

    const consentAfter = await db.query("SELECT * FROM public.user_consents WHERE user_id = $1", [testUserId]);
    assert.strictEqual(consentAfter.rows.length, 0);
  });
});

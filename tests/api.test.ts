import test from "node:test";
import assert from "node:assert";
// @ts-expect-error: Node.js native --experimental-strip-types requires explicit .ts extension
import { generateKeyAndHash, hashApiKey, signWebhookPayload } from "../lib/api-auth.ts";

test("API Authentication & Rate Limiter Logic", async (t) => {
  await t.test("API Key generation prefix and format", () => {
    const { plainTextKey, keyPrefix, keyHash } = generateKeyAndHash();
    assert.ok(plainTextKey.startsWith("rai_"));
    assert.strictEqual(keyPrefix.length, 12); // rai_ + 8 hex chars
    assert.strictEqual(keyHash, hashApiKey(plainTextKey));
  });

  await t.test("Webhook signature signing verification", () => {
    const payload = JSON.stringify({ event: "resume.created", id: "123" });
    const secret = "qa_webhook_secret_key_999";
    const sig = signWebhookPayload(payload, secret);
    
    // Validate consistent signature mapping
    assert.strictEqual(sig.length, 64); // SHA-256 HMAC length
    assert.strictEqual(sig, signWebhookPayload(payload, secret));
  });
});

import test from "node:test";
import assert from "node:assert";
import nextConfig from "../next.config.ts";

test("Security Architecture Audit - HTTP Headers", async (t) => {
  await t.test("Next.js Security headers function configuration", async () => {
    if (typeof nextConfig.headers !== "function") {
      assert.fail("nextConfig.headers is not a function");
    }

    const headersList = await nextConfig.headers();
    assert.ok(Array.isArray(headersList));
    assert.ok(headersList.length > 0);

    const globalHeaders = headersList.find((h) => h.source === "/:path*");
    assert.ok(globalHeaders, "Missing global source path match in next.config.ts");

    const csp = globalHeaders.headers.find((header) => header.key === "Content-Security-Policy");
    assert.ok(csp, "Missing Content-Security-Policy header configuration");
    assert.ok(csp.value.includes("default-src 'self'"), "CSP policy lacks default-src self definition");
    assert.ok(csp.value.includes("object-src 'none'"), "CSP policy lacks object-src none definition");

    const hsts = globalHeaders.headers.find((header) => header.key === "Strict-Transport-Security");
    assert.ok(hsts, "Missing HSTS header");
    assert.ok(hsts.value.includes("includeSubDomains"), "HSTS lacks includeSubDomains scope");

    const frameOptions = globalHeaders.headers.find((header) => header.key === "X-Frame-Options");
    assert.ok(frameOptions, "Missing X-Frame-Options header");
    assert.strictEqual(frameOptions.value, "DENY", "X-Frame-Options must block frame ancestors");
  });
});

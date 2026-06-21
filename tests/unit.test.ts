import test from "node:test";
import assert from "node:assert";
import { getTranslation, formatCurrency, formatDate } from "../lib/translations.ts";

test("Unit Tests - Translations & Formatting", async (t) => {
  await t.test("Translation keys lookup", () => {
    const enDashboard = getTranslation("en", "dashboard");
    assert.strictEqual(enDashboard, "Dashboard");

    const esDashboard = getTranslation("es", "dashboard");
    assert.strictEqual(esDashboard, "Panel");

    const arDashboard = getTranslation("ar", "dashboard");
    assert.strictEqual(arDashboard, "لوحة التحكم");

    const fallbackVal = getTranslation("en", "invalid_key_999");
    assert.strictEqual(fallbackVal, "invalid_key_999");
  });

  await t.test("Currency localization", () => {
    const usdVal = formatCurrency(19.99, "USD", "en-US");
    assert.ok(usdVal.includes("$19.99"));

    const eurVal = formatCurrency(49.00, "EUR", "de-DE");
    const normalizedEur = eurVal.replace(/\u00a0/g, " ");
    assert.ok(normalizedEur.includes("49,00"));
  });

  await t.test("Date localization", () => {
    const formattedDate = formatDate("2026-06-21", "en-US");
    assert.ok(formattedDate.includes("2026") || formattedDate.includes("Jun"));
  });
});

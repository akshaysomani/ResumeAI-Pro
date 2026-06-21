import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";

test("Accessibility Compliance (WCAG 2.2 AA) Audits", async (t) => {
  const layoutPath = path.join(process.cwd(), "app/dashboard/layout.tsx");

  await t.test("Verify skip-to-main-content interactive anchor", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf8");
    assert.ok(layoutContent.includes('href="#main-content"'), "Layout lacks skip link referencing #main-content");
    assert.ok(layoutContent.includes('id="main-content"'), "Layout lacks main container with id='main-content'");
    assert.ok(layoutContent.includes('tabIndex={-1}'), "Layout lacks focusable main container tabIndex={-1}");
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ar from "../messages/ar.json";
import en from "../messages/en.json";

const arabic = ar as Record<string, unknown>;
const english = en as Record<string, unknown>;
const schemaSql = readFileSync("docs/hr-payroll-manual-schema.sql", "utf8");

function keysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(keysDeep);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, keysDeep(child)]));
  return typeof value === "string" ? "<translated>" : value;
}

test("HR translations have matching Arabic and English message structures", () => {
  assert.deepEqual(keysDeep(arabic.hr), keysDeep(english.hr));
  assert.deepEqual(keysDeep(arabic.navigation), keysDeep(english.navigation));
});

test("landing copy includes both translated HR feature and ERP positioning", () => {
  const arLanding = arabic.landing as { hero: { subtitle: string }; features: Record<string, string> };
  const enLanding = english.landing as { hero: { subtitle: string }; features: Record<string, string> };
  assert.ok(arLanding.hero.subtitle.includes("ERP"));
  assert.ok(enLanding.hero.subtitle.includes("ERP"));
  assert.ok(arLanding.features.hrTitle && arLanding.features.hrText);
  assert.ok(enLanding.features.hrTitle && enLanding.features.hrText);
});

test("manual D1 SQL defines all HR tables with tenant ownership and timestamps", () => {
  for (const table of ["hr_employees", "hr_attendance", "hr_transactions", "hr_custody", "hr_payroll"]) {
    const match = schemaSql.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`));
    assert.ok(match, `missing CREATE TABLE for ${table}`);
    assert.match(match[1] ?? "", /tenant_id TEXT NOT NULL/);
    assert.match(match[1] ?? "", /created_at INTEGER NOT NULL/);
    assert.match(match[1] ?? "", /updated_at INTEGER NOT NULL/);
  }
  assert.match(schemaSql, /FOREIGN KEY \(tenant_id, employee_id\) REFERENCES hr_employees/);
});

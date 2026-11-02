import assert from "node:assert/strict";
import test from "node:test";
import { isAccountSuspended, nextAccountAccessStatus } from "@/lib/account-access";
import { suspendedAccountResponse } from "@/lib/server/account-access";
import { PLATFORM_WHATSAPP_NUMBER } from "@/lib/brand";
import { normalizeSupportWhatsAppNumber, resolveSupportWhatsAppNumber } from "@/lib/platform/support-whatsapp-shared";

test("suspension transitions lock the workspace and reactivation restores active access", () => {
  assert.equal(nextAccountAccessStatus("suspend_account"), "suspended");
  assert.equal(isAccountSuspended(nextAccountAccessStatus("suspend_account")), true);
  assert.equal(nextAccountAccessStatus("reactivate_account"), "active");
  assert.equal(isAccountSuspended(nextAccountAccessStatus("reactivate_account")), false);
  assert.equal(isAccountSuspended("active"), false);
  assert.equal(isAccountSuspended(null), false);
});

test("platform support WhatsApp numbers normalize and fall back to the platform default", () => {
  assert.equal(normalizeSupportWhatsAppNumber("01012345678"), "201012345678");
  assert.equal(normalizeSupportWhatsAppNumber("+20 101 234 5678"), "201012345678");
  assert.equal(normalizeSupportWhatsAppNumber("bad-number"), null);
  assert.equal(resolveSupportWhatsAppNumber(""), PLATFORM_WHATSAPP_NUMBER);
  assert.equal(resolveSupportWhatsAppNumber("bad-number"), PLATFORM_WHATSAPP_NUMBER);
  assert.equal(resolveSupportWhatsAppNumber("01012345678"), "201012345678");
});

test("suspended workspace API response is a non-cacheable lockout with a contact path", async () => {
  const response = await suspendedAccountResponse(new Request("https://qutoof.example/api/ops/branches", { headers: { "Accept-Language": "en" } }), "201099999999");
  const body = await response.json() as { code: string; error: string; contactUrl: string };
  assert.equal(response.status, 423);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(body.code, "ACCOUNT_SUSPENDED");
  assert.ok(body.error.length > 0);
  assert.equal(body.contactUrl, "https://wa.me/201099999999");
});

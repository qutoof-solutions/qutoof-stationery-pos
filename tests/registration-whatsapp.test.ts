import assert from "node:assert/strict";
import test from "node:test";
import { buildRegistrationWhatsAppUrl } from "@/lib/whatsapp/registration";

test("registration activation link targets the configured support WhatsApp number", () => {
  const url = new URL(buildRegistrationWhatsAppUrl({ fullName: "Test Owner", phone: "+201012345678", email: "owner@example.test", business: "Retail — Test Shop" }, "201099999999"));
  assert.equal(url.host, "wa.me");
  assert.equal(url.pathname, "/201099999999");
  const message = url.searchParams.get("text") ?? "";
  assert.match(message, /Test Owner/);
  assert.match(message, /\+201012345678/);
  assert.match(message, /owner@example\.test/);
  assert.match(message, /Test Shop/);
});

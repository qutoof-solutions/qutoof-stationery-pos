import { PLATFORM_WHATSAPP_NUMBER } from "@/lib/brand";
import { normalizePhoneNumber, toWhatsAppDigits } from "@/lib/phone-number";

export const PLATFORM_SUPPORT_WHATSAPP_SETTING_KEY = "platform.support_whatsapp";

export function normalizeSupportWhatsAppNumber(value: string): string | null {
  const normalized = normalizePhoneNumber(value);
  return normalized ? toWhatsAppDigits(normalized) : null;
}

export function resolveSupportWhatsAppNumber(value: string | null | undefined): string {
  if (value?.trim()) return normalizeSupportWhatsAppNumber(value) ?? PLATFORM_WHATSAPP_NUMBER;
  return PLATFORM_WHATSAPP_NUMBER;
}

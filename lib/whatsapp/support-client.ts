import { PLATFORM_WHATSAPP_NUMBER } from "@/lib/brand";
import { toWhatsAppDigits } from "@/lib/phone-number";

export async function fetchPlatformSupportWhatsAppNumber(): Promise<string> {
  try {
    const response = await fetch("/api/public/platform-support", { cache: "no-store" });
    if (!response.ok) return PLATFORM_WHATSAPP_NUMBER;
    const payload = await response.json() as { supportWhatsAppNumber?: unknown };
    return typeof payload.supportWhatsAppNumber === "string"
      ? toWhatsAppDigits(payload.supportWhatsAppNumber) ?? PLATFORM_WHATSAPP_NUMBER
      : PLATFORM_WHATSAPP_NUMBER;
  } catch {
    return PLATFORM_WHATSAPP_NUMBER;
  }
}

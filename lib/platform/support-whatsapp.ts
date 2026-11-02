import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { platformSettings } from "@/lib/db/schema";
import { PLATFORM_WHATSAPP_NUMBER } from "@/lib/brand";
import { PLATFORM_SUPPORT_WHATSAPP_SETTING_KEY, resolveSupportWhatsAppNumber } from "@/lib/platform/support-whatsapp-shared";
export { normalizeSupportWhatsAppNumber, resolveSupportWhatsAppNumber } from "@/lib/platform/support-whatsapp-shared";

export async function getPlatformSupportWhatsAppNumber(db?: ReturnType<typeof getDb>): Promise<string> {
  try {
    const database = db ?? getDb();
    const [setting] = await database.select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, PLATFORM_SUPPORT_WHATSAPP_SETTING_KEY))
      .limit(1);
    return resolveSupportWhatsAppNumber(setting?.value);
  } catch {
    return PLATFORM_WHATSAPP_NUMBER;
  }
}

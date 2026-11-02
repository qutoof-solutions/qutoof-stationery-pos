import { NextResponse } from "next/server";
import { getPlatformSupportWhatsAppNumber } from "@/lib/platform/support-whatsapp";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const supportWhatsAppNumber = await getPlatformSupportWhatsAppNumber();
  return NextResponse.json({ supportWhatsAppNumber }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

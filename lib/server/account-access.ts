import { serverMessage } from "@/lib/i18n/p1-server-messages";

export async function suspendedAccountResponse(request: Request, supportWhatsAppNumber?: string): Promise<Response> {
  const number = supportWhatsAppNumber ?? await (await import("@/lib/platform/support-whatsapp")).getPlatformSupportWhatsAppNumber();
  return Response.json({
    code: "ACCOUNT_SUSPENDED",
    error: serverMessage(request, "p1Server.superAdmin.accountSuspended"),
    contactUrl: `https://wa.me/${number}`,
  }, { status: 423, headers: { "Cache-Control": "no-store" } });
}

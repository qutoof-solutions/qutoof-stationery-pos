import { PLATFORM_WHATSAPP_NUMBER } from "@/lib/brand";

export type RegistrationWhatsAppDetails = {
  fullName: string;
  phone: string;
  email: string;
  business: string;
};

export function buildRegistrationWhatsAppUrl(details: RegistrationWhatsAppDetails, supportWhatsAppNumber: string = PLATFORM_WHATSAPP_NUMBER): string {
  const message = [
    "مرحباً Qutoof Business، قمت بتسجيل حساب جديد الآن.",
    `الاسم: ${details.fullName.trim()}`,
    `رقم الموبايل: ${details.phone.trim()}`,
    `البريد: ${details.email.trim()}`,
    `النشاط: ${details.business.trim()}`,
  ].join("\n");
  const url = new URL(`https://wa.me/${supportWhatsAppNumber.replace(/\D/g, "") || PLATFORM_WHATSAPP_NUMBER}`);
  url.searchParams.set("text", message);
  return url.toString();
}

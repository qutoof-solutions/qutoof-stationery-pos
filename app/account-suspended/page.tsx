import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MessageCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/brand";
import { getPlatformSupportWhatsAppNumber } from "@/lib/platform/support-whatsapp";

export default async function AccountSuspendedPage() {
  const locale = await getLocale();
  const t = await getTranslations("accountSuspended");
  const supportWhatsAppNumber = await getPlatformSupportWhatsAppNumber();
  return <main dir={locale === "ar" ? "rtl" : "ltr"} lang={locale === "ar" ? "ar" : "en"} className="auth-page flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
    <section role="alert" className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-6 text-slate-900 shadow-xl dark:border-red-900 dark:bg-slate-950 dark:text-slate-100 sm:p-9">
      <span className="inline-grid size-14 place-items-center rounded-2xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"><ShieldAlert size={27} /></span>
      <p className="mt-5 text-sm font-bold text-emerald-700 dark:text-emerald-300">{PRODUCT_NAME}</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{t("title")}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{t("message")}</p>
      <a href={`https://wa.me/${supportWhatsAppNumber}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-800 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"><MessageCircle size={18} />{t("contact")}</a>
      <Button asChild variant="outline" className="mt-3 w-full dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><Link href="/login">{t("backToLogin")}</Link></Button>
    </section>
  </main>;
}

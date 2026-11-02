"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/components/platform/api-client";
import { ChangePasswordPanel } from "@/components/platform/change-password-panel";
import { TwoFactorSettingsPanel } from "@/components/platform/two-factor-settings-panel";
import { PLATFORM_WHATSAPP_NUMBER } from "@/lib/brand";
import { normalizePhoneNumber } from "@/lib/phone-number";

type Settings = { trialDays: number; graceDays: number; vodafoneCashNumber: string; supportWhatsAppNumber: string; instapayQrUrl: string; currency: string; monthlyPercent: number; annualMode: "free_months" | "percent"; annualFreeMonths: number; annualPercent: number };
const initial: Settings = { trialDays: 30, graceDays: 3, vodafoneCashNumber: "", supportWhatsAppNumber: PLATFORM_WHATSAPP_NUMBER, instapayQrUrl: "", currency: "EGP", monthlyPercent: 0, annualMode: "free_months", annualFreeMonths: 0, annualPercent: 0 };

export function PlatformSettingsPanel() {
  const locale = useLocale();
  const t = useTranslations("platformAdmin");
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { setSettings(await apiRequest<Settings>("/api/super-admin/settings")); setLoaded(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("settings.loadError")); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settings.supportWhatsAppNumber.trim() && !normalizePhoneNumber(settings.supportWhatsAppNumber)) {
      setError(t("settings.supportWhatsAppInvalid"));
      setNotice("");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const updated = await apiRequest<Settings>("/api/super-admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trialDays: settings.trialDays, vodafoneCashNumber: settings.vodafoneCashNumber.trim(), supportWhatsAppNumber: settings.supportWhatsAppNumber.trim(), instapayQrUrl: settings.instapayQrUrl.trim(), monthlyDiscountPercent: settings.monthlyPercent, annualDiscountMode: settings.annualMode, annualFreeMonths: settings.annualFreeMonths, annualDiscountPercent: settings.annualPercent }) });
      setSettings(updated);
      setNotice(t("settings.saveSuccess"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("settings.saveError")); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-3xl space-y-5" dir={locale === "ar" ? "rtl" : "ltr"}>
    <div><p className="text-sm font-semibold text-teal dark:text-teal-300">{t("settings.title")}</p><h1 className="mt-1 text-2xl font-bold text-navy dark:text-slate-100">{t("settings.trialAndPayments")}</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("settings.description")}</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}{notice && <p role="status" className="rounded-xl border border-teal/20 bg-teal/5 p-3 text-sm text-teal dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">{notice}</p>}
    {!loaded && !error && <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300"><LoaderCircle className="animate-spin" size={17} />{t("common.loading")}</div>}
    {loaded && <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <label className="block text-sm font-semibold text-navy dark:text-slate-100">{t("settings.trialDuration")}<input required name="trialDays" type="number" min="1" max="180" value={settings.trialDays} onChange={(event) => setSettings((current) => ({ ...current, trialDays: Number(event.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{t("settings.trialNote")}</span></label>
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:border dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><strong>{t("settings.gracePrefix")} {settings.graceDays} {t("settings.days")}.</strong> {t("settings.graceNote")}</div>
      <hr className="border-slate-100 dark:border-slate-700" />
      <div className="space-y-4 rounded-xl border border-teal/20 bg-teal/5 p-4 dark:border-teal-800 dark:bg-teal-950/40"><div><h2 className="font-bold text-navy dark:text-slate-100">{t("settings.discounts")}</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{t("settings.discountNote")}</p></div><label className="block text-sm font-semibold text-navy dark:text-slate-100">{t("settings.monthlyDiscount")}<input type="number" min="0" max="100" step="0.01" value={settings.monthlyPercent} onChange={(event) => setSettings((current) => ({ ...current, monthlyPercent: Number(event.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-600" dir="ltr" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-navy dark:text-slate-100">{t("settings.annualDiscountMode")}<select value={settings.annualMode} onChange={(event) => setSettings((current) => ({ ...current, annualMode: event.target.value as Settings["annualMode"] }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-600"><option value="free_months">{t("settings.freeMonths")}</option><option value="percent">{t("settings.directPercent")}</option></select></label>{settings.annualMode === "free_months" ? <label className="text-sm font-semibold text-navy dark:text-slate-100">{t("settings.freeMonthsCount")}<input type="number" min="0" max="11" step="1" value={settings.annualFreeMonths} onChange={(event) => setSettings((current) => ({ ...current, annualFreeMonths: Number(event.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-600" dir="ltr" /></label> : <label className="text-sm font-semibold text-navy dark:text-slate-100">{t("settings.annualDiscount")}<input type="number" min="0" max="100" step="0.01" value={settings.annualPercent} onChange={(event) => setSettings((current) => ({ ...current, annualPercent: Number(event.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-600" dir="ltr" /></label>}</div></div>
      <label className="block text-sm font-semibold text-navy dark:text-slate-100">{t("settings.vodafoneCashNumber")}<input name="vodafoneCashNumber" type="tel" value={settings.vodafoneCashNumber} onChange={(event) => setSettings((current) => ({ ...current, vodafoneCashNumber: event.target.value }))} maxLength={20} placeholder={t("settings.vodafonePlaceholder")} dir="ltr" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{t("settings.vodafoneNote")}</span></label>
      <label className="block text-sm font-semibold text-navy dark:text-slate-100">{t("settings.supportWhatsAppNumber")}<input name="supportWhatsAppNumber" type="tel" value={settings.supportWhatsAppNumber} onChange={(event) => setSettings((current) => ({ ...current, supportWhatsAppNumber: event.target.value }))} maxLength={32} autoComplete="tel" inputMode="tel" placeholder={t("settings.supportWhatsAppPlaceholder")} dir="ltr" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-slate-900 outline-none focus:border-teal dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{t("settings.supportWhatsAppNote")}</span></label>
      <label className="block text-sm font-semibold text-navy dark:text-slate-100">{t("settings.instapayQrUrl")}<input name="instapayQrUrl" type="url" value={settings.instapayQrUrl} onChange={(event) => setSettings((current) => ({ ...current, instapayQrUrl: event.target.value }))} maxLength={2048} placeholder={t("settings.instapayPlaceholder")} dir="ltr" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{t("settings.instapayNote")}</span></label>
      {settings.instapayQrUrl && <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.qrPreview")}<a href={settings.instapayQrUrl} target="_blank" rel="noreferrer" className="text-teal underline dark:text-teal-300">{t("settings.openImage")}</a></p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{t("common.saveSettings")}</Button><Button type="button" variant="outline" onClick={() => void load()}><RefreshCw size={16} />{t("common.reload")}</Button></div>
    </form>}
    <ChangePasswordPanel />
    <TwoFactorSettingsPanel />
  </section>;
}

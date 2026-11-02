"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRightLeft,
  BadgeCheck,
  Barcode,
  Boxes,
  CalendarClock,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileText,
  HeartPulse,
  Layers3,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Truck,
  UserRound,
  UsersRound,
  Wallet,
  Warehouse,
  Wifi,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import type { LandingLanguage } from "./product-mockups";

const CYCLE_MS = 2500;

function useAutoCycle(length: number) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => (current + 1) % length), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [length]);
  return step;
}

export function LiveUiMockups({ language }: { language: LandingLanguage }) {
  const t = useTranslations("landing.liveMockups");
  return (
    <section lang={language} dir={language === "ar" ? "rtl" : "ltr"} className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="live-ui-title">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-80 bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,.10),transparent_67%)]" />
      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-eyebrow">{t("eyebrow")}</p>
            <h2 id="live-ui-title" className="landing-section-title mt-3">{t("title")}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{t("description")}</p>
          </div>
        </ScrollReveal>
        <div className="mt-9 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <ErpWindow language={language} />
          <WarehouseWindow language={language} />
          <PipelineWindow language={language} />
          <HrWindow language={language} />
        </div>
      </div>
    </section>
  );
}

function DemoWindow({ language, title, step, children }: { language: LandingLanguage; title: string; step: number; children: ReactNode }) {
  const t = useTranslations("landing.liveMockups");
  return (
    <article lang={language} dir={language === "ar" ? "rtl" : "ltr"} translate="no" className="live-mockup-window relative isolate overflow-hidden rounded-[1.45rem] border border-teal-300/25 bg-[#071318] text-slate-100 shadow-[0_28px_90px_-36px_rgba(13,148,136,.48)] backdrop-blur-xl">
      <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-24 -z-10 size-64 rounded-full bg-teal-400/10 blur-3xl" />
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a192f]/90 px-3 py-3 sm:px-4">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true"><span className="size-2.5 rounded-full bg-rose-400/90" /><span className="size-2.5 rounded-full bg-amber-300/90" /><span className="size-2.5 rounded-full bg-emerald-400/90" /></div>
        <div className="min-w-0 flex-1 text-center"><p className="truncate text-[9px] font-black tracking-wide text-slate-100 sm:text-[10px]">Qutoof Business</p><p className="truncate text-[8px] text-slate-400">{title}</p></div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[8px] font-semibold text-emerald-200"><span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />{t("liveStatus")}</span>
      </header>
      <div className="relative min-h-[19rem] p-3 sm:min-h-[20rem] sm:p-4">{children}</div>
      <div className="h-1 overflow-hidden bg-white/10" role="progressbar" aria-label={t("timelineLabel")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((step + 1) / 4) * 100)}><motion.div key={step} className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-200 shadow-[0_0_12px_rgba(45,212,191,.75)]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: CYCLE_MS / 1000, ease: "linear" }} /></div>
    </article>
  );
}

function ErpWindow({ language }: { language: LandingLanguage }) {
  const t = useTranslations("landing.liveMockups.erp");
  const step = useAutoCycle(4);
  const navigation = t.raw("navigation") as string[];
  const rows = t.raw("invoiceRows") as Array<{ item: string; detail: string; amount: string }>;
  const metrics = t.raw("metricSets") as Array<{ sales: string; invoices: string; installments: string }>;
  const current = metrics[step] ?? metrics[0]!;
  return (
    <DemoWindow language={language} title={t("windowTitle")} step={step}>
      <div className="grid h-full gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
        <nav aria-label={t("navigationLabel")} className="grid grid-cols-2 gap-1 sm:flex sm:flex-col">
          {navigation.map((item, index) => <div key={item} className={`flex min-h-9 items-center gap-2 rounded-lg border px-2 py-2 text-[8px] font-semibold transition-all duration-500 sm:min-h-10 sm:text-[9px] ${step === index ? "border-teal-300/45 bg-teal-300/15 text-teal-100 shadow-[0_0_20px_rgba(45,212,191,.10)]" : "border-white/[0.06] bg-white/[0.025] text-slate-400"}`}><span className={`size-1.5 shrink-0 rounded-full ${step === index ? "bg-teal-200" : "bg-slate-600"}`} />{item}</div>)}
        </nav>
        <div className="relative min-w-0 rounded-xl border border-white/10 bg-[#0a192f]/85 p-3 pb-16 sm:p-3.5 sm:pb-16">
          <div className="mb-2 flex items-center justify-between gap-2"><h3 className="truncate text-[10px] font-bold text-white sm:text-xs">{navigation[step]}</h3><span className="inline-flex shrink-0 items-center gap-1 text-[8px] text-teal-200"><ShoppingCart size={11} />{t("workspaceLabel")}</span></div>
          <div className="grid grid-cols-3 gap-1.5">
            <Metric label={t("salesToday")} value={current?.sales ?? ""} icon={CircleDollarSign} />
            <Metric label={t("activeInvoices")} value={current?.invoices ?? ""} icon={FileText} />
            <Metric label={t("installmentCollections")} value={current?.installments ?? ""} icon={Wallet} />
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-white/[0.08]">
            <div className="grid grid-cols-[1fr_auto] gap-2 bg-white/[0.045] px-2 py-1.5 text-[7px] font-semibold text-slate-400"><span>{t("invoiceItems")}</span><span>{t("amountLabel")}</span></div>
            {rows.slice(0, 3).map((row, index) => <div key={row.item} className={`grid grid-cols-[1fr_auto] items-center gap-2 border-t border-white/[0.06] px-2 py-1.5 transition-colors duration-500 ${index === step % 3 ? "bg-teal-300/[0.07]" : "bg-transparent"}`}><span className="min-w-0"><strong className="block truncate text-[8px] font-semibold text-slate-200">{row.item}</strong><small className="block truncate text-[7px] text-slate-500">{row.detail}</small></span><span className="text-[8px] font-semibold text-teal-100">{row.amount}</span></div>)}
          </div>
          <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .45 }} className="absolute bottom-2 end-2 flex max-w-[90%] items-center gap-2 rounded-xl border border-emerald-200/25 bg-[#102c2c]/95 px-2.5 py-2 shadow-[0_12px_38px_rgba(0,0,0,.45)] backdrop-blur-xl"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-300/15 text-emerald-200"><ScanLine size={15} /></span><span><strong className="block text-[8px] text-emerald-100">{t("scanOverlayTitle")}</strong><small className="mt-0.5 block text-[7px] leading-4 text-emerald-200/80"><Barcode size={9} className="me-1 inline" />{t("scanOverlayReceipt")}</small></span><Check size={13} className="shrink-0 text-emerald-200" /></motion.div></AnimatePresence>
        </div>
      </div>
    </DemoWindow>
  );
}

function WarehouseWindow({ language }: { language: LandingLanguage }) {
  const t = useTranslations("landing.liveMockups.warehouse");
  const step = useAutoCycle(4);
  const tiles = t.raw("tiles") as string[];
  const transfers = t.raw("transferSteps") as Array<{ source: string; destination: string; item: string; quantity: string; expiry: string }>;
  const current = transfers[step] ?? transfers[0]!;
  return (
    <DemoWindow language={language} title={t("windowTitle")} step={step}>
      <div className="relative h-full rounded-xl border border-white/10 bg-[#0a192f]/85 p-3 sm:p-3.5">
        <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-teal-300/10 text-teal-100"><Layers3 size={14} /></span><div><h3 className="text-[9px] font-bold text-white sm:text-[10px]">{t("matrixTitle")}</h3><p className="text-[7px] text-slate-500">{t("connectedNodes")}</p></div></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-1 text-[7px] font-semibold text-emerald-200"><Wifi size={9} />{t("syncStatus")}</span></div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {tiles.map((tile, index) => { const Icon = [Warehouse, Boxes, Truck, Barcode, Layers3, AlertTriangle][index]!; return <div key={tile} className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center text-[7px] font-semibold transition-all duration-500 sm:text-[8px] ${step === index ? "border-teal-300/45 bg-teal-300/15 text-teal-100 shadow-[0_0_22px_rgba(45,212,191,.10)]" : "border-white/[0.08] bg-white/[0.025] text-slate-400"}`}><Icon size={13} className={step === index ? "text-teal-200" : "text-slate-500"} />{tile}</div>; })}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5"><div className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1.5"><p className="text-[7px] text-slate-500">{t("branchStock")}</p><p className="mt-0.5 text-[10px] font-bold text-white">{t("branchStockValue")}</p></div><div className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1.5"><p className="text-[7px] text-slate-500">{t("repCustody")}</p><p className="mt-0.5 text-[10px] font-bold text-white">{t("repCustodyValue")}</p></div></div>
        <AnimatePresence mode="wait"><motion.aside key={step} initial={{ opacity: 0, x: language === "ar" ? -20 : 20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, scale: .96 }} transition={{ duration: .5 }} className="absolute bottom-2 end-2 z-10 w-[min(78%,19rem)] rounded-xl border border-teal-200/25 bg-[#0c2632]/95 p-2.5 shadow-[0_18px_45px_rgba(0,0,0,.5)] backdrop-blur-xl"><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[8px] font-bold text-teal-100"><ArrowRightLeft size={12} />{t("transferTitle")}</span><span className="rounded-full bg-emerald-300/10 px-1.5 py-0.5 text-[7px] text-emerald-200">{t("transferLive")}</span></div><div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2"><div><p className="text-[7px] text-slate-400">{current.source} <ArrowDownLeft size={8} className="mx-0.5 inline" /> {current.destination}</p><p className="mt-1 truncate text-[8px] font-semibold text-white">{current.item}</p><p className="mt-0.5 text-[7px] text-amber-200">{current.expiry}</p></div><strong className="self-center rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1.5 text-[9px] text-teal-100">{current.quantity}</strong></div></motion.aside></AnimatePresence>
      </div>
    </DemoWindow>
  );
}

function PipelineWindow({ language }: { language: LandingLanguage }) {
  const t = useTranslations("landing.liveMockups.pipeline");
  const step = useAutoCycle(3);
  const columns = t.raw("columns") as string[];
  const cards = t.raw("cards") as Array<{ name: string; detail: string; badge: string }>;
  const sideCards = t.raw("supportCards") as string[];
  const movingCard = cards[step] ?? cards[0];
  return (
    <DemoWindow language={language} title={t("windowTitle")} step={step}>
      <div className="relative h-full rounded-xl border border-white/10 bg-[#0a192f]/85 p-3 sm:p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-teal-300/10 text-teal-100"><CalendarClock size={14} /></span><div><h3 className="text-[9px] font-bold text-white sm:text-[10px]">{t("boardTitle")}</h3><p className="text-[7px] text-slate-500">{t("boardSubtitle")}</p></div></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[7px] font-semibold text-emerald-200">{t("liveQueue")}</span></div>
        <LayoutGroup id={language === "ar" ? "pipeline-ar" : "pipeline-en"}>
          <div className="grid min-h-[11.75rem] grid-cols-3 gap-1.5 sm:gap-2">
            {columns.map((column, index) => <div key={column} className={`min-w-0 rounded-lg border p-1.5 transition-colors duration-500 sm:p-2 ${step === index ? "border-teal-300/30 bg-teal-300/[0.06]" : "border-white/[0.07] bg-white/[0.02]"}`}>
              <div className="flex min-h-8 items-start justify-between gap-1 border-b border-white/[0.07] pb-1.5"><span className="text-[7px] font-bold leading-3 text-slate-300 sm:text-[8px]">{column}</span><span className="grid size-4 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[7px] text-slate-400">{step === index ? "1" : "0"}</span></div>
              {step === index && <AnimatePresence mode="popLayout"><motion.article layoutId="pipeline-moving-card" initial={{ opacity: .35, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: .4 }} transition={{ type: "spring", stiffness: 280, damping: 24 }} className="mt-2 rounded-lg border border-teal-200/35 bg-[#102c38] p-2 shadow-[0_8px_22px_rgba(0,0,0,.25)]"><div className="flex items-start justify-between gap-1"><p className="text-[7px] font-bold leading-3 text-white sm:text-[8px]">{movingCard?.name}</p><Stethoscope size={10} className="shrink-0 text-teal-200" /></div><p className="mt-1 text-[6px] leading-3 text-slate-400 sm:text-[7px]">{movingCard?.detail}</p><span className="mt-1.5 inline-flex rounded-full bg-emerald-300/10 px-1.5 py-0.5 text-[6px] font-semibold text-emerald-200">{movingCard?.badge}</span></motion.article></AnimatePresence>}
              <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.025] p-1.5"><p className="text-[6px] font-semibold leading-3 text-slate-300 sm:text-[7px]">{sideCards[index]}</p><div className="mt-1 flex items-center gap-1 text-[6px] text-slate-500"><UserRound size={8} />{cards[(index + 1) % cards.length]?.name}</div></div>
            </div>)}
          </div>
        </LayoutGroup>
        <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .45 }} className="absolute bottom-2 end-2 inline-flex items-center gap-2 rounded-lg border border-violet-200/25 bg-[#241b3b]/95 px-2.5 py-2 shadow-lg backdrop-blur-xl"><span className="grid size-6 place-items-center rounded-md bg-violet-300/10 text-violet-200">{step === 1 ? <HeartPulse size={12} /> : <ClipboardCheck size={12} />}</span><span><strong className="block text-[7px] text-violet-100">{step === 1 ? t("sessionBadge") : t("recordBadge")}</strong><small className="mt-0.5 block text-[6px] text-violet-200/75">{step === 1 ? t("sessionDetail") : t("recordDetail")}</small></span><BadgeCheck size={12} className="text-emerald-200" /></motion.div></AnimatePresence>
      </div>
    </DemoWindow>
  );
}

function HrWindow({ language }: { language: LandingLanguage }) {
  const t = useTranslations("landing.liveMockups.hr");
  const step = useAutoCycle(4);
  const tabs = t.raw("tabs") as string[];
  const attendance = t.raw("attendanceRows") as Array<{ name: string; role: string; time: string; state: string }>;
  return (
    <DemoWindow language={language} title={t("windowTitle")} step={step}>
      <div className="grid h-full gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <nav aria-label={t("tabsLabel")} className="grid grid-cols-2 gap-1 sm:flex sm:flex-col">
          {tabs.map((tab, index) => { const Icon = [UsersRound, Clock3, Wallet, FileText][index]!; return <div key={tab} className={`flex min-h-9 items-center gap-1.5 rounded-lg border px-2 py-2 text-[7px] font-semibold transition-all duration-500 sm:min-h-10 sm:text-[8px] ${step === index ? "border-teal-300/45 bg-teal-300/15 text-teal-100 shadow-[0_0_20px_rgba(45,212,191,.10)]" : "border-white/[0.06] bg-white/[0.025] text-slate-400"}`}><Icon size={11} className="shrink-0" />{tab}</div>; })}
        </nav>
        <div className="relative min-h-[13.5rem] overflow-hidden rounded-xl border border-white/10 bg-[#0a192f]/85 p-3 pb-14">
          <div className="flex items-center justify-between gap-2"><h3 className="truncate text-[9px] font-bold text-white sm:text-[10px]">{tabs[step]}</h3><span className="text-[7px] text-teal-200">{t("currentMonth")}</span></div>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .45 }} className="mt-2">
              {step === 0 && <div className="space-y-1.5">{attendance.slice(0, 3).map((row, index) => <div key={row.name} className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 ${index === 0 ? "border-emerald-300/25 bg-emerald-300/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}><span className="min-w-0"><strong className="block truncate text-[8px] text-slate-200">{row.name}</strong><small className="text-[7px] text-slate-500">{row.role}</small></span><span className="shrink-0 text-end"><strong className="block text-[8px] text-teal-100">{row.time}</strong><small className="text-[7px] text-emerald-200">{row.state}</small></span></div>)}</div>}
              {step === 1 && <div className="rounded-xl border border-amber-200/25 bg-amber-200/[0.06] p-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-amber-200/10 text-amber-100"><Wallet size={15} /></span><div><strong className="block text-[9px] text-white">{t("advanceTitle")}</strong><small className="text-[7px] text-slate-400">{t("advanceDetail")}</small></div></div><div className="mt-3 flex items-end justify-between gap-2"><span className="text-[7px] text-slate-400">{t("deductFromPayroll")}</span><strong className="text-base font-black text-amber-100">{t("advanceAmount")}</strong></div></div>}
              {step === 2 && <div className="rounded-xl border border-emerald-200/25 bg-emerald-200/[0.06] p-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-emerald-200/10 text-emerald-100"><CircleDollarSign size={15} /></span><div><strong className="block text-[9px] text-white">{t("bonusTitle")}</strong><small className="text-[7px] text-slate-400">{t("bonusDetail")}</small></div></div><div className="mt-3 flex items-end justify-between gap-2"><span className="text-[7px] text-slate-400">{t("addedToPayroll")}</span><strong className="text-base font-black text-emerald-100">{t("bonusAmount")}</strong></div></div>}
              {step === 3 && <div className="rounded-xl border border-teal-200/30 bg-[linear-gradient(135deg,rgba(13,148,136,.16),rgba(10,25,47,.95))] p-3"><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-[8px] font-bold text-teal-100"><FileText size={12} />{t("payslipTitle")}</span><span className="rounded-full bg-emerald-300/10 px-1.5 py-1 text-[6px] font-bold text-emerald-200">{t("paymentReady")}</span></div><div className="mt-2 border-t border-white/10 pt-2"><div className="flex items-center justify-between text-[7px] text-slate-400"><span>{t("basicSalary")}</span><span>{t("basicSalaryAmount")}</span></div><div className="mt-1 flex items-center justify-between text-[7px] text-amber-200"><span>{t("advanceDeduction")}</span><span>{t("advanceAmount")}</span></div><div className="mt-1 flex items-center justify-between text-[7px] text-emerald-200"><span>{t("bonusTitle")}</span><span>+{t("bonusAmount")}</span></div><div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2"><strong className="text-[8px] text-white">{t("netPay")}</strong><strong className="text-lg font-black text-teal-100">{t("netPayAmount")}</strong></div></div></div>}
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-2 end-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/20 bg-[#0b2a2a]/95 px-2 py-1.5 text-[7px] font-semibold text-emerald-100 shadow-lg"><ShieldCheck size={10} />{t("securePayroll")}</div>
        </div>
      </div>
    </DemoWindow>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ShoppingCart }) {
  return <div className="min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.035] px-1.5 py-2 sm:px-2"><div className="flex items-center gap-1 text-[6px] leading-3 text-slate-500 sm:text-[7px]"><Icon size={9} className="shrink-0 text-teal-200" />{label}</div><p className="mt-1 truncate text-[9px] font-black text-white sm:text-[11px]">{value}</p></div>;
}

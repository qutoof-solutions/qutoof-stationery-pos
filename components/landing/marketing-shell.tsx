"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe2, Menu, X } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/brand";
import { BrandMark } from "@/components/brand/brand-mark";
import { useDataLocale } from "@/components/operations/data-portability-ui";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { WhatsAppWidget } from "@/components/landing/whatsapp-widget";

type MarketingShellProps = {
  children: React.ReactNode;
  surface?: "dark" | "light";
};

const navigation = [
  { href: "/", labelKey: "home" },
  { href: "/solutions", labelKey: "solutions" },
  { href: "/pricing", labelKey: "pricing" },
] as const;

const controlClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingShell({ children, surface = "dark" }: MarketingShellProps) {
  const pathname = usePathname() ?? "";
  const t = useTranslations("landing.nav");
  const { locale, setLocale } = useDataLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const languageLabel = t("language");
  const navigationLabel = t("mainNavigation");
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <>
    <div className={`marketing-shell ${surface === "light" ? "marketing-shell-light" : ""} min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50`}>
      <header className="marketing-header sticky top-0 z-40 border-b border-slate-300 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="marketing-brand inline-flex min-w-0 shrink-0 items-center gap-2.5 text-lg font-black tracking-tight text-slate-950 dark:text-white" aria-label={PRODUCT_NAME}>
            <BrandMark priority className="size-9 sm:size-10" />
            <span className="hidden truncate sm:inline">{PRODUCT_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label={navigationLabel}>
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-teal/10 text-teal" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"}`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex h-10 [&>button]:!h-10">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setLocale(nextLocale)}
              aria-label={languageLabel}
              title={languageLabel}
              className={controlClassName}
            >
              <Globe2 size={16} aria-hidden="true" />
              <span>{nextLocale.toUpperCase()}</span>
            </button>
            <Link href="/login" className={`${controlClassName} hidden border-teal-700 bg-teal text-white hover:border-teal-800 hover:bg-teal/90 dark:bg-teal dark:text-white sm:inline-flex`}>
              {t("login")}
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={isMenuOpen}
              aria-controls="marketing-mobile-menu"
              className={`${controlClassName} px-2 md:hidden`}
            >
              {isMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav id="marketing-mobile-menu" className="border-t border-slate-200/80 px-4 pb-4 pt-3 dark:border-slate-800/80 md:hidden" aria-label={navigationLabel}>
            <div className="mx-auto grid max-w-7xl gap-1 sm:px-2">
              {navigation.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-teal/10 text-teal" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"}`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-700 bg-teal px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800">
                {t("login")}
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white pb-28 dark:border-slate-800 dark:bg-slate-950 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-black tracking-tight text-slate-950 dark:text-white" aria-label={PRODUCT_NAME}>
                <BrandMark className="size-9" />
                <span>{PRODUCT_NAME}</span>
              </Link>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{t("trustDescription")}</p>
            </div>
            <nav className="flex flex-wrap items-center gap-1 md:justify-end" aria-label={t("footerNavigation")}>
              {[
                { href: "/", label: t("home") },
                { href: "/solutions", label: t("solutions") },
                { href: "/pricing", label: t("pricing") },
                { href: "/#faq", label: t("faq") },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p>{t("copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
    <WhatsAppWidget language={locale} hideOnScroll={false} />
    </>
  );
}

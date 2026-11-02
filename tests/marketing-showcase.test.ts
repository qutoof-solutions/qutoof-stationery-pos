import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

type LocaleMessages = {
  landing: {
    nav: { footerNavigation: string; trustDescription: string; copyright: string };
    posterAlts: { overview: string; hardware: string; expansion: string };
  } & {
    liveMockups: Record<string, unknown> & { banners: Record<string, unknown> };
    marketing: { why: { items: unknown[] } };
    pricing: { erpAreas: string[]; erpAreasNote: string };
  };
};

const arabic = JSON.parse(readFileSync("messages/ar.json", "utf8")) as LocaleMessages;
const english = JSON.parse(readFileSync("messages/en.json", "utf8")) as LocaleMessages;

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.length ? [shape(value[0])] : [];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, shape(child)]));
  }
  return typeof value;
}

test("four live desktop previews have structurally complete Arabic and English copy", () => {
  const ar = arabic.landing.liveMockups;
  const en = english.landing.liveMockups;
  assert.deepEqual(shape(ar), shape(en));
  for (const windowName of ["erp", "warehouse", "pipeline", "hr"]) {
    assert.ok(ar[windowName] && en[windowName], `missing ${windowName} preview`);
  }
  assert.equal((ar.erp as { navigation: string[] }).navigation.length, 4);
  assert.equal((ar.warehouse as { tiles: string[] }).tiles.length, 6);
  assert.equal((ar.pipeline as { columns: string[] }).columns.length, 3);
  assert.equal((ar.hr as { tabs: string[] }).tabs.length, 4);
  assert.match(JSON.stringify(ar), /Qutoof Business/);
  assert.match(JSON.stringify(en), /Qutoof Business/);
});

test("the page inserts all three promotional banners around the existing sections", () => {
  const source = readFileSync("components/landing/landing-page.tsx", "utf8");
  const top = source.indexOf("bannerCopy.top.title");
  const demo = source.indexOf("<LiveUiMockups language={language} />");
  const middle = source.indexOf("bannerCopy.middle.title");
  const why = source.indexOf("<WhyChooseUs language={language} />");
  const testimonials = source.indexOf("<TestimonialsSection language={language} />");
  const bottom = source.indexOf("bannerCopy.bottom.title");
  const faq = source.indexOf("<FaqSection language={language} />");
  assert.ok(top >= 0 && top < demo);
  assert.ok(middle >= 0 && middle < why);
  assert.ok(testimonials >= 0 && testimonials < bottom && bottom < faq);
  for (const preserved of ["<LiveDemoButton", "<InstallButton", "<InstallInstructions", "<ZReportPreview", "<TestimonialsSection", "<FaqSection", "<SectorExplorerDialog"]) {
    assert.ok(source.includes(preserved), `existing landing control/section was removed: ${preserved}`);
  }
});

test("live demo windows enforce locale direction and independent 2.5-second motion cycles", () => {
  const source = readFileSync("components/landing/live-ui-mockups.tsx", "utf8");
  assert.match(source, /const CYCLE_MS = 2500/);
  for (const component of ["ErpWindow", "WarehouseWindow", "PipelineWindow", "HrWindow"]) assert.ok(source.includes(`<${component} language={language} />`));
  assert.match(source, /lang=\{language\} dir=\{language === "ar" \? "rtl" : "ltr"\} translate="no"/);
  assert.match(source, /AnimatePresence/);
  assert.match(source, /layoutId="pipeline-moving-card"/);
});

test("poster images are extracted at full resolution and placed in the requested landing sections", () => {
  const source = readFileSync("components/landing/landing-page.tsx", "utf8");
  const hero = source.indexOf('src="/marketing/erp-overview.webp"');
  const heroHeadline = source.indexOf("<h1");
  const hardware = source.indexOf('posterSrc="/marketing/hardware-pos-ecosystem.webp"');
  const expansion = source.indexOf('posterSrc="/marketing/branch-expansion-map.webp"');
  const faq = source.indexOf("<FaqSection language={language} />");
  assert.ok(hero > 0 && hero < heroHeadline, "full-width ERP poster belongs before the hero headline");
  assert.ok(hardware > 0, "hardware poster belongs to the device-readiness banner");
  assert.ok(expansion > 0 && expansion < faq, "branch poster belongs in the growth banner before FAQ");
  const optimizedImages = ["public/marketing/erp-overview.webp", "public/marketing/hardware-pos-ecosystem.webp", "public/marketing/branch-expansion-map.webp"];
  let totalImageBytes = 0;
  for (const path of optimizedImages) {
    assert.ok(existsSync(path), `missing optimized landing asset: ${path}`);
    const bytes = readFileSync(path);
    totalImageBytes += bytes.byteLength;
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", `${path} must be a WebP file`);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", `${path} must be a WebP file`);
  }
  assert.ok(totalImageBytes < 650_000, `landing posters should remain below 650 KB combined; got ${totalImageBytes}`);
  assert.doesNotMatch(source, /erp-overview\.png|hardware-pos-ecosystem\.png|branch-expansion-map\.png/);
  assert.match(source, /<Image src=\{src\} alt=\{alt\} fill priority=\{priority\} unoptimized sizes=/);
  assert.match(source, /function FullBleedPoster/);
  assert.match(source, /aspect-video w-full/);
  assert.match(source, /sizes="100vw"/);
  assert.match(source, /className="landing-poster-frame relative isolate m-0 block aspect-video w-full overflow-hidden rounded-2xl border/);
  assert.match(source, /className="landing-poster-image absolute inset-1\.5 overflow-hidden rounded-/);
  const bannerComponent = source.slice(source.indexOf("function PromoBanner"), source.indexOf("function PromoBadges"));
  assert.match(bannerComponent, /<\/div>\s*<\/div>\s*\{posterSrc && posterAlt && <FullBleedPoster/);
  assert.match(source, /className="object-cover"/);
  assert.match(JSON.stringify(arabic.landing.posterAlts), /لوحة تحكم/);
  assert.match(JSON.stringify(english.landing.posterAlts), /dashboard/);
});

test("landing entrance motion is CSS-only and respects reduced-motion preferences", () => {
  const styles = readFileSync("app/globals.css", "utf8");
  assert.match(styles, /@keyframes landing-hero-enter/);
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\.landing-hero-actions[\s\S]*?\.landing-hero-promises/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.landing-hero-actions,[\s\S]*?animation: none !important;/);
  assert.doesNotMatch(styles, /@keyframes landing-poster-enter/);
});

test("pricing capability areas are informational and separate from live enabled plan features", () => {
  const source = readFileSync("components/landing/pricing-section.tsx", "utf8");
  assert.equal(arabic.landing.pricing.erpAreas.length, 3);
  assert.equal(english.landing.pricing.erpAreas.length, 3);
  assert.ok(arabic.landing.pricing.erpAreasNote.length > 0);
  assert.ok(english.landing.pricing.erpAreasNote.length > 0);
  assert.match(source, /Object\.entries\(plan\.features\)/);
  assert.match(source, /aria-label=\{t\("erpAreasTitle"\)\}/);
  assert.match(source, /t\("erpAreasNote"\)/);
  assert.match(source, /t\.raw\("erpAreas"\)/);
  assert.match(source, /featuresIncluded/);
});

test("marketing locale copy uses the canonical Qutoof Business brand name", () => {
  for (const messages of [arabic, english]) {
    const serialized = JSON.stringify(messages.landing);
    assert.doesNotMatch(serialized, /QUTOOF|Qutoof(?! Business)/);
  }
});

test("promo banners keep a fixed high-contrast dark gradient in light mode", () => {
  const source = readFileSync("components/landing/landing-page.tsx", "utf8");
  const styles = readFileSync("app/globals.css", "utf8");
  assert.match(source, /className="landing-promo-banner[^\"]*bg-gradient-to-b from-\[#0A192F\] to-\[#071318\][^\"]*text-white/);
  assert.match(source, /border border-teal-100\/30/);
  assert.match(source, /shadow-\[/);
  assert.match(styles, /\.landing-page \.landing-promo-banner \{[\s\S]*?background: linear-gradient\(180deg, #0a192f, #071318\) !important;/);
  assert.match(styles, /\.landing-promo-banner :is\(h1, h2, h3, h4, h5, h6, p, li, span, strong, em\)[\s\S]*?color: #ffffff !important;/);
  assert.match(source, /function PromoBadges[\s\S]*?text-white[\s\S]*?function PromoSteps[\s\S]*?text-white/);
});

test("poster frames and dark product previews retain contrast in light mode while light cards keep readable surfaces", () => {
  const styles = readFileSync("app/globals.css", "utf8");
  const liveUi = readFileSync("components/landing/live-ui-mockups.tsx", "utf8");
  const sections = readFileSync("components/landing/marketing-sections.tsx", "utf8");
  assert.match(styles, /\.landing-page \.landing-poster-frame \{[\s\S]*?background: linear-gradient\(135deg, #0a192f, #071318 58%, #064e3b\) !important;[\s\S]*?box-shadow:/);
  assert.match(styles, /\.landing-page \.landing-poster-frame::before/);
  assert.match(styles, /\.landing-page \.landing-poster-image \{[\s\S]*?background: #071318 !important;/);
  assert.match(styles, /\.landing-page \.landing-poster-frame \{[\s\S]*?color: #ffffff !important;/);
  assert.match(styles, /html:not\(\.dark\) \.marketing-shell-light \.landing-page \.live-mockup-window \{[\s\S]*?background: linear-gradient\(145deg, #071521, #102a3b\) !important;/);
  assert.match(styles, /\.live-mockup-window :is\(h1, h2, h3, h4, h5, h6, \.text-white\)[\s\S]*?color: #f8fafc !important;/);
  assert.match(styles, /\.live-mockup-window :is\(\.text-slate-100, \.text-slate-200, \.text-slate-300\)[\s\S]*?color: #cbd5e1 !important;/);
  assert.match(styles, /:is\(\.landing-z-report, \.landing-mockup-shell\) :is\(\.text-teal-100, \.text-teal-200\) \{ color: #99f6e4 !important;/);
  assert.match(styles, /html:not\(\.dark\) \.marketing-shell-light \.landing-page \.landing-hero-industries > \*[\s\S]*?border-color: #cbd5e1 !important;[\s\S]*?background: #ffffff !important;/);
  assert.match(liveUi, /className="live-mockup-window[^\"]*bg-\[#071318\][^\"]*text-slate-100/);
  assert.match(sections, /landing-feature-card[^\"]*border border-slate-200 bg-white[^\"]*dark:border-slate-700 dark:bg-slate-900/);
  assert.match(sections, /landing-testimonial-card[^\"]*border border-slate-200 bg-white[^\"]*dark:border-slate-700 dark:bg-slate-900/);
  assert.match(styles, /html:not\(\.dark\) \.marketing-shell-light \.landing-feature-card/);
  assert.match(styles, /html:not\(\.dark\) \.marketing-shell-light \.landing-testimonial-card/);
});

test("hero secondary actions and first two promo-card badges stay framed and readable in light mode", () => {
  const page = readFileSync("components/landing/landing-page.tsx", "utf8");
  const demo = readFileSync("components/landing/live-demo-button.tsx", "utf8");
  const install = readFileSync("components/landing/pwa-install.tsx", "utf8");
  const styles = readFileSync("app/globals.css", "utf8");
  assert.match(demo, /className="landing-hero-secondary-button[^\"]*rounded-full border/);
  assert.match(install, /variant === "hero" \? "landing-hero-secondary-button/);
  assert.match(page, /className="landing-promo-badge flex[^\"]*bg-\[#071318\][^\"]*text-white/);
  assert.match(page, /className="landing-promo-badge-number grid[^\"]*bg-\[#0b2a2a\][^\"]*text-white/);
  assert.match(styles, /\.landing-promo-banner \.landing-promo-badge \{[\s\S]*?background: #071318 !important;[\s\S]*?color: #ffffff !important;/);
  assert.match(styles, /\.landing-promo-banner \.landing-promo-badge-number \{[\s\S]*?background: #0b2a2a !important;[\s\S]*?color: #ffffff !important;/);
  assert.match(styles, /html:not\(\.dark\) \.marketing-shell-light \.landing-page \.landing-hero-actions \.landing-hero-secondary-button \{[\s\S]*?background: linear-gradient\(180deg, #ffffff, #f1f5f9\) !important;[\s\S]*?color: #0f172a !important;/);
  assert.match(styles, /landing-hero-secondary-button:hover:not\(:disabled\)/);
  assert.match(styles, /landing-hero-secondary-button:disabled/);
});

test("footer reserves safe space for the floating sales button and exposes bilingual quick links", () => {
  const shell = readFileSync("components/landing/marketing-shell.tsx", "utf8");
  const widget = readFileSync("components/landing/whatsapp-widget.tsx", "utf8");
  const page = readFileSync("components/landing/landing-page.tsx", "utf8");
  assert.match(shell, /<BrandMark className="size-9" \/>/);
  assert.match(shell, /href: "\/#faq"/);
  assert.match(shell, /t\("trustDescription"\)/);
  assert.match(shell, /t\("copyright"\)/);
  assert.match(shell, /pb-28 dark:border-slate-800 dark:bg-slate-950 sm:pb-32/);
  assert.match(widget, /fixed bottom-5 z-30/);
  assert.match(widget, /sm:bottom-10/);
  assert.match(page, /pb-32 text-white sm:pb-36/);
  for (const messages of [arabic, english]) {
    assert.ok(messages.landing.nav.footerNavigation.length > 0);
    assert.ok(messages.landing.nav.trustDescription.length > 0);
    assert.equal(messages.landing.nav.copyright, "© 2026 Qutoof Business. All rights reserved.");
  }
  assert.equal(arabic.landing.nav.trustDescription, "منظومة ERP متكاملة لإدارة المبيعات، المخازن، الحجوزات، وشؤون العاملين.");
});

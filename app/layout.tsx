import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QUTOOF Stationery POS",
  description: "نسخة ديمو محلية سريعة لإدارة الكاشير والمخزن والمبيعات اليومية",
  applicationName: "QUTOOF POS Demo",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className="dark"><body>{children}</body></html>;
}

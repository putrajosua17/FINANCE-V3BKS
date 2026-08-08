import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V3BKS FinanceFlow",
  description: "Dashboard keuangan V3BKS Mini Soccer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-ink-950 text-slate-200 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

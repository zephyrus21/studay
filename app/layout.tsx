import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import TzCookie from "@/components/TzCookie";
import { BottomNav } from "@/components/BottomNav";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studay",
  description: "Study progress tracker for MBBS students",
  appleWebApp: { capable: true, title: "studay" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF8F2" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1A1C" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}
        <BottomNav />
        <TzCookie />
      </body>
    </html>
  );
}

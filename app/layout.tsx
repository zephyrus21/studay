import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import TzCookie from "@/components/TzCookie";

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
  themeColor: "#FFF8F2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}
        <TzCookie />
      </body>
    </html>
  );
}

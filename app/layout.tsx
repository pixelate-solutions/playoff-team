import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "2025 NFL Playoff Fantasy Challenge",
  description: "Draft one player per playoff team and battle through every round.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-hero-gradient bg-fixed text-foreground`}>
        <div className="flex min-h-screen flex-col bg-grid">
          <SiteHeader />
          <main className="flex-1 pb-16 pt-6">{children}</main>
          <SiteFooter />
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

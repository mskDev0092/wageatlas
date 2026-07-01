import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WageAtlas — Global Minimum Wage & Cost-of-Living Explorer",
  description:
    "Explore real minimum-wage data, cost-of-living indexes, commodity baskets and consumption patterns across 18+ countries. Connect a local AI (LM Studio / Ollama) or any OpenAI-compatible API for live market analysis. Export to CSV or PDF.",
  keywords: [
    "minimum wage",
    "cost of living",
    "labour economics",
    "Numbeo",
    "ILO",
    "LM Studio",
    "Ollama",
    "market analysis",
  ],
  authors: [{ name: "WageAtlas" }],
  openGraph: {
    title: "WageAtlas — Global Minimum Wage Explorer",
    description:
      "Real minimum-wage data, cost-of-living indexes, commodity baskets and AI-powered market analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

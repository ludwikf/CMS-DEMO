import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import { inter } from "./fonts/fonts";
import SessionWrapper from "./contexts/SessionWrapper";
import { ThemeProvider } from "./components/theme-provider";

export const metadata: Metadata = {
  title: "Panel B2B — demo",
  description: "Demonstracyjny system zamówień B2B",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionWrapper>
      <html lang="pl" suppressHydrationWarning>
        <body className={`${inter.className} ${inter.className} antialiased`}>
          <Toaster />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </SessionWrapper>
  );
}

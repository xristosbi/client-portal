import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "greek"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Imperial Automations — Πύλη Πελατών",
    template: "%s | Imperial Automations",
  },
  description:
    "Η πύλη πελατών της Imperial Automations. Παρακολουθήστε τα έργα σας, τις πληρωμές και την επικοινωνία σας σε ένα σημείο.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

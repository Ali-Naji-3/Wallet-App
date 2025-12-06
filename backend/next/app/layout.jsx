import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RefineProvider from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FXWallet - Professional Multi-Currency Wallet",
  description: "Manage your multi-currency wallet with ease",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RefineProvider>
        {children}
          <Toaster />
        </RefineProvider>
      </body>
    </html>
  );
}

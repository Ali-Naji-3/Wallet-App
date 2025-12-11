import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RefineProvider from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional", // Faster - uses fallback immediately
  preload: false, // Disable preload to avoid warnings
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: false, // Disable to reduce font loading overhead
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional", // Faster - uses fallback immediately
  preload: false, // Disable preload to avoid warnings
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  adjustFontFallback: false, // Disable to reduce font loading overhead
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
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            toastOptions={{
              style: {
                zIndex: 9999,
              },
            }}
          />
        </RefineProvider>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FXWallet",
  description: "FXWallet Application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b p-4 mb-4">
          <div className="max-w-6xl mx-auto flex gap-4">
            <a href="/" className="font-bold">FXWallet</a>
            <a href="/about">About (SSG)</a>
            <a href="/fx-rates">FX Rates (ISR)</a>
            <a href="/fx-rates-swr">FX Rates (SWR)</a>
            <a href="/dashboard-ssr">Dashboard (SSR)</a>
            <a href="/dashboard-csr">Dashboard (CSR)</a>
            <a href="/dashboard-swr">Dashboard (SWR)</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

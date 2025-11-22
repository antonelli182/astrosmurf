import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inconsolata = Inconsolata({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Insight",
  description: "Interpretability for All",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inconsolata.variable} antialiased min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground`}
      >
        <div className="fixed inset-0 pointer-events-none z-[9999] scanline opacity-50 mix-blend-overlay"></div>
        <div className="fixed inset-0 pointer-events-none z-[9998] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astrosmurf",
  description: "Amplify Ideas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground`}
      >
        {/* Subtle space noise/texture overlay could go here if desired, but keeping it clean for now as per "no fluff" */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

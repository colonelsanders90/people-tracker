import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import "./globals.css";

// Geist Mono = RAiD's app-chrome mono (sidebar labels, breadcrumbs, table heads).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAiD Manpower Tracker",
  description: "Movement ledger for RAiDers — past, current, planned, candidate.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--raid-stone)] text-black">
        <Sidebar />
        <div className="md:ml-[220px] flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1280px] w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

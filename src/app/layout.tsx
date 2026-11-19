import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daily To-Do",
  description: "A simple daily to-do list",
};

export const viewport: Viewport = {
  themeColor: "#3d6df2",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "day" || saved === "night" ? saved : undefined; // undefined = follow the computer

  return (
    <html lang="en" data-theme={theme} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
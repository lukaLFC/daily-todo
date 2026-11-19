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

// the browser's top bar and bottom bar take the colour of the page background
export async function generateViewport(): Promise<Viewport> {
  const saved = (await cookies()).get("theme")?.value;
  if (saved === "night") return { themeColor: "#16181d", viewportFit: "cover"};
  if (saved === "day") return { themeColor: "#f6f5f1", viewportFit: "cover" };
  // no choice made yet: follow the phone's own setting
  return {
    viewportFit: "cover",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
      { media: "(prefers-color-scheme: dark)", color: "#16181d" },
    ],
  };
}
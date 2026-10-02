import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: siteConfig.fullName,
    template: `%s | ${siteConfig.name}`,
  },
  icons: {
    icon: "/headerlogo.png",
  },
  description: siteConfig.tagline,
  keywords: [
    "exam portal",
    "Lucky Tech Academy",
    "Kasganj",
    "online exam",
    "IT training",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning is added here to ignore attributes
    // injected into the html tag by browser extensions (like crxemulator)
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

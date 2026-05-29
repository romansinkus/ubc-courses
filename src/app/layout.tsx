import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UBC-Courses — Honest UBC course reviews",
    template: "%s · UBC-Courses",
  },
  applicationName: "UBC-Courses",
  description:
    "Find honest student reviews of UBC courses — difficulty, workload, would-take-again, professors, and syllabi — searchable by course code.",
  keywords: [
    "UBC course reviews",
    "UBC courses",
    "rate my course UBC",
    "UBC course difficulty",
    "UBC workload",
    "UBC syllabus",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "UBC-Courses",
    title: "UBC-Courses — Honest UBC course reviews",
    description:
      "Search UBC courses and read honest student reviews: difficulty, workload, would-take-again, professors, and syllabi.",
    url: "/",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "UBC-Courses — Honest UBC course reviews",
    description:
      "Honest student reviews of UBC courses — difficulty, workload, professors, and syllabi.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/ubc-courses-icon-2.png", type: "image/png" }],
    apple: [{ url: "/ubc-courses-icon-2.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

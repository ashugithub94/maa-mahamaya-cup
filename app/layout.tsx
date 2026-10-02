import type { Metadata } from "next";
import "./globals.css";
import { TOURNAMENT } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${TOURNAMENT.name} | ${TOURNAMENT.location}`,
  description: "Player registration for MAA MAHAMAYA CUP — KUMHARI, SEASON 01.",
  metadataBase: new URL(TOURNAMENT.siteUrl),
  openGraph: {
    title: "MAA MAHAMAYA CUP — KUMHARI",
    description: "Cricket Se Hi Dosti Hai. Player registrations are now open.",
    url: TOURNAMENT.siteUrl,
    siteName: "MAA MAHAMAYA CUP",
    type: "website",
    images: [{ url: "/poster.jpg", width: 1200, height: 630, alt: "MAA MAHAMAYA CUP poster" }]
  },
  twitter: { card: "summary_large_image", images: ["/poster.jpg"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

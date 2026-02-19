import { AuthProvider } from '@/hooks/useAuth';
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export const metadata: Metadata = {
  title: "Alert Scout | Premium Price & Property Tracking",
  description: "Track rental properties and product deals with precision. Get instant notifications when prices drop or new listings match your criteria. The intelligent monitoring solution for savvy shoppers.",
  keywords: ["price tracker", "property alerts", "rental monitoring", "deal finder", "price drop alerts"],
  authors: [{ name: "Alert Scout" }],
  creator: "Alert Scout",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://alertscout.app",
    siteName: "Alert Scout",
    title: "Alert Scout | Premium Price & Property Tracking",
    description: "Track rental properties and product deals with precision. Get instant notifications when prices drop or new listings match your criteria.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alert Scout | Premium Price & Property Tracking",
    description: "Track rental properties and product deals with precision. Get instant notifications when prices drop or new listings match your criteria.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

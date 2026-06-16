import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import WakeLock from "@/components/WakeLock";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Infoskjerm",
  description: "Kjøkken-infoskjerm",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Infoskjerm",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className={`${geist.className} bg-zinc-950 text-white antialiased`}>
        <WakeLock />
        {children}
      </body>
    </html>
  );
}

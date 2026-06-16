import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import WakeLock from "@/components/WakeLock";
import ThemeToggle from "@/components/ThemeToggle";
import { STORAGE_KEY, THEMES, DEFAULT_THEME } from "@/lib/theme";

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

const themeBootstrap = `
(function () {
  try {
    var t = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var allowed = ${JSON.stringify(THEMES)};
    if (allowed.indexOf(t) === -1) t = ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${geist.className} bg-bg text-text antialiased`}
        suppressHydrationWarning
      >
        <WakeLock />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}

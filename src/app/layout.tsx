import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { RevenueCatProvider } from "@/components/RevenueCatProvider";

export const metadata = {
  metadataBase: new URL('https://lingoforge.app'),
  alternates: {
    canonical: '/',
  },
  title: "LingoForge",
  description: "Survive. Speak. Belong. - Language learning for migrant workers",
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
    shortcut: '/icons/icon-192x192.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f1923" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LingoForge" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body>
        <FirebaseClientProvider>
          <RevenueCatProvider>
            <PWAInstallPrompt />
            {children}
          </RevenueCatProvider>
        </FirebaseClientProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </body>
    </html>
  );
}

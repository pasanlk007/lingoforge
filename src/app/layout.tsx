import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f1923" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LingoForge" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "LingoForge",
          "alternateName": "BhashaGuru",
          "url": "https://lingoforge.app",
          "logo": "https://lingoforge.app/icons/icon-512x512.png",
          "description": "Language learning platform for Asian migrant workers. Learn Romanian, German, French and 20+ languages in Sinhala, Hindi, Bengali, Urdu and Nepali.",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+94768680133",
            "contactType": "customer support",
            "availableLanguage": ["Sinhala", "English", "Hindi", "Bengali"]
          },
          "sameAs": [
            "https://bashaguru.com",
            "https://play.google.com/store/apps/details?id=com.lingoforge.app"
          ]
        })}}
      />
    </head>
      <body>
        <FirebaseClientProvider>
          <RevenueCatProvider>
            <PWAInstallPrompt />
            {children}
          </RevenueCatProvider>
        <BottomNav />
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

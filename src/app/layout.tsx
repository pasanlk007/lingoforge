"use client";
import { useEffect } from "react";
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CapacitorBackButton } from '@/components/CapacitorBackButton';

export const metadata: Metadata = {
  title: 'LingoForge',
  description: 'Master Any Language in 48 Weeks',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <script src="https://code.responsivevoice.org/responsivevoice.js?key=FREE"></script>
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <CapacitorBackButton />
        <Toaster />
      </body>
    </html>
  );
}

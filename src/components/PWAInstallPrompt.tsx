'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check platform
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const desktop = !/Mobi|Android/i.test(navigator.userAgent);
    setIsIOS(ios);
    setIsDesktop(desktop);

    // Android/Desktop install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS — show after delay if not dismissed
    if (ios) {
      const dismissed = localStorage.getItem('pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
        localStorage.setItem('pwa_dismissed', '1');
    }
  };

  if (!showPrompt || isInstalled) return null;
  
  let title;
  let icon;

  if (isIOS) {
    title = "App එක Install කරන්න 📱";
    icon = <Smartphone className="h-6 w-6 text-primary" />;
  } else if (isDesktop) {
    title = "💻 Install LingoForge App";
    icon = <Monitor className="h-6 w-6 text-primary" />;
  } else { // Android
    title = "📱 LingoForge App Install කරන්න";
    icon = <Smartphone className="h-6 w-6 text-primary" />;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="font-bold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">Survive. Speak. Belong.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isIOS ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tap the <strong>Share</strong> button in your Safari menu, then select
              <strong> "Add to Home Screen"</strong> to install the app.
            </p>
            <Button variant="outline" className="w-full text-xs" onClick={handleDismiss}>
              Got it
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs" onClick={handleDismiss}>
              Not Now
            </Button>
            <Button className="flex-1 text-xs" onClick={handleInstall}>
              <Download className="mr-2 h-3 w-3" />
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

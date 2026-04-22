'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InstallPromptCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the app is already running in standalone mode.
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Determine the platform.
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) && !(window as any).MSStream) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    // If we have a deferred prompt, use it. This is the best experience.
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // userChoice will resolve when the user responds to the prompt.
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA installation prompt');
          setIsInstalled(true); // Hide the card after successful installation
        } else {
          console.log('User dismissed the PWA installation prompt');
        }
        setDeferredPrompt(null); // The prompt can only be used once.
      });
      return;
    }

    // If no deferred prompt, show instructions via a toast notification.
    if (platform === 'ios') {
      toast({
        title: "Install on iPhone/iPad 📱",
        description: "Tap the Share button (□↑) at the bottom, then scroll down and tap 'Add to Home Screen'.",
        duration: 10000,
      });
    } else if (platform === 'android') {
       toast({
        title: "Install on Android 🤖",
        description: "Tap the 3-dot menu (⋮) in Chrome, then tap 'Add to Home Screen' or 'Install App'.",
        duration: 10000,
      });
    } else {
       toast({
        title: "Install on Desktop 💻",
        description: "Click the install icon (⊕ or a computer icon) in your browser's address bar, or find 'Install LingoForge' in your browser menu.",
        duration: 10000,
      });
    }
  };

  // Don't show the card if the app is already installed or the platform is unknown.
  if (isInstalled || platform === 'unknown') {
    return null;
  }
  
  const icon = {
      ios: <Smartphone />,
      android: <Smartphone />,
      desktop: <Monitor />,
      unknown: <Smartphone />
  }[platform];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          Install LingoForge App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Get the best experience by installing the app on your device for quick access.</p>
        <Button className="w-full" variant="outline" onClick={handleInstallClick}>
            <Download className="mr-2 h-4 w-4" /> Install App
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

export function InstallPromptCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) && !(window as any).MSStream) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    console.log("Platform:", platform, "Deferred:", !!deferredPrompt);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
      return;
    }

    if (platform === 'ios') {
      toast({
        title: "Install on iPhone/iPad 🍎",
        description: "1. Tap Share button □↑ at bottom  2. Tap 'Add to Home Screen'  3. Tap Add",
        duration: 12000,
      });
    } else if (platform === 'android') {
      toast({
        title: "Install on Android 🤖",
        description: "1. Tap ⋮ menu in Chrome  2. Tap 'Add to Home Screen' or 'Install App'",
        duration: 10000,
      });
    } else {
      toast({
        title: "Install on Desktop 💻",
        description: "Click the ⊕ install icon in your browser address bar, or Browser Menu → Install LingoForge",
        duration: 10000,
      });
    }
  };

  if (!mounted || isInstalled) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {platform === 'desktop' ? <Monitor className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
          Install LingoForge App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Get the best experience by installing the app on your device.</p>
        
        {platform === 'ios' && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
            <p>🍎 <strong className="text-foreground">iPhone/iPad:</strong></p>
            <p>1. Tap Share □↑ at bottom of Safari</p>
            <p>2. Scroll → tap "Add to Home Screen"</p>
            <p>3. Tap Add</p>
          </div>
        )}

        <Button className="w-full" onClick={handleInstallClick}>
          <Download className="mr-2 h-4 w-4" />
          {deferredPrompt ? 'Install App Now' : platform === 'ios' ? 'How to Install on iPhone' : 'Install App'}
        </Button>
      </CardContent>
    </Card>
  );
}

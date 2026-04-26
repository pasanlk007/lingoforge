'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function InstallPromptCard() {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlatform(detectPlatform());

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      router.push("/install");
    }
  };

  if (!mounted || installed) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          {platform === 'desktop' ? (
            <Monitor className="h-8 w-8 text-primary" />
          ) : (
            <Smartphone className="h-8 w-8 text-primary" />
          )}
          <div>
            <p className="font-bold">Install LingoForge</p>
            <p className="text-xs text-muted-foreground">
              {platform === 'ios' && '🍎 iPhone / iPad'}
              {platform === 'android' && '🤖 Android'}
              {platform === 'desktop' && '💻 Desktop'}
            </p>
          </div>
        </div>

        {showInstructions ? (
          <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
            {platform === 'ios' && (
              <>
                <p className="font-bold text-primary">Install on iPhone/iPad:</p>
                <p>1️⃣ Tap the <strong>Share</strong> button <span className="font-mono bg-muted px-1 rounded">□↑</span> at the bottom</p>
                <p>2️⃣ Scroll down → tap <strong>"Add to Home Screen"</strong></p>
                <p>3️⃣ Tap <strong>Add</strong> in top right</p>
              </>
            )}
            {platform === 'android' && (
              <>
                <p className="font-bold text-primary">Install on Android:</p>
                <p>1️⃣ Tap <strong>⋮ menu</strong> in Chrome</p>
                <p>2️⃣ Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></p>
              </>
            )}
             {platform === 'desktop' && (
              <>
                <p className="font-bold text-primary">Install on Desktop:</p>
                <p>1️⃣ Open in Chrome or Edge browser</p>
                <p>2️⃣ Click the <strong>⊕ Install</strong> icon in the address bar</p>
                <p>3️⃣ Click <strong>Install</strong></p>
              </>
            )}
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowInstructions(false)}>
              Got it ✓
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={handleInstallClick}>
            <Download className="mr-2 h-4 w-4" />
            {deferredPrompt ? 'Install Now — Free' : 'How to Install'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share, MoreVertical, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InstallPromptCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Detect platform
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
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else if (platform === 'ios') {
      toast({
        title: "Install on iPhone/iPad 📱",
        description: "Tap the Share button (□↑) at the bottom, then tap 'Add to Home Screen' and tap Add.",
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
        description: "Click the install icon (⊕) in your browser's address bar, or use browser menu → Install LingoForge.",
        duration: 10000,
      });
    }
  };

  if (isInstalled || platform === 'unknown') {
    return null;
  }
  
  const canPromptInstall = !!deferredPrompt;

  const instructions = {
    ios: <p className="text-xs text-muted-foreground">Tap <Share className="inline h-3 w-3" /> Share → <strong className="text-white">Add to Home Screen</strong>.</p>,
    android: <p className="text-xs text-muted-foreground">Tap <MoreVertical className="inline h-3 w-3" /> Menu → <strong className="text-white">Add to Home Screen</strong>.</p>,
    desktop: <p className="text-xs text-muted-foreground">Click <Download className="inline h-3 w-3" /> in the address bar to install.</p>,
    unknown: null
  }

  const icon = {
      ios: <Smartphone />,
      android: <Smartphone />,
      desktop: <Monitor />,
      unknown: <Smartphone />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon[platform]}
          Install LingoForge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Get the full app experience on your device for quick access.</p>
        {instructions[platform]}
        {(canPromptInstall || platform === 'ios') && (
            <Button className="w-full" onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4" /> Install App
            </Button>
        )}
      </CardContent>
    </Card>
  );
}

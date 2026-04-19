'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, MoreVertical } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|windows|linux/.test(ua)) return 'desktop';
  return 'unknown';
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    if (localStorage.getItem('pwa_dismissed')) return;

    setPlatform(detectPlatform());

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show for iOS after 3 seconds
    const p = detectPlatform();
    if (p === 'ios') {
      setTimeout(() => setShow(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-2xl">🌍</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-white text-sm">Install LingoForge</p>
              <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">FREE</span>
            </div>

            {platform === 'ios' && (
              <p className="text-xs text-slate-400 leading-relaxed">
                Tap <Share className="inline h-3 w-3" /> Share → <strong className="text-white">"Add to Home Screen"</strong>
              </p>
            )}
            {platform === 'android' && (
              <p className="text-xs text-slate-400 leading-relaxed">
                Tap <MoreVertical className="inline h-3 w-3" /> Menu → <strong className="text-white">"Add to Home Screen"</strong>
              </p>
            )}
            {platform === 'desktop' && (
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <Download className="inline h-3 w-3" /> in address bar to install
              </p>
            )}

            {(platform === 'android' || platform === 'desktop') && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="mt-2 w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Install Now
              </button>
            )}
          </div>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import Link from 'next/link';

type Platform = 'ios' | 'android' | 'desktop-mac' | 'desktop-win';

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'desktop-mac';
  return 'desktop-win';
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detect());
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Languages className="h-10 w-10 text-cyan-400" />
            <span className="text-3xl font-black">LingoForge</span>
          </div>
          <p className="text-slate-400 text-sm">Survive. Speak. Belong.</p>
        </div>

        {installed ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-xl font-bold">App Installed!</p>
            <Link href="/dashboard" className="block w-full py-3 rounded-xl bg-cyan-500 text-white font-bold text-center">Open LingoForge</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-1 bg-slate-800 rounded-xl p-1">
              {(['android','ios','desktop-win','desktop-mac'] as Platform[]).map(p => (
                <button key={p} onClick={() => setPlatform(p)} className={`py-2 rounded-lg text-lg transition-all ${platform===p?'bg-cyan-500':'text-slate-400'}`}>
                  {p==='android'?'🤖':p==='ios'?'🍎':p==='desktop-win'?'🪟':'🍏'}
                </button>
              ))}
            </div>

            {platform === 'android' && (
              <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
                <p className="font-bold text-lg">🤖 Android</p>
                {deferredPrompt ? (
                  <button onClick={handleInstall} className="w-full py-4 rounded-xl bg-green-500 text-white font-black text-lg">Install Now — Free</button>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-400">Open in Chrome browser</p>
                    <p>1 Tap menu at top right</p>
                    <p>2 Tap Add to Home Screen</p>
                    <p>3 Tap Install</p>
                  </div>
                )}
              </div>
            )}

            {platform === 'ios' && (
              <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
                <p className="font-bold text-lg">🍎 iPhone / iPad</p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 text-xs">Must use Safari browser</div>
                <div className="space-y-2 text-sm">
                  <p>1 Tap Share button at bottom</p>
                  <p>2 Tap Add to Home Screen</p>
                  <p>3 Tap Add</p>
                </div>
              </div>
            )}

            {platform === 'desktop-win' && (
              <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
                <p className="font-bold text-lg">🪟 Windows</p>
                {deferredPrompt ? (
                  <button onClick={handleInstall} className="w-full py-3 rounded-xl bg-green-500 text-white font-black">Install Now</button>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p>1 Open in Chrome or Edge</p>
                    <p>2 Click install icon in address bar</p>
                    <p>3 Click Install</p>
                  </div>
                )}
              </div>
            )}

            {platform === 'desktop-mac' && (
              <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
                <p className="font-bold text-lg">🍏 Mac</p>
                {deferredPrompt ? (
                  <button onClick={handleInstall} className="w-full py-3 rounded-xl bg-green-500 text-white font-black">Install Now</button>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p>1 Open in Chrome</p>
                    <p>2 Click install icon in address bar</p>
                    <p>3 Click Install LingoForge</p>
                  </div>
                )}
              </div>
            )}

            <Link href="/dashboard" className="block text-center text-xs text-slate-500 hover:text-slate-300">Skip — Continue in browser</Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TARGET_LANGUAGES } from "@/lib/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";

function FloatingFlag({ flag, className }: { flag: string; className: string }) {
  return (
    <div className={`absolute select-none text-4xl md:text-5xl opacity-20 ${className}`}>
      <div className="rounded-full bg-card/50 p-3 shadow-lg backdrop-blur-sm">
        {flag}
      </div>
    </div>
  );
}

export function LandingHero() {
  const [targetLanguage, setTargetLanguage] = useState(TARGET_LANGUAGES[0].name);
  const router = useRouter();

  const handleStart = () => {
    // In a real app, this would update user context/state
    // For now, it navigates to the dashboard
    router.push('/dashboard');
  }

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-background via-blue-950/40 to-purple-950/60 py-24 sm:py-32 md:py-40">
       <div className="absolute inset-0">
          <FloatingFlag flag="🇫🇷" className="top-[10%] left-[5%] float-1" />
          <FloatingFlag flag="🇯🇵" className="top-[20%] right-[10%] float-2" />
          <FloatingFlag flag="🇪🇸" className="bottom-[15%] left-[15%] float-3" />
          <FloatingFlag flag="🇩🇪" className="bottom-[25%] right-[20%] float-4" />
          <FloatingFlag flag="🇰🇷" className="top-[50%] left-[25%] float-5" />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="font-headline text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Master Any Language in 48 Weeks
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl">
          AI-powered lessons. Real conversations. Zero fluff.
        </p>

        <div className="mx-auto mt-8 max-w-xl">
          <LanguageSelector onLanguageChange={setTargetLanguage} />
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
            Start Free Today
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View All Languages
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>17 Languages Available</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3">
                {TARGET_LANGUAGES.map((lang) => (
                  <div key={lang.code} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}

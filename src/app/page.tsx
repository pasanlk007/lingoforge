'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Languages, 
  ChevronDown, 
  ChevronRight,
  Globe, 
  PlaneTakeoff, 
  Home, 
  Briefcase, 
  MessageSquare, 
  Award,
  HeartHandshake,
  Stethoscope,
  Landmark,
  Bus,
  Sparkles,
  Volume2,
  BookOpen,
  Pencil,
  Flame,
  BarChart,
  BadgeCheck,
  Twitter,
  Github,
  Linkedin,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { translations, targetLanguages, nativeLanguages } from "@/lib/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LandingPage() {
  const [displayLanguage, setDisplayLanguage] = useState('English');
  const [isMounted, setIsMounted] = useState(false);
  const [showLangGuide, setShowLangGuide] = useState(false);
  const [isFbBrowser, setIsFbBrowser] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); setDeferredPrompt(null); }
  };

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('Instagram')) {
      setIsFbBrowser(true);
    }
  }, []);
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setDisplayLanguage(savedLang);
    }
    setIsMounted(true);
    
    // Logic for the language guide popup
    const langGuideDismissed = localStorage.getItem('langGuideDismissed');
    if (!langGuideDismissed) {
        const timer = setTimeout(() => {
            setShowLangGuide(true);
        }, 2500); // Show after 2.5 seconds
        return () => clearTimeout(timer);
    }
  }, []);
  
  const handleDismissLangGuide = () => {
    setShowLangGuide(false);
    localStorage.setItem('langGuideDismissed', 'true');
  };

  const handleStartJourney = () => {
    router.push('/login');
  }

  if (!isMounted) {
    return <div className="w-full min-h-screen bg-slate-900" />;
  }

  const t = translations[displayLanguage as keyof typeof translations] || translations.English;
  const isRTL = ['Urdu', 'Hebrew'].includes(displayLanguage);
  
  const availableNativeLangs = ['English', 'Sinhala', 'Hindi', 'Urdu', 'Bengali'];

  return (
    <div className={cn("bg-slate-900 text-white font-body")} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {isFbBrowser && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-2">🌍</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">LingoForge (භාෂා ගුරු)</h3>
            <p className="text-gray-600 text-xs mb-3">විදේශ රටක ජීවත් වන ශ්‍රී ලාංකිකයන් සඳහා භාෂා ඉගෙනීමේ app එකක්. රෝමේනියානු, ජර්මන්, ප්‍රංශ ඇතුළු භාෂා 21ක් සිංහලෙන් ඉගෙනගන්න.</p>
            <div className="text-left text-xs text-gray-700 mb-4 space-y-1">
              <p>✅ පළමු සතිය නොමිලේ</p>
              <p>✅ දිනකට මිනිත්තු 10යි</p>
              <p>✅ Survival, Alphabet, Numbers</p>
              <p>✅ AI powered lessons</p>
            </div>
            <p className="text-gray-700 text-xs font-medium mb-2">කරුණාකර Chrome හෝ Safari browser වෙතින් පිවිසෙන්න:</p>
            <div className="bg-gray-100 rounded-lg p-3 mb-3 flex items-center justify-between">
              <span className="text-gray-900 font-bold text-sm select-all">www.bashaguru.com</span>
              <button onClick={() => navigator.clipboard?.writeText('www.bashaguru.com').then(() => alert('✅ Copy වුණා!\n\nChrome browser open කරලා\nwww.bashaguru.com Google කරන්න 🔍'))} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg ml-2">
                Copy
              </button>
            </div>
            <button onClick={() => setIsFbBrowser(false)} className="w-full text-gray-400 text-xs py-2">
              skip
            </button>
          </div>
        </div>
      )}
      <nav className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Languages className="h-7 w-7 text-cyan-400" />
              <span className="font-headline text-2xl font-bold">LingoForge</span>
            </Link>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Globe className="h-5 w-5" />
                  <span>{displayLanguage}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                {nativeLanguages.filter(l => availableNativeLangs.includes(l)).map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onSelect={() => {
                      setDisplayLanguage(lang as keyof typeof translations);
                      localStorage.setItem("nativeLanguage", lang);
                    }}
                  >
                    {lang}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {showLangGuide && (
        <div className="fixed top-16 right-4 z-[100] w-72 rounded-lg bg-cyan-800/95 backdrop-blur-sm border border-cyan-600 p-4 shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="relative">
            <button onClick={handleDismissLangGuide} className="absolute -top-7 -right-7 rounded-full bg-slate-700 p-1 text-white hover:bg-slate-600 transition-colors">
                <XCircle className="h-5 w-5" />
            </button>
            <div className="absolute -top-7 right-12 h-0 w-0 border-x-8 border-x-transparent border-b-[12px] border-b-cyan-800"></div>
            <p className="text-base font-bold text-white">ඔබේ භාශාව තෝරන්න</p>
            <p className="mt-1 text-sm text-cyan-200">
                වෙබ් අඩවිය ඔබේ මව් භාෂාවෙන් බැලීමට පවතින භාෂා වලින් තෝරන්න.
            </p>
          </div>
        </div>
      )}

      <main>
        <section 
          className="relative w-full overflow-hidden flex items-center py-24 lg:min-h-screen lg:py-0"
          style={{
            background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)"
          }}
        >
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10"
               style={{background: "radial-gradient(circle, #60a5fa, transparent)"}} />
          <div className="absolute bottom-20 right-40 w-64 h-64 rounded-full opacity-10"
               style={{background: "radial-gradient(circle, #818cf8, transparent)"}} />

          <div className="container mx-auto px-6">
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="border-cyan-400/50 bg-cyan-900/30 text-cyan-300 mb-4">🌍 {targetLanguages.length} {t.languagesAvailable}</Badge>
              <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">{t.heroTitle}</h1>
              <p className="mt-4 max-w-xl mx-auto text-lg md:text-xl text-slate-300">{t.heroSub}</p>
              
              <div className="mt-8 flex flex-col items-center justify-center gap-4">
                  <Button size="lg" className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white font-bold" onClick={handleStartJourney}>{t.startBtn}</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:py-16 bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="relative rounded-xl border-2 border-green-500/80 bg-gradient-to-br from-green-900/30 to-slate-900 p-8 text-center shadow-2xl shadow-green-500/15">
              <div className="absolute -top-2 -left-2 h-8 w-8 border-t-2 border-l-2 border-green-500 rounded-tl-xl opacity-70"></div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 border-b-2 border-r-2 border-green-500 rounded-br-xl opacity-70"></div>

              <h2 className="text-xl md:text-2xl font-semibold leading-relaxed text-white">
                {t.poster.title}
              </h2>
              <p className="mt-4 text-lg text-green-300">
                {t.poster.subtitle}
              </p>
              <p className="mt-3 text-2xl font-bold uppercase tracking-widest text-green-400 font-headline">
                {t.poster.tagline}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-slate-900">
          <div className="container mx-auto px-4">
            <Card className="bg-slate-800/50 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl md:text-4xl font-bold">{t.journeyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-center text-xs sm:text-sm mb-12 px-2">
                  {[
                    { icon: <PlaneTakeoff/> },
                    { icon: <Home/> },
                    { icon: <Briefcase/> },
                    { icon: <MessageSquare/> },
                    { icon: <Award/> },
                  ].map((item, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center gap-2 w-1/5">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-cyan-900/50 border-2 border-cyan-500/50 text-cyan-400">
                          {React.cloneElement(item.icon, { className: 'w-6 h-6 sm:w-8 sm:h-8' })}
                        </div>
                      </div>
                      {index < 4 && <div className="flex-1 h-px bg-slate-600 hidden sm:block self-center"></div>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="text-center border-t border-slate-700 pt-12">
                    <h2 className="font-headline text-3xl font-bold text-white">{t.redesign_title}</h2>
                    <p className="mt-2 text-lg text-slate-300 max-w-2xl mx-auto">{t.redesign_subtitle}</p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                        <p className="font-semibold text-lg text-slate-200">{t.redesign_cta_text}</p>
                        <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold animate-pulse">
                            <Link href="/dashboard">
                                {t.redesign_cta_button} <ChevronRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.pricingTitle}</h2>
              <p className="text-lg text-slate-300 mt-2">{t.pricingSub}</p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
              <Card className="flex flex-col border-2 border-blue-500/50 bg-blue-950/20">
                <CardHeader>
                  <Badge className="w-fit bg-blue-500/20 text-blue-300 border border-blue-500/30">{t.weeklyPlan.badge}</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">{t.weeklyPlan.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{t.weeklyPlan.price_usd}</p>
                    <p className="font-semibold text-muted-foreground">{t.weeklyPlan.price_lkr}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-blue-500/30 text-sm">
                    <li>✅ {t.weeklyPlan.feat1}</li>
                    <li>✅ {t.weeklyPlan.feat2}</li>
                    <li>✅ {t.weeklyPlan.feat3}</li>
                  </ul>
                  {t.weeklyPlan.note && <p className="text-xs text-orange-400 p-2 bg-orange-500/10 rounded-md border border-dashed border-orange-500/30">⚠️ {t.weeklyPlan.note}</p>}
                </CardContent>
                <CardFooter className="flex-col gap-2 w-full">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="/pricing">Pay in USD</Link>
                  </Button>
                   <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">💳 Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
                  </div>
                   <p className="text-xs text-muted-foreground/70">Powered by Lemon Squeezy 🍋</p>
                </CardFooter>
              </Card>

              <Card className="flex flex-col border-2 border-green-500/50 bg-green-950/20">
                <CardHeader>
                  <Badge className="w-fit bg-green-500/20 text-green-300 border border-green-500/30">{t.completePlan.badge}</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">{t.completePlan.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{t.completePlan.price_usd}</p>
                    <p className="font-semibold text-muted-foreground">{t.completePlan.price_lkr}</p>
                  </div>
                    <ul className="space-y-2 pt-4 border-t border-green-500/30 text-sm">
                    <li>✅ {t.completePlan.feat1}</li>
                    <li>✅ {t.completePlan.feat2}</li>
                    <li>✅ {t.completePlan.feat3}</li>
                    <li>✅ {t.completePlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-2 w-full">
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href="/pricing">Pay in USD</Link>
                  </Button>
                   <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">💳 Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
                  </div>
                   <p className="text-xs text-muted-foreground/70">Powered by Lemon Squeezy 🍋</p>
                </CardFooter>
              </Card>

              <Card className="relative flex flex-col border-2 border-yellow-500/50 bg-yellow-950/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950">{t.lifetimePlan.badge}</Badge>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl pt-2">{t.lifetimePlan.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{t.lifetimePlan.price_usd}</p>
                    <p className="font-semibold text-muted-foreground">{t.lifetimePlan.price_lkr}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-yellow-500/30 text-sm">
                    <li>✅ {t.lifetimePlan.feat1}</li>
                    <li>✅ {t.lifetimePlan.feat2}</li>
                    <li>✅ {t.lifetimePlan.feat3}</li>
                    <li>✅ {t.lifetimePlan.feat4}</li>
                    {t.lifetimePlan.feat5 && <li>✅ {t.lifetimePlan.feat5}</li>}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-2 w-full">
                  <Button size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950" asChild>
                    <Link href="/pricing">Pay in USD</Link>
                  </Button>
                   <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">💳 Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
                  </div>
                   <p className="text-xs text-muted-foreground/70">Powered by Lemon Squeezy 🍋</p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-slate-900">
            <div className="container mx-auto px-4">
                 <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-8">
                    {[
                      { icon: <Sparkles/> },
                      { icon: <Volume2/> },
                      { icon: <MessageSquare/> },
                      { icon: <Pencil/> },
                      { icon: <Flame/> },
                      { icon: <BarChart/> },
                      { icon: <BadgeCheck/> },
                      { icon: <Globe/> }
                    ].map((feature, index) => (
                        <div key={index} className="flex justify-center">
                            <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 hover:bg-slate-700 transition-colors">
                               {React.cloneElement(feature.icon, { className: 'w-10 h-10'})}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </section>

        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Link href="/" className="flex items-center gap-2">
                  <Languages className="h-8 w-8 text-cyan-400" />
                  <span className="font-headline text-2xl font-bold">LingoForge</span>
                </Link>
                <p className="mt-2 text-slate-400">{t.footerTagline}</p>
                 <div className="mt-4 flex space-x-4">
                  <Link href="#" className="text-slate-400 hover:text-white"><Twitter /></Link>
                  <Link href="#" className="text-slate-400 hover:text-white"><Github /></Link>
                  <Link href="#" className="text-slate-400 hover:text-white"><Linkedin /></Link>
                </div>
              </div>
              <div>
                 <h4 className="font-semibold text-white tracking-wider uppercase">{t.footerLinks.company}</h4>
                  <ul className="mt-4 space-y-2">
                      <li><Link href="/paths" className="text-slate-400 hover:text-white">{t.footerLinks.paths}</Link></li>
                      <li><Link href="/pricing" className="text-slate-400 hover:text-white">{t.footerLinks.pricing}</Link></li>
                      <li><Link href="/privacy" className="text-slate-400 hover:text-white">{t.footerLinks.privacy}</Link></li>
                      <li><Link href="/terms" className="text-slate-400 hover:text-white">{t.footerLinks.terms}</Link></li>
                      <li><a href="mailto:support@lingoforge.app" className="text-slate-400 hover:text-white">Contact Us</a></li>
                  </ul>
              </div>
               <div>
                <h4 className="font-semibold text-white tracking-wider uppercase">{t.footerLinks.language}</h4>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 mt-4 bg-slate-800 border-slate-700">
                      <Globe className="h-5 w-5" />
                      <span>{displayLanguage}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                    {nativeLanguages.filter(l => availableNativeLangs.includes(l)).map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        onSelect={() => {
                          setDisplayLanguage(lang as keyof typeof translations);
                          localStorage.setItem("nativeLanguage", lang);
                        }}
                      >
                        {lang}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
              <p>{t.footerCredit}</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}


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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    router.push('/dashboard');
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl text-gray-900">
            <h3 className="text-xl font-bold mb-4">App එක Install කරන්න 📱</h3>
            <div className="space-y-3 text-left text-sm my-6 bg-slate-100 p-4 rounded-lg border border-slate-200">
              <p>1️⃣ පහළ ඇති link එක Copy කරන්න</p>
              <p>2️⃣ Chrome browser එක open කරන්න</p>
              <p>3️⃣ Copy කළ link එක paste කරලා යන්න</p>
              <p>4️⃣ Install කරන්න ✅</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => { navigator.clipboard?.writeText('https://lingoforge.app'); alert('Link copied! Chrome ෙදෙස් paste කරන්න 🔗'); }}
                className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-xl font-semibold"
              >
                🔗 Link Copy කරන්න
              </button>
              <button onClick={() => setIsFbBrowser(false)} className="w-full text-gray-500 text-sm py-2">
                දැනට skip කරන්න
              </button>
            </div>
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

      {/* Language Guide Popup */}
      {showLangGuide && (
        <div className="fixed top-16 right-4 z-[100] w-72 rounded-lg bg-cyan-800/95 backdrop-blur-sm border border-cyan-600 p-4 shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="relative">
            <button onClick={handleDismissLangGuide} className="absolute -top-7 -right-7 rounded-full bg-slate-700 p-1 text-white hover:bg-slate-600 transition-colors">
                <XCircle className="h-5 w-5" />
            </button>
            {/* Arrow pointing up-left to the dropdown */}
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
              
              <div className="mt-8 w-full max-w-md mx-auto space-y-4 rounded-lg bg-slate-800/50 p-6 border border-slate-700">
                 <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold" onClick={handleStartJourney}>{t.startBtn}</Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="lg" variant="outline" className="w-full border-slate-600 hover:bg-slate-700">{t.viewPaths}</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{targetLanguages.length} {t.languagesAvailable}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                          {targetLanguages.map((lang) => (
                            <div key={lang.lang} className="flex items-center gap-3 rounded-md p-2 hover:bg-slate-700">
                              <span className="text-3xl">{lang.flag}</span>
                              <div>
                                <p className="font-semibold">{lang.lang}</p>
                                <p className="text-xs text-slate-400">{lang.countries.join(', ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                 </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Survival Bundle */}
              <Card className="flex flex-col border-2 border-green-500 bg-gradient-to-br from-green-900/30 to-slate-900 shadow-lg shadow-green-500/10">
                <CardHeader>
                  <Badge className="w-fit bg-green-500 text-green-950 font-bold mb-2">FREE TO START</Badge>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🌱</span>
                    <div>
                      <CardTitle className="font-headline text-2xl font-bold">Survival Bundle</CardTitle>
                      <p className="text-sm text-slate-400 mt-1">මේ ඉගෙනීමේ මාර්ගය</p>
                    </div>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">Survive and open new opportunities.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-md bg-green-900/20">
                      <span className="text-xl">🌍</span>
                      <div>
                        <p className="font-semibold text-sm">Survival Language Lessons</p>
                        <p className="text-xs text-slate-400">12 weeks of essential daily phrases</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-green-900/20">
                      <span className="text-xl">🔢</span>
                      <div>
                        <p className="font-semibold text-sm">Number Learning</p>
                        <p className="text-xs text-slate-400">Time, money & transport numbers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-green-900/20">
                      <span className="text-xl">🔤</span>
                      <div>
                        <p className="font-semibold text-sm">Alphabet & Writing Practice</p>
                        <p className="text-xs text-slate-400">Learn the script from scratch</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-400 font-semibold text-center pt-2">⏱ 10 minutes per day</p>
                  </div>
                  <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white font-bold">
                    <Link href="/dashboard">{t.startFree}</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Path - Coming Soon */}
              <Card className="flex flex-col border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-slate-900 shadow-lg shadow-purple-500/10 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-purple-500 text-white font-bold">COMING SOON</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🏛️</span>
                    <div>
                      <CardTitle className="font-headline text-2xl font-bold">LingoForge Pro</CardTitle>
                      <p className="text-sm text-purple-400 mt-1">Citizenship & Integration Track</p>
                    </div>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">රටේ settle වෙන්න full preparation.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-md bg-purple-900/20">
                      <span className="text-xl">🛂</span>
                      <div>
                        <p className="font-semibold text-sm">Citizenship Preparation</p>
                        <p className="text-xs text-slate-400">Application process guidance</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-purple-900/20">
                      <span className="text-xl">📜</span>
                      <div>
                        <p className="font-semibold text-sm">Legal Framework</p>
                        <p className="text-xs text-slate-400">Rights, documents & procedures</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-purple-900/20">
                      <span className="text-xl">🎓</span>
                      <div>
                        <p className="font-semibold text-sm">Exam Preparation</p>
                        <p className="text-xs text-slate-400">Language & civic tests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-purple-900/20">
                      <span className="text-xl">✍️</span>
                      <div>
                        <p className="font-semibold text-sm">Grammar & Culture</p>
                        <p className="text-xs text-slate-400">Moderate level + daily AI lessons</p>
                      </div>
                    </div>
                  </div>
                  <Button disabled className="w-full bg-purple-500/50 text-white font-bold cursor-not-allowed">
                    🔒 Coming Soon
                  </Button>
                </CardContent>
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
        
        <section className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.pricingTitle}</h2>
              <p className="text-lg text-slate-300 mt-2">{t.pricingSub}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <Card className="flex flex-col bg-slate-800 border-slate-700 p-6">
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">{t.weeklyPlan.title}</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">{t.weeklyPlan.price}<span className="text-base font-medium text-slate-400">{t.weeklyPlan.per}</span></p>
                  <p className="text-sm text-slate-400 mt-1">{t.weeklyPlan.desc}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.weeklyPlan.feat1}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.weeklyPlan.feat2}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.weeklyPlan.feat3}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.weeklyPlan.feat4}</li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-slate-600 hover:bg-slate-700">
                    <Link href="/pricing">{t.getStarted}</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="relative flex flex-col bg-slate-800 border-2 border-yellow-500 p-6 shadow-lg shadow-yellow-500/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 font-bold">{t.lifetimePlan.badge}</Badge>
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">{t.lifetimePlan.title}</CardTitle>
                   <p className="text-4xl font-extrabold mt-2">{t.lifetimePlan.price}<span className="text-base font-medium text-slate-400">{t.lifetimePlan.per}</span></p>
                   <p className="text-sm font-semibold text-yellow-400">{t.lifetimePlan.desc}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.lifetimePlan.feat1}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.lifetimePlan.feat2}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.lifetimePlan.feat3}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.lifetimePlan.feat4}</li>
                  </ul>
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold">
                    <Link href="/pricing">{t.getStarted}</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-slate-800 border-2 border-cyan-500 p-6">
                <Badge variant="default" className="w-fit mb-4">{t.completePlan.badge}</Badge>
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">{t.completePlan.title}</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">{t.completePlan.price}<span className="text-base font-medium text-slate-400">{t.completePlan.per}</span></p>
                  <p className="text-sm text-slate-400 mt-1">{t.completePlan.desc}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.completePlan.feat1}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.completePlan.feat2}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.completePlan.feat3}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.completePlan.feat4}</li>
                  </ul>
                  <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
                    <Link href="/pricing">{t.getStarted}</Link>
                  </Button>
                </CardContent>
              </Card>
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

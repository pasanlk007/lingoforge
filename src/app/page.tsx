

'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Languages, 
  ChevronDown, 
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
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setDisplayLanguage(savedLang);
    }
    setIsMounted(true);
  }, []);
  
  const handleStartJourney = () => {
    router.push('/dashboard');
  }

  if (!isMounted) {
    return <div className="w-full min-h-screen bg-slate-900" />;
  }

  return (
    <div className={cn("bg-slate-900 text-white font-body")}>
      
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
                {nativeLanguages.map((lang) => (
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

      <main>
        <section 
          className="relative min-h-screen w-full overflow-hidden flex items-center"
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
              <Badge variant="outline" className="border-cyan-400/50 bg-cyan-900/30 text-cyan-300 mb-4">🌍 {targetLanguages.length} Languages Available</Badge>
              <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">Developing Language Skills for Migrant Workers</h1>
              <p className="mt-4 max-w-xl mx-auto text-lg md:text-xl text-slate-300">Structured language survival paths for migrant workers.</p>
              
              <div className="mt-8 w-full max-w-md mx-auto space-y-4 rounded-lg bg-slate-800/50 p-6 border border-slate-700">
                 <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold" onClick={handleStartJourney}>Start My Journey - Free</Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="lg" variant="outline" className="w-full border-slate-600 hover:bg-slate-700">View Available Languages</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{targetLanguages.length} Languages</DialogTitle>
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

        <section className="py-20 sm:py-24 bg-slate-900">
          <div className="container mx-auto px-4">
            <Card className="bg-slate-800/50 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl md:text-4xl font-bold">Your Journey Starts Here</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-center text-xs sm:text-sm mb-12 px-2">
                  {[
                    { icon: <PlaneTakeoff/>, label: "Leaving home" },
                    { icon: <Home/>, label: "Arriving" },
                    { icon: <Briefcase/>, label: "Working" },
                    { icon: <MessageSquare/>, label: "Speaking" },
                    { icon: <Award/>, label: "Belonging" },
                  ].map((item, index) => (
                    <React.Fragment key={item.label}>
                      <div className="flex flex-col items-center gap-2 w-1/5">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-cyan-900/50 border-2 border-cyan-500/50 text-cyan-400">
                          {React.cloneElement(item.icon, { className: 'w-6 h-6 sm:w-8 sm:h-8' })}
                        </div>
                        <p className="font-semibold">{item.label}</p>
                      </div>
                      {index < 4 && <div className="flex-1 h-px bg-slate-600 hidden sm:block"></div>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                   <Card className="bg-slate-800 border-slate-700">
                     <CardHeader>
                       <div className="mx-auto w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center text-red-400"><Stethoscope/></div>
                       <CardTitle>Emergency</CardTitle>
                       <CardDescription className="text-slate-400">Your child is sick. You need to explain symptoms to a doctor. Do you know the words?</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <Button variant="link" asChild className="text-cyan-400">
                            <Link href="/dashboard">Learn Medical Vocab</Link>
                        </Button>
                     </CardContent>
                   </Card>
                   <Card className="bg-slate-800 border-slate-700">
                     <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center text-green-400"><Landmark/></div>
                       <CardTitle>Bank & Money</CardTitle>
                       <CardDescription className="text-slate-400">You need to open a bank account. The form is in a foreign language. Can you fill it in?</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <Button variant="link" asChild className="text-cyan-400">
                            <Link href="/dashboard">Learn Numbers & Docs</Link>
                        </Button>
                     </CardContent>
                   </Card>
                   <Card className="bg-slate-800 border-slate-700">
                     <CardHeader>
                       <div className="mx-auto w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center text-yellow-400"><Bus/></div>
                       <CardTitle>Daily Life</CardTitle>
                       <CardDescription className="text-slate-400">You need to take the right bus to work. The driver speaks no English. Can you ask for help?</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <Button variant="link" asChild className="text-cyan-400">
                            <Link href="/dashboard">Learn Survival Phrases</Link>
                        </Button>
                     </CardContent>
                   </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="flex flex-col border-2 border-green-500 bg-gradient-to-br from-green-900/30 to-slate-900 shadow-lg shadow-green-500/10">
                <CardHeader>
                  <Badge className="w-fit bg-green-500 text-green-950 font-bold mb-2">START HERE - Recommended</Badge>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🌍</span>
                    <CardTitle className="font-headline text-2xl font-bold">Survival Path</CardTitle>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">Essential phrases to survive from day one in a new country.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">48 weeks • 7 days • 5 words/day</p>
                    <p className="mt-2 text-sm bg-green-900/40 p-2 rounded-md text-slate-300 font-mono">"Bonjour • Merci • S'il vous plaît"</p>
                  </div>
                  <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white font-bold">
                    <Link href="/dashboard">Start Free</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-gradient-to-br from-blue-900/30 to-slate-900 border border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🔤</span>
                    <CardTitle className="font-headline text-2xl font-bold">Alphabet Path</CardTitle>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">Read signs, menus and messages in the local language.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                   <div>
                      <p className="text-sm font-semibold text-slate-400">48 weeks • 7 days • 5 chars/day</p>
                      <p className="mt-2 text-sm bg-blue-900/40 p-2 rounded-md text-slate-300 font-mono">"A B C • あ い う • 가 나 다"</p>
                   </div>
                  <Button asChild variant="secondary" className="w-full bg-slate-700 hover:bg-slate-600">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-gradient-to-br from-purple-900/30 to-slate-900 border border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🔢</span>
                    <CardTitle className="font-headline text-2xl font-bold">Numbers Path</CardTitle>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">Handle money, time and numbers confidently every day.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">48 weeks • 7 days • 5 numbers/day</p>
                    <p className="mt-2 text-sm bg-purple-900/40 p-2 rounded-md text-slate-300 font-mono">"1 2 3 • Ein Zwei Drei • 一 二 三"</p>
                  </div>
                  <Button asChild variant="secondary" className="w-full bg-slate-700 hover:bg-slate-600">
                     <Link href="/dashboard">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-slate-900">
            <div className="container mx-auto px-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      { icon: <Sparkles/>, title: "AI-Powered", desc: "Real lessons generated for you" },
                      { icon: <Volume2/>, title: "Audio Built-in", desc: "Hear native pronunciation for every word" },
                      { icon: <MessageSquare/>, title: "Real Dialogues", desc: "Actual conversations you will use daily" },
                      { icon: <Pencil/>, title: "Daily Exercises", desc: "Fill blanks, MCQ, word matching games" },
                      { icon: <Flame/>, title: "Streak System", desc: "Stay motivated with daily streaks" },
                      { icon: <BarChart/>, title: "Progress Tracking", desc: "See how far you have come every week" },
                      { icon: <BadgeCheck/>, title: "Certificates", desc: "Earn proof of your progress" },
                      { icon: <Globe/>, title: "21 Languages", desc: "European, Asian, Middle Eastern" }
                    ].map(feature => (
                        <div key={feature.title} className="text-center">
                            <div className="mx-auto w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 mb-3">
                               {React.cloneElement(feature.icon, { className: 'w-6 h-6'})}
                            </div>
                            <h3 className="font-semibold text-white">{feature.title}</h3>
                            <p className="text-sm text-slate-400">{feature.desc}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </section>
        
        <section className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Simple Pricing</h2>
              <p className="text-lg text-slate-300 mt-2">Start free. Upgrade when ready.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <Card className="flex flex-col bg-slate-800 border-slate-700 p-6">
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">Free Forever</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">€0</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-400 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-green-500"/> Week 1, Day 1 only</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-green-500"/> 5 vocabulary words</li>
                    <li className="flex items-center gap-2 opacity-50"><XCircle className="w-5 h-5"/> No audio</li>
                    <li className="flex items-center gap-2 opacity-50"><XCircle className="w-5 h-5"/> No exercises</li>
                    <li className="flex items-center gap-2 opacity-50"><XCircle className="w-5 h-5"/> No AI guide</li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-slate-600 hover:bg-slate-700">
                    <Link href="/dashboard">Start Free - No Card Needed</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-slate-800 border-2 border-cyan-500 p-6">
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">Monthly</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">€9<span className="text-base font-medium text-slate-400">/month</span></p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> All 3 paths</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> All 48 weeks</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Audio pronunciation</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> All exercises</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> AI guide</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Progress certificates</li>
                  </ul>
                  <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="relative flex flex-col bg-slate-800 border-2 border-yellow-500 p-6 shadow-lg shadow-yellow-500/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 font-bold">⭐ Best Value</Badge>
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">Yearly</CardTitle>
                   <p className="text-4xl font-extrabold mt-2">€99<span className="text-base font-medium text-slate-400">/year</span></p>
                   <p className="text-sm font-semibold text-yellow-400">Save €9 vs monthly!</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Everything in Monthly</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Priority support</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Early access features</li>
                  </ul>
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold">
                    <Link href="/dashboard">Get Started</Link>
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
                <p className="mt-2 text-slate-400">Language survival for the modern migrant.</p>
                 <div className="mt-4 flex space-x-4">
                  <Link href="#" className="text-slate-400 hover:text-white"><Twitter /></Link>
                  <Link href="#" className="text-slate-400 hover:text-white"><Github /></Link>
                  <Link href="#" className="text-slate-400 hover:text-white"><Linkedin /></Link>
                </div>
              </div>
              <div>
                 <h4 className="font-semibold text-white tracking-wider uppercase">Company</h4>
                  <ul className="mt-4 space-y-2">
                      <li><Link href="/paths" className="text-slate-400 hover:text-white">Paths</Link></li>
                      <li><Link href="/pricing" className="text-slate-400 hover:text-white">Pricing</Link></li>
                      <li><Link href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</Link></li>
                      <li><Link href="/terms" className="text-slate-400 hover:text-white">Terms of Service</Link></li>
                  </ul>
              </div>
               <div>
                <h4 className="font-semibold text-white tracking-wider uppercase">Languages</h4>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 mt-4 bg-slate-800 border-slate-700">
                      <Globe className="h-5 w-5" />
                      <span>{displayLanguage}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                    {nativeLanguages.map((lang) => (
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
              <p>© 2026 LingoForge. Built for migrants, by people who understand the journey.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

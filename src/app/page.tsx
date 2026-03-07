'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Languages, Twitter, Github, Linkedin } from "lucide-react";
import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { LandingHero } from "@/components/LandingHero";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PATHS, TARGET_LANGUAGES } from "@/lib/constants";
import { LanguageSelector } from "@/components/LanguageSelector";
import type { TargetLanguage } from "@/lib/types";

export default function Home() {
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(TARGET_LANGUAGES[0].name);
  const router = useRouter();

  const handleStart = () => {
    // In a real app, this would update user context/state
    // and pass the selected language.
    router.push('/dashboard');
  }

  const survivalPath = PATHS.find(p => p.id === 'survival');

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <LandingHero />

        {/* The survival path section is now the main content of the landing page */}
        <section id="start" className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your Path to Fluency Starts Here
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              We focus on what matters most. The Survival Path is a 48-week journey designed to take you from beginner to confident speaker in real-world situations.
            </p>
            <div className="mt-16 flex justify-center">
              {survivalPath && (
                <Card className="w-full max-w-3xl overflow-hidden shadow-lg border-2 border-primary/50">
                  <CardHeader className="bg-muted/30">
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                      <span className="text-6xl">{survivalPath.icon}</span>
                      <div>
                        <CardTitle className="font-headline text-2xl font-bold">{survivalPath.title}</CardTitle>
                        <CardDescription>{survivalPath.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="mb-6 text-muted-foreground">
                      This is the ultimate course for travelers, expats, and anyone who wants to start speaking a new language quickly. You'll learn essential phrases for greetings, shopping, ordering food, asking for directions, and handling emergencies.
                    </p>
                    <ul className="mb-8 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                      {survivalPath.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-lg border bg-background/50 p-4">
                       <p className="mb-4 text-center font-medium">Ready to start? Pick your language and begin your journey!</p>
                       <LanguageSelector onLanguageChange={setTargetLanguage} />
                       <Button size="lg" className="mt-4 w-full" onClick={handleStart}>
                         Start Survival Path in {targetLanguage}
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

       <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <Languages className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-bold">LingoForge</span>
              </Link>
              <p className="mt-2 text-muted-foreground">
                AI-powered lessons. Real conversations. Zero fluff.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold">Product</h4>
                <ul className="mt-4 space-y-2">
                  <li><Link href="/paths" className="text-muted-foreground hover:text-foreground">Paths</Link></li>
                  <li><Link href="/paths#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                  <li><Link href="/paths#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Company</h4>
                <ul className="mt-4 space-y-2">
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
                </ul>
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Follow Us</h4>
              <div className="mt-4 flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Twitter /></Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Github /></Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Linkedin /></Link>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 LingoForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

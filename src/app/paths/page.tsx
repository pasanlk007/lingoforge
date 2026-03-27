'use client';

import Image from "next/image";
import {
  BrainCircuit,
  Languages,
  MessageCircle,
  Sparkles,
  Award,
  BarChart,
  Flame,
  Star,
  Twitter,
  Github,
  Linkedin,
  Check,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PATHS } from "@/lib/constants";
import { targetLanguages } from "@/lib/translations";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Lessons",
    description: "Dynamically generated lessons tailored to your progress.",
  },
  {
    icon: Languages,
    title: "Native Audio Pronunciation",
    description: "Hear how words are really spoken with free, native audio.",
  },
  {
    icon: MessageCircle,
    title: "Real Dialogues",
    description: "Practice conversations you'll actually have in real life.",
  },
  {
    icon: BrainCircuit,
    title: "Interactive Exercises",
    description: "Reinforce your learning with engaging and effective exercises.",
  },
  {
    icon: Flame,
    title: "Daily Streak System",
    description: "Stay motivated by building your learning streak every day.",
  },
  {
    icon: BarChart,
    title: "Progress Tracking",
    description: "Visualize your journey to fluency with detailed stats.",
  },
  {
    icon: Award,
    title: "Achievement Badges",
    description: "Earn badges for your milestones and show off your skills.",
  },
  {
    icon: Languages,
    title: `${targetLanguages.length} Languages Available`,
    description: "From French to Japanese, choose the language of your dreams.",
  },
];

const testimonials = [
  {
    id: "testimonial-1",
    name: "Anya Petrova",
    title: "Marketing Manager",
    nativeLanguage: "Russian",
    testimonial:
      "LingoForge is a game-changer. The AI-generated lessons are incredibly effective. I feel more confident speaking French after just a few weeks!",
    rating: 5,
  },
  {
    id: "testimonial-2",
    name: "Kenji Tanaka",
    title: "Software Engineer",
    nativeLanguage: "Japanese",
    testimonial:
      "As someone who struggles with traditional language apps, the structure and interactivity of LingoForge made all the difference. The 'Survival' path is so practical.",
    rating: 5,
  },
  {
    id: "testimonial-3",
    name: "Maria García",
    title: "University Student",
    nativeLanguage: "Spanish",
    testimonial:
      "I love the daily streak and XP system! It makes learning feel like a fun game, not a chore. The cultural notes are a fantastic touch.",
    rating: 5,
  },
];

export default function PathsPage() {
  const testimonialImages = PlaceHolderImages.filter((p) =>
    p.id.includes("testimonial")
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <section id="features" className="bg-card py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              A comprehensive toolkit for effective, engaging language
              learning.
            </p>
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-headline text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Flexible Plans for Every Learner</h2>
              <p className="text-lg text-slate-300 mt-2">Start free, then choose a plan that fits your journey.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <Card className="flex flex-col bg-slate-800 border-slate-700 p-6">
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">Single Language</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">$3.99<span className="text-base font-medium text-slate-400">/week</span></p>
                  <p className="text-sm text-slate-400 mt-1">Master one language. Renews weekly.</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Access to one chosen language</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> All 3 learning paths for that language</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> All interactive exercises & audio</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Cancel anytime</li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-slate-600 hover:bg-slate-700">
                    <Link href="/pricing">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="relative flex flex-col bg-slate-800 border-2 border-yellow-500 p-6 shadow-lg shadow-yellow-500/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 font-bold">⭐ BEST VALUE</Badge>
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">Survive Anywhere</CardTitle>
                   <p className="text-4xl font-extrabold mt-2">$99<span className="text-base font-medium text-slate-400">/one-time</span></p>
                   <p className="text-sm font-semibold text-yellow-400">One-time payment for lifetime access to ALL languages.</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Everything in Single Course</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Lifetime access to ALL current & future languages</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Priority Support</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> Become a polyglot!</li>
                  </ul>
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold">
                    <Link href="/pricing">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-slate-800 border-2 border-cyan-500 p-6">
                <Badge variant="default" className="w-fit mb-4">POPULAR</Badge>
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">Single Course</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">$39<span className="text-base font-medium text-slate-400">/one-time</span></p>
                  <p className="text-sm text-slate-400 mt-1">One-time payment for one full language course.</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Everything in Single Language</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Lifetime access to one language course</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Full 12-week curriculum</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> Email support</li>
                  </ul>
                  <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
                    <Link href="/pricing">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
             <div className="mt-12 text-center">
                <p className="font-semibold text-lg">Try Before You Buy</p>
                <p className="text-muted-foreground">
                  Access Week 1, Day 1 of the Survival Path for free. No credit card required.
                </p>
                <Button variant="link" asChild><Link href="/dashboard">Start Free Trial</Link></Button>
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-card py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Loved by Learners Worldwide
            </h2>
             <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial) => {
                const image = testimonialImages.find(img => img.id === testimonial.id);
                return (
                 <Card key={testimonial.id}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        {image && (
                          <Avatar>
                            <AvatarImage src={image.imageUrl} alt={testimonial.name} data-ai-hint={image.imageHint} />
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.title} ({testimonial.nativeLanguage})</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex mb-2">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-muted-foreground">"{testimonial.testimonial}"</p>
                    </CardContent>
                  </Card>
                )
              })}
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
                  <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Company</h4>
                <ul className="mt-4 space-y-2">
                  <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                  <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
                  <li><a href="mailto:support@lingoforge.app" className="text-muted-foreground hover:text-foreground">Contact</a></li>
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

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
} from "lucide-react";
import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { PathCard } from "@/components/PathCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PATHS } from "@/lib/constants";

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
    title: "17 Languages Available",
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
        <section id="paths" className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Choose Your Path to Fluency
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              We offer three unique learning paths to suit your goals. Start your journey today.
            </p>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {PATHS.map((path) => (
                <PathCard
                  key={path.id}
                  icon={path.icon}
                  title={path.title}
                  description={path.description}
                  details={path.details}
                />
              ))}
            </div>
          </div>
        </section>

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

        <section id="pricing" className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              Start for free, then unlock everything with one simple plan.
            </p>
            <div className="mt-16 flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-stretch">
              <Card className="w-full max-w-sm border-2 border-transparent">
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl">Monthly</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 text-center">
                  <p className="text-4xl font-bold">
                    €9<span className="text-lg font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All 3 Learning Paths</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All 48 weeks of content</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Native audio pronunciation</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AI Guide for questions</li>
                  </ul>
                  <Button size="lg" className="w-full">Get Started</Button>
                </CardContent>
              </Card>
              <Card className="relative w-full max-w-sm border-2 border-primary">
                 <Badge variant="default" className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">⭐ BEST VALUE</Badge>
                <CardHeader className="text-center">
                  <CardTitle className="font-headline text-2xl">Yearly</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 text-center">
                   <p className="text-4xl font-bold">
                    €99<span className="text-lg font-normal text-muted-foreground">/yr</span>
                  </p>
                  <p className="text-sm text-muted-foreground -mt-4">(Save €9!)</p>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All 3 Learning Paths</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All 48 weeks of content</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Native audio pronunciation</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AI Guide for questions</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
                  </ul>
                  <Button size="lg" className="w-full">Get Best Value</Button>
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

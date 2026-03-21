'use client';

import { useState, useEffect, Suspense } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { translations, targetLanguages as allTargetLangs } from '@/lib/translations';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Define the loading skeleton component
function PricingPageLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-full mt-4" />
            </div>
            <div className="mt-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
              {/* Card Skeleton */}
              <Card className="flex flex-col">
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                  <div className="space-y-3 pt-4 border-t">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </CardContent>
                <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
              </Card>
              {/* Card Skeleton (Featured) */}
              <Card className="flex flex-col border-2 border-primary">
                 <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <Skeleton className="h-10 w-1/3" />
                   <div className="space-y-3 pt-4 border-t">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </CardContent>
                <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
              </Card>
              {/* Card Skeleton */}
              <Card className="flex flex-col">
                 <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                   <div className="space-y-3 pt-4 border-t">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </CardContent>
                <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

interface StripePaymentButtonProps {
  paymentLinkUrl?: string;
  planName: string;
}

function StripePaymentButton({ paymentLinkUrl, planName }: StripePaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handlePayment = () => {
    setIsLoading(true);
    if (!user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    if (!paymentLinkUrl) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: `The payment link for the ${planName} plan is not set up.`,
      });
      setIsLoading(false);
      return;
    }

    // Append client_reference_id to the URL for the webhook to identify the user
    const finalUrl = `${paymentLinkUrl}?client_reference_id=${user.uid}`;
    window.location.href = finalUrl;
  };

  return (
    <Button size="lg" className="w-full" onClick={handlePayment} disabled={isLoading || !paymentLinkUrl}>
      {isLoading ? 'Redirecting...' : `Get ${planName}`}
    </Button>
  );
}


// All the original page logic moves into this component
function PricingPageContent() {
  const [displayLanguage, setDisplayLanguage] = useState('English');
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    const savedLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setDisplayLanguage(savedLang);
    }
    setIsMounted(true);
    
    if (searchParams.get('payment') === 'success') {
        toast({
            title: 'Payment Successful!',
            description: 'Your subscription has been activated. Welcome!',
            duration: 5000,
        });
        router.replace('/pricing'); // remove query params
    }
     if (searchParams.get('payment') === 'cancelled') {
        toast({
            variant: 'destructive',
            title: 'Payment Cancelled',
            description: 'Your payment process was cancelled. You can try again anytime.',
            duration: 5000,
        });
        router.replace('/pricing'); // remove query params
    }

  }, [searchParams, router, toast]);

  if (!isMounted || isUserLoading) {
    // Render loading state while waiting for client-side mount
    // to avoid hydration mismatch with server-rendered content.
    return <PricingPageLoading />;
  }
  
  const t = translations[displayLanguage as keyof typeof translations] || translations.English;
  const isRTL = ['Urdu', 'Hebrew'].includes(displayLanguage);
  
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const targetLanguageInfo = allTargetLangs.find(l => l.lang === targetLanguage);

  const LanguagePurchaseContext = () => {
    if (isProfileLoading) return <Skeleton className="h-12 w-full" />;
    if (!targetLanguageInfo) return null;

    return (
        <div className="my-4">
            <p className="text-sm font-semibold text-muted-foreground">{t.pricingPage.purchasingFor}</p>
            <div className="mt-2 flex items-center gap-3 rounded-md border bg-muted p-2">
                <span className="text-2xl">{targetLanguageInfo.flag}</span>
                <span className="font-bold">{targetLanguageInfo.lang}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t.pricingPage.changeLanguageNote}</p>
        </div>
    );
  };

  const weeklyPaymentLink = process.env.NEXT_PUBLIC_STRIPE_LINK_WEEKLY;
  const coursePaymentLink = process.env.NEXT_PUBLIC_STRIPE_LINK_COURSE;
  const lifetimePaymentLink = process.env.NEXT_PUBLIC_STRIPE_LINK_LIFETIME;

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      <main className="flex-1">
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t.pricingTitle}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t.pricingSub}
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
              {/* Weekly Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">{t.weeklyPlan.title}</CardTitle>
                  <CardDescription>{t.weeklyPlan.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <p className="text-4xl font-bold">
                    {t.weeklyPlan.price}<span className="text-lg font-normal text-muted-foreground">{t.weeklyPlan.per}</span>
                  </p>
                  <LanguagePurchaseContext />
                  <ul className="space-y-3 pt-4 border-t">
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat1}</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat2}</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat3}</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <StripePaymentButton paymentLinkUrl={weeklyPaymentLink} planName={t.weeklyPlan.title} />
                </CardFooter>
              </Card>

              {/* Lifetime Plan */}
              <Card className="relative flex flex-col border-2 border-primary shadow-2xl shadow-primary/20">
                <Badge variant="default" className="absolute -top-4 left-1/2 -translate-x-1/2">
                  {t.lifetimePlan.badge}
                </Badge>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">{t.lifetimePlan.title}</CardTitle>
                  <CardDescription>{t.lifetimePlan.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <p className="text-4xl font-bold">
                    {t.lifetimePlan.price}<span className="text-lg font-normal text-muted-foreground">{t.lifetimePlan.per}</span>
                  </p>
                  <ul className="space-y-3 pt-4 border-t">
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat1}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat2}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat3}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <StripePaymentButton paymentLinkUrl={lifetimePaymentLink} planName={t.lifetimePlan.title} />
                </CardFooter>
              </Card>

              {/* Single Course Plan */}
              <Card className="flex flex-col">
                 <CardHeader>
                  <Badge variant="secondary" className="w-fit">{t.completePlan.badge}</Badge>
                  <CardTitle className="font-headline text-2xl mt-2">{t.completePlan.title}</CardTitle>
                  <CardDescription>{t.completePlan.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                   <p className="text-4xl font-bold">
                    {t.completePlan.price}<span className="text-lg font-normal text-muted-foreground">{t.completePlan.per}</span>
                  </p>
                  <LanguagePurchaseContext />
                  <ul className="space-y-3 pt-4 border-t">
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat1}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat2}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat3}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter>
                   <StripePaymentButton paymentLinkUrl={coursePaymentLink} planName={t.completePlan.title} />
                </CardFooter>
              </Card>
            </div>

             <div className="mt-16 text-center">
                <h3 className="font-headline text-2xl font-bold">{t.freePlan.title}</h3>
                <p className="text-muted-foreground mt-2">{t.freePlan.description}</p>
                <ul className="mt-4 inline-flex flex-col sm:flex-row gap-x-4 gap-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {t.freePlan.feat1}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {t.freePlan.feat2}</li>
                </ul>
                <div className="mt-6">
                    <Button variant="outline" asChild>
                        <Link href="/signup">{t.freePlan.btn}</Link>
                    </Button>
                </div>
            </div>
            
            <div className="mt-16 text-center text-muted-foreground text-sm space-y-1">
                <p>Prices are in USD. Your payment provider will convert the currency for you.</p>
                <p>For any questions, please <a href="mailto:support@lingoforge.app" className="underline hover:text-foreground">contact support</a>.</p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}


// The main export for the page wraps the content in Suspense
export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageLoading />}>
      <PricingPageContent />
    </Suspense>
  );
}

    
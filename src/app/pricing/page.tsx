'use client';

import { useState, useEffect, Suspense } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { translations, targetLanguages as allTargetLangs } from '@/lib/translations';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const WEEKLY_BASE_URL = 'https://lingoforgeapp.lemonsqueezy.com/checkout/buy/0068ab57-f851-4e86-95a9-ebf9f3f812d6';
const LIFETIME_BASE_URL = 'https://lingoforgeapp.lemonsqueezy.com/checkout/buy/5686f0f9-4aac-4a0b-a08a-a5c2909113ff?discount=0';
const COURSE_BASE_URL = 'https://lingoforgeapp.lemonsqueezy.com/checkout/buy/4516cd05-1c2a-41fb-9219-13b7f189c58e';

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
              <Card className="flex flex-col"><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="flex-1 space-y-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-12 w-full" /></CardContent><CardFooter><Skeleton className="h-12 w-full" /></CardFooter></Card>
              <Card className="flex flex-col border-2 border-primary"><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="flex-1 space-y-6"><Skeleton className="h-10 w-1/3" /></CardContent><CardFooter><Skeleton className="h-12 w-full" /></CardFooter></Card>
              <Card className="flex flex-col"><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="flex-1 space-y-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-12 w-full" /></CardContent><CardFooter><Skeleton className="h-12 w-full" /></CardFooter></Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function PricingPageContent() {
  const [displayLanguage, setDisplayLanguage] = useState('English');
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    const savedLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedLang && translations[savedLang]) setDisplayLanguage(savedLang);
    setIsMounted(true);
  }, []);

  if (!isMounted || isUserLoading) return <PricingPageLoading />;

  const t = translations[displayLanguage as keyof typeof translations] || translations.English;
  const isRTL = ['Urdu', 'Hebrew'].includes(displayLanguage);
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  
  const langParam = encodeURIComponent(targetLanguage.toLowerCase());

  const handlePayhere = async (plan: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/payhere-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          language: targetLanguage.toLowerCase(),
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || '',
        }),
      });
      const data = await res.json();
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payhere.lk/pay/checkout';
      Object.entries(data).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('PayHere error:', error);
    }
  };

  const WEEKLY_URL = `${WEEKLY_BASE_URL}?checkout[custom][language]=${langParam}`;
  const COURSE_URL = `${COURSE_BASE_URL}?checkout[custom][language]=${langParam}`;
  const LIFETIME_URL = LIFETIME_BASE_URL;

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      <main className="flex-1">
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t.pricingTitle}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{t.pricingSub}</p>
            </div>

            <div className="mt-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
              {/* Weekly Plan */}
              <Card className="flex flex-col border-2 border-blue-500/50 bg-blue-950/20">
                <CardHeader>
                  <Badge className="w-fit bg-blue-500/20 text-blue-300 border border-blue-500/30">ජනප්‍රිය</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">සතිපතා සැලැස්ම</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-3xl font-bold">$3.99<span className="text-base font-normal text-muted-foreground">/සතිය</span></p>
                  <p className="font-semibold text-muted-foreground">LKR 1,200/සතිය</p>
                  <ul className="space-y-2 pt-4 border-t border-blue-500/30 text-sm">
                    <li className="flex items-center gap-2">✅ තෝරාගත් භාෂාව - සමාජ ජීවිතය (සති 12)</li>
                    <li className="flex items-center gap-2">✅ Alphabet සහ Numbers</li>
                    <li className="flex items-center gap-2">✅ Lessons unlock</li>
                  </ul>
                   <p className="text-xs text-orange-400 p-2 bg-orange-500/10 rounded-md border border-dashed border-orange-500/30">⚠️ සති 12 සම්පූර්ණ කළ පසු ගෙවීම් ස්වයංක්‍රීයව නවතී</p>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href={WEEKLY_URL} target="_blank">Pay in USD</Link>
                  </Button>
                  <div className="flex w-full items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">හෝ</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button onClick={() => handlePayhere('weekly')} className="w-full" variant="outline">
                    🇱🇰 LKR වලින් ගෙවන්න
                  </Button>
                </CardFooter>
              </Card>

              {/* Course Plan */}
              <Card className="flex flex-col border-2 border-green-500/50 bg-green-950/20">
                 <CardHeader>
                  <Badge className="w-fit bg-green-500/20 text-green-300 border border-green-500/30">වටිනාකම</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">සම්පූර්ණ පාඨමාලාව</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-3xl font-bold">$39<span className="text-base font-normal text-muted-foreground">/one-time</span></p>
                  <p className="font-semibold text-muted-foreground">LKR 11,700</p>
                   <ul className="space-y-2 pt-4 border-t border-green-500/30 text-sm">
                    <li className="flex items-center gap-2">✅ එක් භාෂාවක් - සම්පූර්ණ ප්‍රවේශය</li>
                    <li className="flex items-center gap-2">✅ unlock (sequential)</li>
                    <li className="flex items-center gap-2">✅ Alphabet, Numbers, Survival - සම්පූර්ණ</li>
                    <li className="flex items-center gap-2">✅ එකවර ගෙවීම - Lifetime access</li>
                    <li className="flex items-center gap-2">✅ කිසිදා expire නොවේ</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                   <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href={COURSE_URL} target="_blank">Pay in USD</Link>
                  </Button>
                  <div className="flex w-full items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">හෝ</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button onClick={() => handlePayhere('course')} className="w-full" variant="outline">
                    🇱🇰 LKR වලින් ගෙවන්න
                  </Button>
                </CardFooter>
              </Card>

               {/* Lifetime Plan */}
              <Card className="relative flex flex-col border-2 border-yellow-500/50 bg-yellow-950/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950">⭐ Best Value</Badge>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl pt-2">Lifetime Pro</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-3xl font-bold">$99<span className="text-base font-normal text-muted-foreground">/one-time</span></p>
                  <p className="font-semibold text-muted-foreground">LKR 29,700</p>
                  <ul className="space-y-2 pt-4 border-t border-yellow-500/30 text-sm">
                    <li className="flex items-center gap-2">✅ භාෂා 21 ක් සම්පූර්ණ ප්‍රවේශය</li>
                    <li className="flex items-center gap-2">✅ Survival, Alphabet, Numbers - සියලු භාෂා</li>
                    <li className="flex items-center gap-2">✅ Pro Path - පුරවැසිභාවය සඳහා</li>
                    <li className="flex items-center gap-2">✅ AI Quiz සහ advanced lessons</li>
                    <li className="flex items-center gap-2">✅ Future updates - නොමිලේ</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  <Button size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950" asChild>
                    <Link href={LIFETIME_URL} target="_blank">Pay in USD</Link>
                  </Button>
                  <div className="flex w-full items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">හෝ</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button onClick={() => handlePayhere('lifetime')} className="w-full" variant="outline">
                    🇱🇰 LKR වලින් ගෙවන්න
                  </Button>
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

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageLoading />}>
      <PricingPageContent />
    </Suspense>
  );
}

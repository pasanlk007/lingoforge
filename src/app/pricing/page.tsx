'use client';

import { useState, useEffect, Suspense } from 'react';
import { Check, Loader2 } from 'lucide-react';
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
import { initializeBilling, getProducts, purchase } from '@/lib/googlePlayBilling';
import type { Product } from '@capacitor-community/billing';
import { useToast } from '@/hooks/use-toast';

const WEEKLY_BASE_URL = 'https://lingoforgeapp.lemonsqueezy.com/checkout/buy/0068ab57-f851-4e86-95a9-ebf9f3f812d6';
const LIFETIME_BASE_URL = 'https://lingoforgeapp.lemonsqueezy.com/checkout/buy/5686f0f9-4aac-4a0b-a08a-a5c2909113ff?discount=0';
const COURSE_BASE_URL = 'https://lingoforgeapp.lemonsqueezy.com/checkout/buy/4516cd05-1c2a-41fb-9219-13b7f189c58e';

const SKUS = {
  weekly: 'lingoforge_weekly_sub',
  course: 'lingoforge_course_unlock',
  lifetime: 'lingoforge_lifetime_unlock',
};

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
  const isApp = typeof window !== 'undefined' && (
    !!(window as any).Capacitor?.isNativePlatform?.() ||
    window.location.search.includes('app=1') ||
    (navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android'))
  );

  const [displayLanguage, setDisplayLanguage] = useState('English');
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isBillingReady, setIsBillingReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  useEffect(() => {
    const savedLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedLang && translations[savedLang]) setDisplayLanguage(savedLang);
    setIsMounted(true);
    
    if (isApp) {
      const setupBilling = async () => {
        const ready = await initializeBilling();
        setIsBillingReady(ready);
        if (ready) {
          const fetchedProducts = await getProducts(Object.values(SKUS));
          setProducts(fetchedProducts);
        }
      };
      setupBilling();
    }
  }, [isApp]);


  if (!isMounted || isUserLoading || isProfileLoading) return <PricingPageLoading />;

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

  const handleGooglePurchase = async (sku: string) => {
    if (!isBillingReady || !user) {
      toast({ variant: "destructive", title: "Billing not ready", description: "Please wait a moment and try again." });
      return;
    }
    setIsPurchasing(sku);
    try {
      const purchaseResult = await purchase(sku, user.uid);
      if (purchaseResult?.isAcknowledged) {
        toast({ title: "Purchase successful!", description: "Your content will be unlocked shortly. You may need to restart the app." });
      } else {
        toast({ variant: "destructive", title: "Purchase failed or was cancelled." });
      }
    } catch (e: any) {
        toast({ variant: "destructive", title: "An error occurred", description: e.message });
    } finally {
      setIsPurchasing(null);
    }
  };


  const WEEKLY_URL = `${WEEKLY_BASE_URL}?checkout[custom][language]=${langParam}&checkout[email]=${user?.email || ''}&checkout[name]=${user?.displayName || ''}`;
  const COURSE_URL = `${COURSE_BASE_URL}?checkout[custom][language]=${langParam}&checkout[email]=${user?.email || ''}&checkout[name]=${user?.displayName || ''}`;
  const LIFETIME_URL = `${LIFETIME_BASE_URL}?checkout[email]=${user?.email || ''}&checkout[name]=${user?.displayName || ''}`;
  
  const GooglePlayButton = ({ sku, fallbackText }: { sku: string; fallbackText: string }) => {
    const product = products.find(p => p.sku === sku);
    
    if (!isBillingReady || products.length === 0) {
      return <Button disabled className="w-full"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Connecting...</Button>;
    }
  
    if (!product) {
      return <Button disabled className="w-full">{fallbackText} (Not Available)</Button>;
    }
  
    return (
      <Button
        className="w-full"
        size="lg"
        onClick={() => handleGooglePurchase(sku)}
        disabled={isPurchasing !== null}
      >
        {isPurchasing === sku ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</>
        ) : (
          `Subscribe with Google Play - ${product.price}`
        )}
      </Button>
    );
  };

  if (displayLanguage !== 'Sinhala') {
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
                 <div className="mt-16 text-center">
                    <p>Pricing information for other languages is not yet configured.</p>
                 </div>
              </div>
            </section>
          </main>
        </div>
      )
  }

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
              {/* Plan 1: Weekly */}
              <Card className="flex flex-col border-2 border-blue-500/50 bg-blue-950/20">
                <CardHeader>
                  <Badge className="w-fit bg-blue-500/20 text-blue-300 border border-blue-500/30">ජනප්‍රිය</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">සතිපතා සැලැස්ම</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">$2<span className="text-base font-normal text-muted-foreground">/සතිය</span></p>
                    <p className="font-semibold text-muted-foreground">LKR 600/සතිය</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-blue-500/30 text-sm">
                    <li>✅ තෝරාගත් භාෂාව - ව්‍යුහය (සති 12)</li>
                    <li>✅ Alphabet සහ Numbers -</li>
                    <li>✅ Lessons unlock</li>
                  </ul>
                  <p className="text-xs text-orange-400 p-2 bg-orange-500/10 rounded-md border border-dashed border-orange-500/30">⚠️ සති 12 සම්පූර්ණ කළ පසු ගෙවීම් ස්වයංක්‍රීයව නවතී</p>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  {isApp ? (
                    <GooglePlayButton sku={SKUS.weekly} fallbackText="Weekly Plan"/>
                  ) : (
                    <>
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
                    </>
                  )}
                </CardFooter>
              </Card>

              {/* Plan 2: Course */}
              <Card className="flex flex-col border-2 border-green-500/50 bg-green-950/20">
                 <CardHeader>
                  <Badge className="w-fit bg-green-500/20 text-green-300 border border-green-500/30">වටිනාකම</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">සම්පූර්ණ පාඨමාලාව</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">$39<span className="text-base font-normal text-muted-foreground">/one-time</span></p>
                    <p className="font-semibold text-muted-foreground">LKR 11,700</p>
                  </div>
                   <ul className="space-y-2 pt-4 border-t border-green-500/30 text-sm">
                    <li>✅ එක් භාෂාවක් - සම්පූර්ණ ප්‍රවේශය</li>
                    <li>✅  unlock (sequential)</li>
                    <li>✅ Alphabet, Numbers, Survival - සම්පූර්ණ</li>
                    <li>✅ එකවරක් - Lifetime access</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  {isApp ? (
                    <GooglePlayButton sku={SKUS.course} fallbackText="Course Plan"/>
                  ) : (
                     <>
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
                     </>
                  )}
                </CardFooter>
              </Card>

               {/* Plan 3: Lifetime */}
              <Card className="relative flex flex-col border-2 border-yellow-500/50 bg-yellow-950/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950">⭐ Best Value</Badge>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl pt-2">Lifetime Pro</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">$99<span className="text-base font-normal text-muted-foreground">/one-time</span></p>
                    <p className="font-semibold text-muted-foreground">LKR 29,700</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-yellow-500/30 text-sm">
                    <li>✅ භාෂා 21 ක් සම්පූර්ණ ප්‍රවේශය</li>
                    <li>✅ Survival, Alphabet, Numbers - සියලු භාෂා</li>
                    <li>✅ Pro Path - පුරවැසිභාවය සඳහා</li>
                    <li>✅ AI Quiz සහ advanced lessons</li>
                    <li>✅ Future updates - නොමිලේ</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  {isApp ? (
                    <GooglePlayButton sku={SKUS.lifetime} fallbackText="Lifetime Plan"/>
                  ) : (
                    <>
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
                    </>
                  )}
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

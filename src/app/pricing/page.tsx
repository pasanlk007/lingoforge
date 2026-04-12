'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { translations } from '@/lib/translations';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { initializeBilling, getProducts, purchase } from '@/lib/googlePlayBilling';
import type { PurchasesStoreProduct as Product } from '@revenuecat/purchases-capacitor';
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
  const { toast } = useToast();

  const [isAndroid, setIsAndroid] = useState(false);
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

    const setupPlatform = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const platform = await Capacitor.getPlatform();
          if (platform === 'android') {
            setIsAndroid(true);
            const ready = await initializeBilling();
            setIsBillingReady(ready);
            if (ready) {
              const fetchedProducts = await getProducts(Object.values(SKUS));
              setProducts(fetchedProducts);
            }
          }
        }
      } catch (e) {
        console.error("Error detecting platform or setting up billing", e);
      }
    };
    setupPlatform();
  }, []);

  if (!isMounted || isUserLoading || isProfileLoading) return <PricingPageLoading />;

  const t = translations[displayLanguage as keyof typeof translations] || translations.English;
  const isRTL = ['Urdu', 'Hebrew'].includes(displayLanguage);
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const langParam = encodeURIComponent(targetLanguage.toLowerCase());

  const handleGooglePurchase = async (sku: string) => {
    if (!isBillingReady || !user) {
      toast({ variant: "destructive", title: "Billing not ready", description: "Please wait a moment and try again." });
      return;
    }
    setIsPurchasing(sku);
    try {
      const purchaseResult = await purchase(sku, user.uid);
      if (purchaseResult?.isAcknowledged) {
        toast({ title: "Purchase successful!", description: "Your content will be unlocked shortly." });
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
    const product = products.find(p => p.identifier === sku);
    if (!isBillingReady) return <Button disabled className="w-full"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Connecting...</Button>;
    if (!product) return <Button disabled className="w-full">{fallbackText} (Not Available)</Button>;
    return (
      <Button className="w-full" size="lg" onClick={() => handleGooglePurchase(sku)} disabled={isPurchasing !== null}>
        {isPurchasing === sku ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : `Upgrade with Google Play - ${product.priceString}`}
      </Button>
    );
  };

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
              <Card className="flex flex-col border-2 border-blue-500/50 bg-blue-950/20">
                <CardHeader>
                  <Badge className="w-fit bg-blue-500/20 text-blue-300 border border-blue-500/30">{t.weeklyPlan?.badge}</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">{t.weeklyPlan?.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{t.weeklyPlan?.price_usd}</p>
                    <p className="font-semibold text-muted-foreground">{t.weeklyPlan?.price_lkr}</p>
                  </div>
                   <ul className="space-y-2 pt-4 border-t border-blue-500/30 text-sm">
                    {t.weeklyPlan.feat1 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.weeklyPlan.feat1}</li>}
                    {t.weeklyPlan.feat2 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.weeklyPlan.feat2}</li>}
                    {t.weeklyPlan.feat3 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.weeklyPlan.feat3}</li>}
                    {t.weeklyPlan.feat4 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.weeklyPlan.feat4}</li>}
                  </ul>
                  {t.weeklyPlan.note && <p className="text-xs text-orange-400 p-2 bg-orange-500/10 rounded-md border border-dashed border-orange-500/30">⚠️ {t.weeklyPlan.note}</p>}
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  {isAndroid ? <GooglePlayButton sku={SKUS.weekly} fallbackText="Weekly Plan"/> : (
                    <>
                      <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" asChild><Link href={WEEKLY_URL} target="_blank">Pay in USD</Link></Button>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">💳 Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
                      </div>
                    </>
                  )}
                </CardFooter>
              </Card>

              <Card className="flex flex-col border-2 border-green-500/50 bg-green-950/20">
                <CardHeader>
                  <Badge className="w-fit bg-green-500/20 text-green-300 border border-green-500/30">{t.completePlan?.badge}</Badge>
                  <CardTitle className="font-headline text-2xl pt-2">{t.completePlan?.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{t.completePlan?.price_usd}</p>
                    <p className="font-semibold text-muted-foreground">{t.completePlan?.price_lkr}</p>
                  </div>
                   <ul className="space-y-2 pt-4 border-t border-green-500/30 text-sm">
                    {t.completePlan.feat1 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.completePlan.feat1}</li>}
                    {t.completePlan.feat2 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.completePlan.feat2}</li>}
                    {t.completePlan.feat3 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.completePlan.feat3}</li>}
                    {t.completePlan.feat4 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.completePlan.feat4}</li>}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  {isAndroid ? <GooglePlayButton sku={SKUS.course} fallbackText="Course Plan"/> : (
                    <>
                      <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" asChild><Link href={COURSE_URL} target="_blank">Pay in USD</Link></Button>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">💳 Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
                      </div>
                    </>
                  )}
                </CardFooter>
              </Card>

              <Card className="relative flex flex-col border-2 border-yellow-500/50 bg-yellow-950/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950">{t.lifetimePlan?.badge}</Badge>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl pt-2">{t.lifetimePlan?.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{t.lifetimePlan?.price_usd}</p>
                    <p className="font-semibold text-muted-foreground">{t.lifetimePlan?.price_lkr}</p>
                  </div>
                   <ul className="space-y-2 pt-4 border-t border-yellow-500/30 text-sm">
                    {t.lifetimePlan.feat1 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.lifetimePlan.feat1}</li>}
                    {t.lifetimePlan.feat2 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.lifetimePlan.feat2}</li>}
                    {t.lifetimePlan.feat3 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.lifetimePlan.feat3}</li>}
                    {t.lifetimePlan.feat4 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.lifetimePlan.feat4}</li>}
                    {t.lifetimePlan.feat5 && <li><Check className="inline-block mr-2 h-4 w-4 text-green-500"/>{t.lifetimePlan.feat5}</li>}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3 w-full">
                  {isAndroid ? <GooglePlayButton sku={SKUS.lifetime} fallbackText="Lifetime Plan"/> : (
                    <>
                      <Button size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950" asChild><Link href={LIFETIME_URL} target="_blank">Pay in USD</Link></Button>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">💳 Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
                      </div>
                    </>
                  )}
                </CardFooter>
              </Card>
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

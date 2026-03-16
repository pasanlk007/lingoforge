'use client';

import { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { translations, nativeLanguages } from '@/lib/translations';

const GooglePayLogo = () => (
    <svg width="48" height="20" viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
        <path d="M3.16199 7.84211C3.16199 6.84211 3.38199 5.95211 3.79199 5.15211L2.14199 3.91211C1.38199 5.15211 1.00199 6.55211 1.00199 7.84211C1.00199 9.94211 1.76199 12.0021 3.03199 13.5921L4.54199 12.4321C3.68199 11.1421 3.16199 9.53211 3.16199 7.84211Z" fill="#EA4335"/>
        <path d="M3.7925 5.15211C4.5925 3.58211 5.9025 2.37211 7.4825 1.73211V3.68211C6.5825 4.14211 5.8625 4.86211 5.3825 5.75211L3.7925 5.15211Z" fill="#4285F4"/>
        <path d="M16.4827 7.7321C16.4827 5.0321 14.5427 2.8721 11.9827 2.4521V0.502099H9.8627V2.4521C7.3027 2.8721 5.3627 5.0321 5.3627 7.7321C5.3627 9.8721 6.7027 11.6621 8.6127 12.2821V9.4521C7.8127 9.0721 7.3027 8.4421 7.3027 7.7321C7.3027 6.4521 8.3527 5.4021 9.6227 5.4021H9.8627V10.0621H11.9827V5.4021H12.2227C13.4927 5.4021 14.5427 6.4521 14.5427 7.7321C14.5427 8.4421 14.0327 9.0721 13.2327 9.4521V12.2821C15.1427 11.6621 16.4827 9.8721 16.4827 7.7321Z" fill="#4285F4"/>
        <path d="M12.2218 13.9121L11.9818 14.9721V19.5021H9.8618V14.9721L9.6218 13.9121C6.8118 13.4421 4.5418 11.1421 3.6818 8.47211L2.1418 9.38211C3.3018 12.9221 6.3718 15.4821 9.8618 15.9021V17.8521H11.9818V15.9021C15.4718 15.4821 18.5418 12.9221 19.7018 9.38211L18.1618 8.47211C17.3018 11.1421 15.0318 13.4421 12.2218 13.9121Z" fill="#34A853"/>
        <g clipPath="url(#clip0_1001_2)">
        <path d="M43.3411 6.46875H45.1811L42.5811 12.8288H40.8011L41.3311 11.5188L38.4511 4H40.4211L42.0211 8.52875L43.3411 6.46875ZM40.9611 10.3888L41.8311 8.90875L42.1711 9.77875L40.9611 10.3888Z" fill="#5F6368"/>
        <path d="M30.0833 9.43875C30.0833 9.71875 30.0133 9.94875 29.8633 10.1288C29.7233 10.3088 29.5033 10.4388 29.2133 10.5088L29.3533 10.1588C29.4933 10.0288 29.5633 9.85875 29.5633 9.66875C29.5633 9.36875 29.3833 9.13875 29.0233 8.98875L28.7133 8.86875V8.83875C29.1133 8.71875 29.3633 8.42875 29.3633 7.99875C29.3633 7.42875 28.9433 7.02875 28.2933 7.02875H27.5333V10.6088H28.0233V9.33875C28.4033 9.33875 28.6933 9.38875 28.8733 9.49875L28.7533 9.87875C28.3233 9.72875 28.0233 9.68875 28.0233 9.49875V8.04875H28.2533C28.5833 8.04875 28.8233 8.16875 28.8233 8.50875C28.8233 8.74875 28.6933 8.90875 28.4433 9.00875L28.9233 10.1788C29.2833 10.0388 29.5433 9.78875 29.5433 9.42875H30.0833V9.43875Z" fill="#5F6368"/>
        <path d="M36.1955 8.96875C36.4655 8.96875 36.8055 9.01875 37.0355 9.12875V8.57875C36.8155 8.48875 36.5055 8.44875 36.2155 8.44875C35.4355 8.44875 34.8955 8.81875 34.8955 9.48875V10.6088H35.4355V9.58875C35.4355 9.18875 35.7055 8.96875 36.1955 8.96875Z" fill="#5F6368"/>
        <path d="M37.3784 4H31.9584V4.54H32.4984V12.8H33.0384V4.54H37.3784V4Z" fill="#5F6368"/>
        <path d="M25.7944 10.7288C25.5944 10.7288 25.4344 10.6188 25.4344 10.3988C25.4344 10.1788 25.5944 10.0688 25.7944 10.0688H26.5444V9.52875H25.7944C25.2244 9.52875 24.8944 9.85875 24.8944 10.3988C24.8944 10.9388 25.2244 11.2688 25.7944 11.2688H26.5444V11.8088H24.9644V12.7288H26.5444C27.1144 12.7288 27.4444 12.3988 27.4444 11.8588C27.4444 11.3188 27.1144 10.9888 26.5444 10.9888H25.7944C26.1644 10.9888 26.4744 11.1388 26.4744 11.4788C26.4744 11.7088 26.3144 11.8388 26.0944 11.8388H25.4344V11.2388H26.0944C26.3844 11.2388 26.5444 11.1188 26.5444 10.8788C26.5444 10.6388 26.3844 10.5188 26.0944 10.5188H25.4344V10.7288H25.7944Z" fill="#5F6368"/>
        <path d="M21.9961 4H20.0961L18.6161 8.91875L17.1561 4H15.2561L17.5861 10.6088H19.2661L21.9961 4Z" fill="#5F6368"/>
        </g>
        <defs>
        <clipPath id="clip0_1001_2">
        <rect width="28" height="16" fill="white" transform="translate(18)"/>
        </clipPath>
        </defs>
    </svg>
);

const ApplePayLogo = () => (
    <svg width="48" height="20" viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
        <path d="M22.1123 7.2312C22.1123 5.4912 23.4123 4.5412 25.1223 4.5412C26.8623 4.5412 27.9223 5.5212 28.6023 6.3312L27.4223 7.2012C26.9123 6.5712 26.1223 5.9212 25.1323 5.9212C24.1623 5.9212 23.4923 6.4612 23.4923 7.3012C23.4923 8.0312 24.0123 8.4412 25.2923 8.7912L25.9623 8.9912C27.6523 9.4812 28.3623 10.2012 28.3623 11.4512C28.3623 12.9812 26.9623 14.0012 25.1423 14.0012C23.2323 14.0012 22.0223 12.9712 21.2223 12.0612L22.4023 11.1912C22.9523 11.8912 23.8223 12.6212 25.1323 12.6212C26.1723 12.6212 26.9323 12.1112 26.9323 11.3512C26.9323 10.2212 25.2623 9.8312 24.1023 9.5312L23.4923 9.3812C22.5623 9.1512 22.1123 8.5212 22.1123 7.2312Z" fill="white"/>
        <path d="M34.2541 13.7912H32.0641L29.6941 4.78125H31.1341L32.4141 9.68125L33.6641 4.78125H35.0341L34.2541 13.7912Z" fill="white"/>
        <path d="M41.8355 4.78125H38.2555V13.7912H39.6055V9.45125L41.7755 13.7912H42.7355L40.5255 9.32125L42.8455 4.78125H41.8355Z" fill="white"/>
        <path d="M47.7812 4.78125H44.1312V13.7912H48V12.4112H45.5412V9.61125H47.6912V8.23125H45.5412V6.16125H47.7812V4.78125Z" fill="white"/>
        <path d="M12.9095 8.70117C12.9095 5.09117 10.3295 4.12117 8.32953 4.12117C6.31953 4.12117 4.15953 5.02117 4.15953 8.01117C4.15953 10.5912 5.68953 12.3012 8.35953 12.3012C9.40953 12.3012 10.6695 11.8312 11.4595 11.0812L10.5195 10.2312C9.91953 10.8212 9.01953 11.2012 8.28953 11.2012C6.67953 11.2012 5.56953 10.1212 5.56953 8.32117C5.56953 6.55117 6.88953 5.43117 8.33953 5.43117C9.84953 5.43117 10.4595 6.38117 11.4995 6.38117C11.8995 6.38117 12.2895 6.20117 12.9095 5.86117V8.70117Z" fill="white"/>
        <path d="M16.1432 10.3712C15.1132 11.6612 13.5632 12.4312 11.8132 12.4312C9.04324 12.4312 7.42324 10.7412 7.42324 8.23125C7.42324 5.75125 9.20324 4.12125 11.6732 4.12125C13.2532 4.12125 14.5432 4.80125 15.3432 5.81125L14.0732 6.58125C13.4832 5.83125 12.6332 5.24125 11.6832 5.24125C10.1532 5.24125 8.84324 6.42125 8.84324 8.22125C8.84324 10.0212 10.0832 11.3112 11.7832 11.3112C12.8732 11.3112 13.6732 10.8212 14.2132 10.1512L16.1432 10.3712Z" fill="white"/>
        <path d="M3.48389 5.3812C3.21389 4.9612 2.89389 4.5812 2.52389 4.2512C3.80389 2.8712 5.56389 2.0512 7.44389 2.0512C8.87389 2.0512 10.4239 2.6112 11.6439 3.7312C10.4539 2.5012 8.92389 1.8312 7.24389 1.8312C5.35389 1.8312 3.59389 2.6512 2.29389 4.0412C1.49389 2.8512 0.883887 1.4812 0.493887 0C-0.566113 2.9012 -0.066113 6.3012 1.84389 8.2912C2.70389 9.1812 3.78389 9.7712 4.97389 9.9812C5.03389 9.8712 5.08389 9.7712 5.13389 9.6612C4.54389 9.4712 4.02389 9.1712 3.58389 8.7612C2.63389 7.8212 2.76389 6.2712 3.48389 5.3812Z" fill="white"/>
    </svg>
);


export default function PricingPage() {
  const [displayLanguage, setDisplayLanguage] = useState('English');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setDisplayLanguage(savedLang);
    }
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="flex min-h-dvh flex-col bg-background" />;
  }
  
  const t = translations[displayLanguage as keyof typeof translations] || translations.English;
  const isRTL = ['Urdu', 'Hebrew'].includes(displayLanguage);

  const renderPaymentButtons = () => (
     <div className="flex flex-col gap-3">
       <Button size="lg" className="w-full" asChild>
          <Link href="#">Pay with Card</Link>
       </Button>
       <div className="flex w-full gap-3">
         <Button variant="secondary" className="w-full bg-black text-white hover:bg-gray-800" asChild>
            <Link href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer"><ApplePayLogo /></Link>
         </Button>
         <Button variant="secondary" className="w-full bg-white text-black hover:bg-gray-200" asChild>
            <Link href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"><GooglePayLogo /></Link>
         </Button>
       </div>
    </div>
  );

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
              {/* Single Language Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">{t.weeklyPlan.title}</CardTitle>
                  <CardDescription>{t.weeklyPlan.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <p className="text-4xl font-bold">
                    {t.weeklyPlan.price}<span className="text-lg font-normal text-muted-foreground">{t.weeklyPlan.per}</span>
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat1}</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat2}</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat3}</li>
                    <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.weeklyPlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  {renderPaymentButtons()}
                </CardFooter>
              </Card>

              {/* Survive Anywhere Plan */}
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
                  <ul className="space-y-3">
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat1}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat2}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat3}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.lifetimePlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                   {renderPaymentButtons()}
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
                  <ul className="space-y-3">
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat1}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat2}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat3}</li>
                     <li className="flex items-center gap-2 font-medium"><Check className="h-5 w-5 text-primary" /> {t.completePlan.feat4}</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                   {renderPaymentButtons()}
                </CardFooter>
              </Card>
            </div>

             <div className="mt-16 text-center">
                <h3 className="font-headline text-2xl font-bold">{t.freePlan.title}</h3>
                <p className="text-muted-foreground mt-2">{t.freePlan.description}</p>
                <ul className="mt-4 inline-flex gap-4 text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {t.freePlan.feat1}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {t.freePlan.feat2}</li>
                </ul>
                <div className="mt-6">
                    <Button variant="outline" asChild>
                        <Link href="/signup">{t.freePlan.btn}</Link>
                    </Button>
                </div>
            </div>
            
            <div className="mt-16 text-center text-muted-foreground text-sm">
                <p>Prices are in USD. Your payment provider will convert the currency for you.</p>
                <p>For any questions, please <Link href="#" className="underline hover:text-foreground">contact support</Link>.</p>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

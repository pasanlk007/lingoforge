"use client";

import Link from "next/link";
import { Languages, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { nativeLanguages, targetLanguages, translations } from "@/lib/translations";


function isNativeApp() {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.() ||
    window.location.search.includes('app=1') ||
    (navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android'));
}

export function Navigation() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  const [isMounted, setIsMounted] = useState(false);
  const [targetLanguageInfo, setTargetLanguageInfo] = useState<{lang: string; flag: string} | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;

    const savedTarget = localStorage.getItem("targetLanguage");
    const currentTargetLang = userProfile?.selectedLanguage || savedTarget;

    if (currentTargetLang) {
      const langInfo = targetLanguages.find(l => l.lang.toLowerCase() === currentTargetLang.toLowerCase());
      if (langInfo) {
        setTargetLanguageInfo({ lang: langInfo.lang, flag: langInfo.flag });
      }
    } else {
        setTargetLanguageInfo(null);
    }
  }, [isMounted, userProfile]);

  const nativeLanguage = (isMounted && (userProfile?.nativeLanguage || localStorage.getItem('nativeLanguage'))) || 'English';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].ui || translations.English.ui;
  const t_dashboard = translations[validNativeLanguage as keyof typeof translations].dashboard || translations.English.dashboard;

  const handleLogout = () => {
    if (!auth) return;
    auth.signOut();
  }

  const TargetLanguageDisplay = () => {
    if (!isMounted || !targetLanguageInfo) return null;
    
    return (
      <div className="flex items-center gap-2 rounded-full border bg-card p-1 pr-3" title={`Learning ${targetLanguageInfo.lang}`}>
         <span className="text-xl">{targetLanguageInfo.flag}</span>
         <span className="text-xs font-bold hidden sm:inline">{targetLanguageInfo.lang}</span>
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <Languages className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-black">LingoForge</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/paths"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.pathsAndFeatures}
          </Link>
           <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t_dashboard.title}
            </Link>
            <Link
              href="/pricing"
              style={{display: isNativeApp() ? 'none' : undefined}}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
        </nav>

        <div className="flex items-center gap-2">
          <TargetLanguageDisplay />
          
          <div className="hidden items-center gap-2 md:flex">
             {isUserLoading ? (
               <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
             ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t.profile}</Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                     <Link href="/dashboard">{t_dashboard.title}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t.logOut}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
             ) : (
              <>
                <Button variant="ghost" asChild><Link href="/login">{t.logIn}</Link></Button>
                <Button asChild><Link href="/signup">{t.signUp}</Link></Button>
              </>
             )}
          </div>

          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col gap-6">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                    <Languages className="h-8 w-8 text-primary" />
                    <span className="font-headline text-2xl font-bold">LingoForge</span>
                  </Link>
                  <nav className="flex flex-col gap-4">
                    <Button variant="outline" asChild>
                      <Link href="/paths" onClick={() => setMenuOpen(false)}>
                        {t.pathsAndFeatures}
                      </Link>
                    </Button>
                     <Button variant="outline" asChild>
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                        {t_dashboard.title}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/pricing" onClick={() => setMenuOpen(false)}>
                        Pricing
                      </Link>
                    </Button>
                  </nav>
                  <div className="mt-auto flex flex-col gap-2">
                     {isUserLoading ? (
                       <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                     ) : user ? (
                      <>
                        <Button asChild onClick={() => setMenuOpen(false)}><Link href="/profile">{t.profile}</Link></Button>
                        <Button variant="ghost" onClick={() => { handleLogout(); setMenuOpen(false); }}>{t.logOut}</Button>
                      </>
                     ) : (
                      <>
                        <Button variant="ghost" onClick={() => setMenuOpen(false)} asChild><Link href="/login">{t.logIn}</Link></Button>
                        <Button onClick={() => setMenuOpen(false)} asChild><Link href="/signup">{t.signUp}</Link></Button>
                      </>
                     )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

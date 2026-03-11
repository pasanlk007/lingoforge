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
import { nativeLanguages, translations } from "@/lib/translations";


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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nativeLanguage = (isMounted && (userProfile?.nativeLanguage || localStorage.getItem('nativeLanguage'))) || 'English';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].ui || translations.English.ui;
  const t_dashboard = translations[validNativeLanguage as keyof typeof translations].dashboard || translations.English.dashboard;

  const handleLogout = () => {
    if (!auth) return;
    auth.signOut();
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
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
        </nav>

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
                  <Link
                    href="/paths"
                    className="text-lg font-medium text-muted-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t.pathsAndFeatures}
                  </Link>
                   <Link
                      href="/dashboard"
                      className="text-lg font-medium text-muted-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t_dashboard.title}
                    </Link>
                    <Link
                      href="/pricing"
                      className="text-lg font-medium text-muted-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      Pricing
                    </Link>
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
    </header>
  );
}

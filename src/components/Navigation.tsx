"use client";

import Link from "next/link";
import { Languages, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navLinks = [
  { href: "/paths", label: "Paths & Features" },
];

export function Navigation() {
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <Languages className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-black">LingoForge</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
           <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost">Log In</Button>
          <Button>Sign Up</Button>
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
              <div className="flex flex-col gap-6 p-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                  <Languages className="h-8 w-8 text-primary" />
                  <span className="font-headline text-2xl font-bold">LingoForge</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-muted-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                   <Link
                      href="/dashboard"
                      className="text-lg font-medium text-muted-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => setMenuOpen(false)}>Log In</Button>
                  <Button onClick={() => setMenuOpen(false)}>Sign Up</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

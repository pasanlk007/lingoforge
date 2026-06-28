'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sprout, BookText, ListOrdered, Sparkles, User, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/survival', label: 'Survival', icon: Sprout },
  { href: '/alphabet', label: 'Alphabet', icon: BookText },
  { href: '/numbers', label: 'Numbers', icon: ListOrdered },
  { href: '/scenario/my-plans', label: 'Scenario', icon: Target },
  { href: '/pricing', label: 'Upgrade', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/go") return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="grid h-14 grid-cols-7">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold uppercase tracking-wider",
              pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary/80"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

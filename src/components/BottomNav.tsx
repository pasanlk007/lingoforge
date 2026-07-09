'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sprout,
  BookText,
  ListOrdered,
  Sparkles,
  User,
  Target,
  Map,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/survival', label: 'Survival', icon: Sprout },
  { href: '/alphabet', label: 'Alphabet', icon: BookText },
  { href: '/numbers', label: 'Numbers', icon: ListOrdered },
  { href: '/dashboard/lesson-map', label: 'Pro Map', icon: Map },
  { href: '/scenario/my-plans', label: 'Scenario', icon: Target },
  { href: '/pricing', label: 'Upgrade', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide navigation on landing pages
  if (pathname === '/' || pathname === '/go') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'flex items-center justify-center transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
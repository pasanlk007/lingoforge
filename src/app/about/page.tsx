import { Navigation } from '@/components/Navigation';
import Link from 'next/link';

export const metadata = {
  title: 'About LingoForge - Language Learning for Migrant Workers',
  description: 'LingoForge is a language learning platform designed for Asian migrant workers. Learn Romanian, German, French and 20+ languages.',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6 text-center">About LingoForge</h1>
        <div className="space-y-8 text-muted-foreground leading-8">
          <p className="text-lg text-foreground">LingoForge is a modern language learning platform designed specifically for Asian migrant workers who need practical, real-world language skills to survive, communicate, and thrive abroad.</p>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Our Mission</h2>
            <p>To help anyone from Sri Lanka, India, Bangladesh, Nepal, or Pakistan learn the language of their destination country quickly, affordably, and in their own native language.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">What Makes LingoForge Different?</h2>
            <ul className="space-y-2">
              <li>✅ Built specifically for migrant workers</li>
              <li>✅ Learn in Sinhala, Hindi, Bengali, Urdu, Nepali</li>
              <li>✅ 21 target languages</li>
              <li>✅ Survival-focused content</li>
              <li>✅ AI-powered Pro lessons</li>
              <li>✅ First week completely free</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
            <p>📧 <a href="mailto:support@lingoforge.app" className="text-primary">support@lingoforge.app</a></p>
            <p>💬 WhatsApp: <a href="https://wa.me/94768680133" className="text-primary">+94 768 680 133</a></p>
          </div>
          <div className="grid grid-cols-3 gap-4 py-8 border-y border-border my-8 text-center">
            <div><p className="text-3xl font-bold text-primary">21</p><p className="text-sm text-muted-foreground">Target Languages</p></div>
            <div><p className="text-3xl font-bold text-primary">6</p><p className="text-sm text-muted-foreground">Native Languages</p></div>
            <div><p className="text-3xl font-bold text-primary">Free</p><p className="text-sm text-muted-foreground">Week 1 Always</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 my-4">
            <div className="flex items-start gap-4">
              <div className="text-5xl">👨‍💻</div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Pasan Lankathilaka</h2>
                <p className="text-sm text-primary mb-3">Founder and Developer · Sri Lanka 🇱🇰 → Romania 🇷🇴</p>
                <p className="text-muted-foreground leading-7 italic mb-3">I moved to Romania from Sri Lanka in search of better opportunities. Like thousands of other Asian migrants, I struggled with the language barrier every single day. I searched for language apps, but none were built for people like me. So I built LingoForge — the app I wish existed when I first arrived.</p>
                <p className="text-muted-foreground text-sm">This is why LingoForge focuses on real-world language learning for migrant workers. <a href="/blog" className="text-primary underline">Explore our learning guides →</a></p>
              </div>
            </div>
          </div>
          <div className="text-center pt-8">
            <Link href="/login" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold">Start Learning Free →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

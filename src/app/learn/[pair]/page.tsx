import { Metadata } from 'next';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

const pairConfig: Record<string, { native: string; target: string; folder: string }> = {
  'romanian-from-sinhala': { native: 'Sinhala', target: 'Romanian', folder: 'sinhala_romanian' },
};

function getLessonData(folder: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'lessons', folder, 'survival', 'week_01.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return Object.keys(pairConfig).map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: { params: { pair: string } }): Promise<Metadata> {
  const config = pairConfig[params.pair];
  if (!config) return {};
  const title = `Learn ${config.target} from ${config.native} - Free Survival Phrases | LingoForge`;
  const description = `Learn essential ${config.target} phrases in ${config.native}. Free survival vocabulary for greetings, daily life, and travel. Start learning today with LingoForge.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://lingoforge.app/learn/${params.pair}`,
    },
    openGraph: {
      title,
      description,
      url: `https://lingoforge.app/learn/${params.pair}`,
      siteName: 'LingoForge',
      type: 'website',
    },
  };
}

export default function LearnPairPage({ params }: { params: { pair: string } }) {
  const config = pairConfig[params.pair];
  if (!config) notFound();

  const lessonData = getLessonData(config.folder);
  const day1 = lessonData?.days?.[0];
  const words = day1?.words?.slice(0, 8) || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `Learn ${config.target} from ${config.native}`,
    description: `Free survival ${config.target} phrases for ${config.native} speakers, covering greetings, daily life, and essential vocabulary.`,
    provider: {
      '@type': 'Organization',
      name: 'LingoForge',
      sameAs: 'https://lingoforge.app',
    },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Learn {config.target} from {config.native}
          </h1>
          <p className="text-muted-foreground text-lg">
            Free survival phrases for {config.native} speakers moving to {config.target === 'Romanian' ? 'Romania' : config.target}.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Day 1: {day1?.title || 'Basic Greetings'}
          </h2>
          <div className="grid gap-3">
            {words.map((w: any) => (
              <div key={w.id} className="flex flex-col p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-lg">{w.target}</span>
                  <span className="text-sm text-muted-foreground italic">{w.phonetic}</span>
                </div>
                <span className="text-sm text-muted-foreground mt-1">{w.native_meaning}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
          <h3 className="font-bold text-lg mb-2">Continue Learning for Free</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Get full access to Week 1, Day 1-3 absolutely free. No credit card required.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Start Learning Free →</Link>
          </Button>
        </div>

        <div className="mt-10 text-sm text-muted-foreground text-center">
          <p>
            LingoForge is built for Asian migrant workers learning {config.target} for daily life, work, and integration.
            Explore our <Link href="/blog" className="text-primary hover:underline">blog</Link> for more language learning guides.
          </p>
        </div>
      </main>
    </div>
  );
}

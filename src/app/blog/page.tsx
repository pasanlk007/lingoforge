import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

const articles = [
  {
    slug: 'romanian-for-sri-lankan-workers',
    title: 'රෝමේනියාවේ වැඩ කරන ශ්‍රී ලාංකිකයන් සඳහා රෝමේනියානු භාෂාව',
    titleEn: 'Romanian Language for Sri Lankan Workers in Romania',
    excerpt: 'රෝමේනියාවේ ජීවත් වෙමින් රෝමේනියානු භාෂාව ඉගෙනීමට ලේසිම ක්‍රම. Daily survival phrases, workplace language සහ daily life.',
    date: '2026-04-13',
    readTime: '5 min',
    tags: ['Romanian', 'Sri Lankan', 'Migrant Workers'],
  },
  {
    slug: 'survive-in-europe-language-tips',
    title: 'යුරෝපයේ ජීවත් වීමට භාෂා ඉගෙනීමේ tips',
    titleEn: 'Language Learning Tips to Survive in Europe',
    excerpt: 'යුරෝපයේ නව රටක ජීවත් වන migrant workers ලාට ලේසිම විදිහට භාෂාව ඉගෙනීමට tips.',
    date: '2026-04-13',
    readTime: '4 min',
    tags: ['Europe', 'Language Tips', 'Survival'],
  },
  {
    slug: 'learn-romanian-30-days',
    title: 'දින 30කින් රෝමේනියානු ඉගෙනගන්නේ කෙසේද?',
    titleEn: 'How to Learn Romanian in 30 Days',
    excerpt: 'දිනකට මිනිත්තු 10ක් ගතකිරීමෙන් රෝමේනියානු භාෂාව ඉගෙනීමේ step-by-step plan.',
    date: '2026-04-13',
    readTime: '6 min',
    tags: ['Romanian', '30 Days', 'Learning Plan'],
  },
  {
    slug: 'migrant-worker-language-guide',
    title: 'විදේශ රැකියාව සඳහා භාෂා guide',
    titleEn: 'Complete Language Guide for Migrant Workers',
    excerpt: 'විදේශ රටක රැකියාව ලබාගැනීමට සහ ජීවත් වීමට අවශ්‍ය භාෂා skills.',
    date: '2026-04-13',
    readTime: '7 min',
    tags: ['Migrant Workers', 'Language Guide', 'Jobs Abroad'],
  },
];

export const metadata = {
  title: 'Blog | LingoForge - Language Learning for Migrant Workers',
  description: 'Articles about language learning for Asian migrant workers in Europe. Romanian, French, German and more.',
};

export default function BlogPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-3">LingoForge Blog</h1>
          <p className="text-muted-foreground">Language learning tips for Asian migrant workers</p>
        </div>

        <div className="grid gap-6">
          {articles.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`}
              className="block bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags.map(tag => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <h2 className="text-xl font-bold mb-1">{article.titleEn}</h2>
              <p className="text-sm text-muted-foreground mb-2">{article.title}</p>
              <p className="text-muted-foreground text-sm mb-4">{article.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>📅 {article.date}</span>
                <span>⏱️ {article.readTime} read</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

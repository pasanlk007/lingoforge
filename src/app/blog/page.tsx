import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

const articles = [
  {
    slug: 'learn-romanian-language-sinhala',
    title: 'රෝමේනියානු භාෂාව සිංහලෙන් ඉගෙනගන්න - සම්පූර්ණ මාර්ගෝපදේශය 2026',
    titleEn: 'Learn Romanian Language in Sinhala - Complete Beginner Guide 2026',
    excerpt: 'රෝමේනියාවට යන ශ්‍රී ලාංකිකයන් සඳහා රෝමේනියානු භාෂාව සිංහලෙන් ඉගෙනීමේ ලේසිම ක්‍රමය.',
    date: '2026-05-10',
    readTime: '7 min',
    tags: ['Romanian', 'Sinhala', 'Beginner', 'Sri Lanka'],
  },
  {
    slug: 'romanian-words-daily-life-sinhala',
    title: 'දෛනික ජීවිතයේ රෝමේනියානු වචන - සිංහල අර්ථ සමග',
    titleEn: 'Romanian Words for Daily Life with Sinhala Meanings',
    excerpt: 'Shopping, transport, work, hospital - දෛනික ජීවිතයේදී අවශ්‍ය රෝමේනියානු වචන 100+ සිංහලෙන්.',
    date: '2026-05-10',
    readTime: '5 min',
    tags: ['Romanian', 'Vocabulary', 'Daily Life', 'Sinhala'],
  },
  {
    slug: 'work-in-romania-sinhala-guide',
    title: 'රෝමේනියාවේ වැඩ කිරීමේ සම්පූර්ණ මාර්ගෝපදේශය - සිංහලෙන්',
    titleEn: 'Complete Guide to Working in Romania for Sri Lankans',
    excerpt: 'Visa, salary, rights, language - රෝමේනියාවේ වැඩ කිරීමට අවශ්‍ය සියල්ල සිංහලෙන්.',
    date: '2026-05-10',
    readTime: '8 min',
    tags: ['Romania', 'Work', 'Sri Lanka', 'Guide'],
  },
  {
    slug: 'italy-language-sinhala',
    title: 'ඉතාලි භාෂාව සිංහලෙන් ඉගෙනගන්න - Survival Phrases',
    titleEn: 'Learn Italian Language in Sinhala - Survival Phrases for Migrants',
    excerpt: 'ඉතාලියේ ජීවත් වෙන ශ්‍රී ලාංකිකයන් සඳහා ඉතාලි survival phrases සිංහලෙන්.',
    date: '2026-05-10',
    readTime: '5 min',
    tags: ['Italian', 'Sinhala', 'Italy', 'Survival'],
  },
  {
    slug: 'france-language-sinhala',
    title: 'ප්‍රංශ භාෂාව සිංහලෙන් - ශ්‍රී ලාංකික migrant workers සඳහා',
    titleEn: 'French Language in Sinhala for Sri Lankan Migrant Workers',
    excerpt: 'ප්‍රංශයේ වැඩ කරන ශ්‍රී ලාංකිකයන් සඳහා ප්‍රංශ survival phrases සිංහලෙන්.',
    date: '2026-05-10',
    readTime: '5 min',
    tags: ['French', 'Sinhala', 'France', 'Migrants'],
  },
  {
    slug: 'bashaguru-review-sinhala',
    title: 'BhashaGuru (LingoForge) App Review - සිංහලෙන්',
    titleEn: 'BhashaGuru LingoForge App Review in Sinhala - Is It Worth It?',
    excerpt: 'BhashaGuru language learning app review සිංහලෙන්. Features, prices, සහ real user experience.',
    date: '2026-05-10',
    readTime: '4 min',
    tags: ['BhashaGuru', 'LingoForge', 'Review', 'Sinhala'],
  },
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
    slug: 'learn-romanian-sinhala-speakers',
    title: 'සිංහලෙන් රෝමේනියානු ඉගෙනගන්නේ කෙසේද',
    titleEn: 'Learn Romanian for Sinhala Speakers - Complete Guide',
    excerpt: 'සිංහල භාෂාවෙන් රෝමේනියානු ඉගෙනගන්නේ කෙසේද? Step by step guide for Sri Lankan workers in Romania.',
    date: '2026-04-14',
    readTime: '6 min',
    tags: ['Romanian', 'Sinhala', 'Sri Lanka', 'Learn Romanian'],
  },
  {
    slug: 'sinhala-german-course',
    title: 'සිංහලෙන් ජර්මන් ඉගෙනගන්නේ කෙසේද',
    titleEn: 'Learn German for Sinhala Speakers - Free Course',
    excerpt: 'ජර්මනියේ වැඩ කරන ශ්‍රී ලාංකිකයන් සඳහා සිංහලෙන් ජර්මන් ඉගෙනීමේ මාර්ගෝපදේශය.',
    date: '2026-04-14',
    readTime: '5 min',
    tags: ['German', 'Sinhala', 'Germany', 'Learn German'],
  },
  {
    slug: 'sinhala-italian-course',
    title: 'සිංහලෙන් ඉතාලි ඉගෙන ගන්න',
    titleEn: 'Learn Italian in Sinhala - Language Course for Sri Lankans',
    excerpt: 'ඉතාලියේ ජීවත් වෙමින් ඉතාලි භාෂාව සිංහලෙන් ඉගෙනගන්නේ කෙසේද? Sri Lankan workers guide.',
    date: '2026-04-14',
    readTime: '5 min',
    tags: ['Italian', 'Sinhala', 'Italy', 'Learn Italian'],
  },
  {
    slug: 'bashaguru-language-app-review',
    title: 'BhashaGuru / LingoForge - Migrant Workers Language App Review',
    titleEn: 'BhashaGuru LingoForge App Review - Best Language App for Sri Lankans Abroad',
    excerpt: 'Complete review of LingoForge/BhashaGuru language learning app for Sri Lankan, Indian, Bangladeshi migrant workers.',
    date: '2026-04-14',
    readTime: '4 min',
    tags: ['BhashaGuru', 'LingoForge', 'App Review', 'Language App'],
  },
  {
    slug: 'german-for-nepalese-workers',
    title: 'German Language Guide for Nepalese Workers in Germany',
    titleEn: 'German Language Guide for Nepalese Workers in Germany',
    excerpt: 'जर्मनीमा काम गर्ने नेपाली कामदारहरूका लागि आवश्यक जर्मन भाषा phrases र survival tips.',
    date: '2026-04-14',
    readTime: '5 min',
    tags: ['German', 'Nepali', 'Germany'],
  },
  {
    slug: 'hebrew-for-indian-caregivers',
    title: 'Hebrew Language for Indian Caregivers in Israel',
    titleEn: 'Hebrew Language for Indian Caregivers in Israel',
    excerpt: 'इज़राइल में भारतीय देखभालकर्ताओं के लिए आवश्यक हिब्रू phrases और caregiver vocabulary.',
    date: '2026-04-14',
    readTime: '5 min',
    tags: ['Hebrew', 'Hindi', 'Israel'],
  },
  {
    slug: 'french-for-bangladeshi-workers',
    title: 'French Language Guide for Bangladeshi Workers in France',
    titleEn: 'French Language Guide for Bangladeshi Workers in France',
    excerpt: 'ফ্রান্সে বাংলাদেশী শ্রমিকদের জন্য জরুরি ফরাসি phrases এবং survival tips.',
    date: '2026-04-14',
    readTime: '6 min',
    tags: ['French', 'Bengali', 'France'],
  },
  {
    slug: 'japanese-for-migrant-workers',
    title: 'Japanese Language Basics for Asian Migrant Workers',
    titleEn: 'Japanese Language Basics for Asian Migrant Workers in Japan',
    excerpt: 'Japan Technical Intern Training Program সদস্যদের জন্য জাপানি ভাষার মূল বিষয়গুলি।',
    date: '2026-04-14',
    readTime: '7 min',
    tags: ['Japanese', 'Japan', 'Technical Intern'],
  },
  {
    slug: 'korean-for-asian-workers',
    title: 'Korean Language Guide for Asian Workers in South Korea',
    titleEn: 'Korean Language Guide for Asian Workers - EPS-TOPIK',
    excerpt: 'EPS-TOPIK Korean language test preparation for Asian migrant workers going to South Korea.',
    date: '2026-04-14',
    readTime: '5 min',
    tags: ['Korean', 'South Korea', 'EPS-TOPIK'],
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

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lingoforge.app'
  const learnPairs = ['romanian-from-sinhala']
  
  const blogSlugs = [
    'romanian-for-sri-lankan-workers',
    'survive-in-europe-language-tips',
    'learn-romanian-30-days',
    'migrant-worker-language-guide',
    'german-for-nepalese-workers',
    'hebrew-for-indian-caregivers',
    'french-for-bangladeshi-workers',
    'japanese-for-migrant-workers',
    'korean-for-asian-workers',
    'learn-romanian-sinhala-speakers',
    'sinhala-german-course',
    'sinhala-italian-course',
    'bashaguru-language-app-review',
    'learn-romanian-language-sinhala',
    'romanian-words-daily-life-sinhala',
    'work-in-romania-sinhala-guide',
    'italy-language-sinhala',
    'france-language-sinhala',
    'bashaguru-review-sinhala',
  ]

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/go`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...blogSlugs.map(slug => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...learnPairs.map(pair => ({
      url: `${baseUrl}/learn/${pair}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ]
}

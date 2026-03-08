import type { TargetLanguage, NativeLanguage } from './types';

export const TARGET_LANGUAGES: { name: TargetLanguage, code: string, flag: string }[] = [
  { name: 'French', code: 'fr-FR', flag: '🇫🇷' },
  { name: 'German', code: 'de-DE', flag: '🇩🇪' },
  { name: 'Spanish', code: 'es-ES', flag: '🇪🇸' },
  { name: 'Italian', code: 'it-IT', flag: '🇮🇹' },
  { name: 'Portuguese', code: 'pt-PT', flag: '🇵🇹' },
  { name: 'Dutch', code: 'nl-NL', flag: '🇳🇱' },
  { name: 'Polish', code: 'pl-PL', flag: '🇵🇱' },
  { name: 'Romanian', code: 'ro-RO', flag: '🇷🇴' },
  { name: 'Greek', code: 'el-GR', flag: '🇬🇷' },
  { name: 'Serbian', code: 'sr-RS', flag: '🇷🇸' },
  { name: 'Russian', code: 'ru-RU', flag: '🇷🇺' },
  { name: 'Finnish', code: 'fi-FI', flag: '🇫🇮' },
  { name: 'Korean', code: 'ko-KR', flag: '🇰🇷' },
  { name: 'Japanese', code: 'ja-JP', flag: '🇯🇵' },
  { name: 'Arabic', code: 'ar-SA', flag: '🇸🇦' },
  { name: 'Hebrew', code: 'he-IL', flag: '🇮🇱' },
  { name: 'English', code: 'en-US', flag: '🇬🇧' },
  { name: 'Turkish', code: 'tr-TR', flag: '🇹🇷' },
  { name: 'Hindi', code: 'hi-IN', flag: '🇮🇳' },
  { name: 'Tamil', code: 'ta-IN', flag: '🇮🇳' },
  { name: 'Chinese', code: 'zh-CN', flag: '🇨🇳' },
];

export const NATIVE_LANGUAGES: { name: NativeLanguage, code: string }[] = [
  { name: 'English', code: 'en' },
  { name: 'Sinhala', code: 'si' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Bengali', code: 'bn' },
];

export const PATHS = [
  {
    id: 'survival',
    icon: '🌍',
    title: 'SURVIVAL PATH',
    description: 'Learn to survive in any country',
    details: ['48 weeks', '7 days/week', '5 words/day'],
  },
  {
    id: 'alphabet',
    icon: '🔤',
    title: 'ALPHABET PATH',
    description: 'Master the writing system from scratch',
    details: ['48 weeks', '7 days/week', '5 chars/day'],
  },
  {
    id: 'numbers',
    icon: '🔢',
    title: 'NUMBERS PATH',
    description: 'Count, measure, tell time and handle money',
    details: ['48 weeks', '7 days/week', '5 numbers/day'],
  },
];

import type { LanguageLesson, LearningPath, LessonDay } from "./types";

export async function getLessonFromFile(
  language: string,
  path: LearningPath,
  week: number,
  nativeLanguage: string = "English",
  day: number = 1
): Promise<LanguageLesson | null> {
  try {
    const native = nativeLanguage.toLowerCase();
    const target = language.toLowerCase();
    const filePath = `lessons/${native}_${target}/${path}/week_${String(week).padStart(2, '0')}/day_${day}.json`;

    let dayData: LessonDay | null = null;

    // Server-side loading using 'fs'
    if (typeof window === 'undefined') {
      const { readFileSync, existsSync } = require('fs');
      const { join } = require('path');
      const fullPath = join(process.cwd(), 'public', filePath);
      
      if (!existsSync(fullPath)) {
        console.error(`[JSON Loader] File not found: ${fullPath}`);
        return null;
      }
      const fileContent = readFileSync(fullPath, 'utf-8');
      dayData = JSON.parse(fileContent) as LessonDay;
    } else {
      // Client-side loading using 'fetch'
      const res = await fetch(`/${filePath}`);
      if (!res.ok) {
        console.error(`[JSON Loader] Not found on client: /${filePath}`);
        return null;
      }
      dayData = await res.json() as LessonDay;
    }

    if (!dayData) return null;

    // Wrap the single day's data into the LanguageLesson structure
    const lesson: LanguageLesson = {
      week: dayData.week,
      language: dayData.targetLanguage,
      path: dayData.path,
      title: dayData.title,
      description: dayData.theme,
      days: [dayData] // Wrap the loaded day data in an array
    };

    return lesson;

  } catch (error) {
    console.error(`[JSON Loader] Error loading or parsing lesson for ${language}/${path}/w${week}/d${day}:`, error);
    return null;
  }
}

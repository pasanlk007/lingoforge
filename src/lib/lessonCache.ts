
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

    if (typeof window === 'undefined') {
      const { readFileSync, existsSync } = require('fs');
      const { join } = require('path');
      const fullPath = join(process.cwd(), 'public', filePath);
      if (!existsSync(fullPath)) {
        console.error(`[JSON Loader] File not found: ${fullPath}`);
        return null;
      }
      dayData = JSON.parse(readFileSync(fullPath, 'utf-8')) as LessonDay;
    } else {
      const res = await fetch(`/${filePath}`);
      if (!res.ok) {
        console.error(`[JSON Loader] Not found: /${filePath}`);
        return null;
      }
      dayData = await res.json() as LessonDay;
    }

    if (!dayData) return null;

    const lesson: LanguageLesson = {
      week: week,
      language: language,
      path: path,
      title: dayData.title,
      description: dayData.theme,
      days: [dayData]
    };

    return lesson;

  } catch (error) {
    console.error('[JSON Loader] Error:', error);
    return null;
  }
}

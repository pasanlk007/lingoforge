import type { LanguageLesson, LearningPath, WeeklyLessonPlan } from "./types";

export async function getOrGenerateLesson(
  language: string, // target language
  path: LearningPath,
  week: number,
  nativeLanguage: string = "English",
  day: number = 1 // day is passed but not used to select the day, as per instructions to return the week data
): Promise<LanguageLesson | null> {
  try {
    const native = nativeLanguage.toLowerCase();
    const target = language.toLowerCase();

    const weekPadded = String(week).padStart(2, '0');
    // This path is more standard: e.g., /lessons/french/sinhala/survival/week_01.json
    const filePath = `lessons/${target}/${native}/${path}/week_${weekPadded}.json`;

    let weekData: WeeklyLessonPlan | null = null;

    if (typeof window === 'undefined') {
      // Server-side: use fs to read the file
      const { readFileSync, existsSync } = require('fs');
      const { join } = require('path');
      const fullPath = join(process.cwd(), 'public', filePath);

      if (existsSync(fullPath)) {
        const fileContent = readFileSync(fullPath, 'utf-8');
        weekData = JSON.parse(fileContent);
      } else {
        console.error(`[JSON Loader] File not found on server: ${fullPath}`);
        return null;
      }
    } else {
      // Client-side: use fetch
      const res = await fetch(`/${filePath}`);
      if (res.ok) {
        weekData = await res.json();
      } else {
        console.error(`[JSON Loader] File not found on client: /${filePath} (Status: ${res.status})`);
        return null;
      }
    }

    if (!weekData || !Array.isArray(weekData.days) || weekData.days.length === 0) {
      console.error(`[JSON Loader] Invalid or empty week data in file: ${filePath}`);
      return null;
    }

    // Per instructions, return the full week object wrapped as a LanguageLesson
    const lesson: LanguageLesson = {
      week: weekData.week,
      language: weekData.targetLanguage,
      path: weekData.path as LearningPath,
      title: weekData.days[0]?.title || `Week ${weekData.week}`,
      description: weekData.days[0]?.theme || '',
      days: weekData.days,
    };

    return lesson;

  } catch (error) {
    console.error(`[JSON Loader] Error loading or parsing lesson file for path "${path}" week ${week}:`, error);
    return null;
  }
}

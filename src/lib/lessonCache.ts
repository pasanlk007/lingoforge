
import type { LanguageLesson, LearningPath } from "./types";

export async function getOrGenerateLesson(
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

    let dayData: any = null;

    if (typeof window === 'undefined') {
      const { readFileSync, existsSync } = require('fs');
      const { join } = require('path');
      const fullPath = join(process.cwd(), 'public', filePath);

      if (!existsSync(fullPath)) {
        console.error(`[JSON Loader] File not found: ${fullPath}`);
        return null;
      }
      
      dayData = JSON.parse(readFileSync(fullPath, 'utf-8'));
    } else {
      const res = await fetch(`/${filePath}`);
      if (!res.ok) {
        console.error(`[JSON Loader] Fetch failed for: /${filePath}`);
        return null;
      }
      dayData = await res.json();
    }

    // Correctly wrap the loaded daily data into the LanguageLesson structure
    // This ensures that the object passed to the client component matches the LanguageLesson type
    const lesson: LanguageLesson = {
      week: week,
      language: language,
      path: path,
      title: dayData.title || `Week ${week}`, // Use the title from the day's data or create a default
      description: `Lesson content for week ${week} of the ${path} path.`,
      // Wrap the single day's data in an array, as expected by the client component
      days: [{ ...dayData, day: day }]
    };

    return lesson;

  } catch (error) {
    console.error(`[JSON Loader] Error loading lesson from ${filePath}:`, error);
    return null;
  }
}

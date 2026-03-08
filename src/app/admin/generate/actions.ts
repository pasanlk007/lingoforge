'use server';

import { generateWeeklyLessonPlan } from '@/ai/generate-weekly-lesson';
import { GenerateWeeklyLessonPlanInputSchema } from '@/ai/generate-weekly-lesson';
import { THEMES } from '@/lib/themes';
import { z } from 'zod';

export async function generateWeeklyLessonAction(formData: FormData) {
    const rawData = {
        targetLanguage: formData.get('targetLanguage'),
        nativeLanguage: formData.get('nativeLanguage'),
        path: formData.get('path'),
        week: formData.get('week'),
    };
    
    const parseResult = GenerateWeeklyLessonPlanInputSchema.omit({ themes: true }).extend({
        week: z.coerce.number(),
    }).safeParse(rawData);

    if (!parseResult.success) {
        return { error: 'Invalid form data.', details: parseResult.error.flatten() };
    }

    const { targetLanguage, nativeLanguage, path, week } = parseResult.data;

    // @ts-ignore
    const themes = THEMES[path]?.[`week${week}`];

    if (!themes) {
        return { error: `Themes for ${path}, week ${week} not found.` };
    }

    const generationInput = {
        targetLanguage,
        nativeLanguage,
        path,
        week,
        themes,
    };
    
    return await generateWeeklyLessonPlan(generationInput);
}

'use server';

import { generateWeeklyLessonPlan } from '@/ai/generate-weekly-lesson';
import { generateThemes } from '@/ai/generate-themes';
import { z } from 'zod';

const AdminActionInputSchema = z.object({
    targetLanguage: z.string(),
    nativeLanguage: z.string(),
    path: z.string(),
    week: z.coerce.number(),
});

export async function generateWeeklyLessonAction(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    
    const parseResult = AdminActionInputSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: 'Invalid form data.', details: parseResult.error.flatten() };
    }

    const { targetLanguage, nativeLanguage, path, week } = parseResult.data;

    try {
        // Step 1: Generate themes for the week dynamically using AI
        const themesResult = await generateThemes({
            targetLanguage,
            nativeLanguage,
            path,
            week,
        });

        if (!themesResult || !themesResult.themes || themesResult.themes.length !== 7) {
            return { error: 'Failed to generate a valid set of themes from the AI.' };
        }
        
        const { themes } = themesResult;

        // Step 2: Generate the full lesson plan using the dynamically generated themes
        const generationInput = {
            targetLanguage,
            nativeLanguage,
            path,
            week,
            themes,
        };
        
        return await generateWeeklyLessonPlan(generationInput);

    } catch (e: any) {
        console.error("Error in weekly lesson generation action:", e);
        return { error: e.message || "An unexpected error occurred during AI generation." };
    }
}

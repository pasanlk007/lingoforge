'use server';

import { generateLesson } from '@/ai/generate-lesson';
import { GenerateLessonInputSchema } from '@/ai/generate-lesson';
import { z } from 'zod';

export async function generateLessonAction(formData: FormData) {
    const rawData = {
        targetLanguage: formData.get('targetLanguage'),
        nativeLanguage: formData.get('nativeLanguage'),
        path: formData.get('path'),
        week: formData.get('week'),
        day: formData.get('day'),
        theme: formData.get('theme'),
    };
    
    const validatedData = GenerateLessonInputSchema.extend({
        week: z.coerce.number(),
        day: z.coerce.number(),
    }).safeParse(rawData);

    if (!validatedData.success) {
        return { error: 'Invalid form data.', details: validatedData.error.flatten() };
    }
    
    return await generateLesson(validatedData.data);
}

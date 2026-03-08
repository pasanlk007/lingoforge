'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// Define input schema for the flow
const GenerateWeeklyLessonPlanInputSchema = z.object({
  targetLanguage: z.string(),
  nativeLanguage: z.string(),
  path: z.string(),
  week: z.number(),
  themes: z.array(z.string()).length(7),
});
export type GenerateWeeklyLessonPlanInput = z.infer<typeof GenerateWeeklyLessonPlanInputSchema>;

// This is the function we'll export and call from our server action
export async function generateWeeklyLessonPlan(input: GenerateWeeklyLessonPlanInput): Promise<{ json: string } | { error: string }> {
  try {
    const jsonResult = await generateWeeklyLessonFlow(input);
    return { json: jsonResult };
  } catch (e: any) {
    console.error("Error generating weekly lesson plan:", e);
    return { error: e.message || "Failed to generate lesson content." };
  }
}

// Define the Genkit flow
const generateWeeklyLessonFlow = ai.defineFlow(
  {
    name: 'generateWeeklyLessonFlow',
    inputSchema: GenerateWeeklyLessonPlanInputSchema,
    outputSchema: z.string(), // We expect a raw JSON string
  },
  async (input) => {
    // Load the schema file. This happens on the server.
    const schemaPath = path.join(process.cwd(), 'docs', 'weekly-lesson-schema.json');
    const weeklyLessonSchema = await fs.readFile(schemaPath, 'utf-8');

    // Define the prompt for the AI
    const lessonGenerationPrompt = ai.definePrompt(
      {
        name: 'weeklyLessonGenerationPrompt',
        model: 'anthropic/claude-3-sonnet-20240229',
        input: { schema: GenerateWeeklyLessonPlanInputSchema },
        output: {
          format: 'json',
        },
        prompt: `
          You are an expert curriculum designer specializing in language education for migrant workers.
          Your task is to generate a complete, coherent 7-day lesson plan for a single week.

          **CRITICAL INSTRUCTIONS:**
          1.  The output **MUST** be a single, raw JSON object. Do **NOT** wrap it in markdown.
          2.  The JSON object **MUST** strictly validate against the JSON Schema provided below.
          3.  Generate content for all 7 days, from day 1 to day 7.
          4.  Each day's content must be based on its corresponding theme from the 'themes' array.
          5.  Focus on practical, real-world scenarios. The exercises should include fill-in-the-blanks, sentence construction, and dialogues.
          6.  All 'id' fields must be unique across the entire 7-day plan.

          **Lesson Parameters:**
          - Target Language: ${input.targetLanguage}
          - Native Language (for translations): ${input.nativeLanguage}
          - Learning Path: ${input.path}
          - Week: ${input.week}
          - Daily Themes: 
            - Day 1: "${input.themes[0]}"
            - Day 2: "${input.themes[1]}"
            - Day 3: "${input.themes[2]}"
            - Day 4: "${input.themes[3]}"
            - Day 5: "${input.themes[4]}"
            - Day 6: "${input.themes[5]}"
            - Day 7: "${input.themes[6]}"

          **JSON Schema to Follow:**
          \`\`\`json
          ${weeklyLessonSchema}
          \`\`\`
        `,
        config: {
          temperature: 0.4, 
        },
      },
    );
    
    const response = await lessonGenerationPrompt(input);
    const jsonText = response.text;
    
    // Simple validation to ensure it's likely a JSON object
    if (jsonText && jsonText.trim().startsWith('{') && jsonText.trim().endsWith('}')) {
       try {
         // Let's try to parse it to be sure it's valid JSON
         JSON.parse(jsonText);
         return jsonText;
       } catch (e) {
         throw new Error("AI returned a string that was not valid JSON.");
       }
    }

    throw new Error("AI did not return a valid JSON object. It returned: " + jsonText);
  }
);

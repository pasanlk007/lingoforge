'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  GenerateLessonPlanInputSchema,
  WeeklyLessonPlanSchema,
  type GenerateLessonPlanInput,
  type WeeklyLessonPlanOutput,
} from '@/ai/schemas/lesson-plan-schemas';

const pathDescription: Record<string, string> = {
  survival: 'everyday survival phrases, greetings, shopping, transport, food, emergency',
  alphabet: 'letters of the alphabet, writing system, character recognition, reading basics',
  numbers: 'numbers 1-100, counting, dates, time, money, measurements',
};

const weekThemes = {
  survival: [
    'Greetings & Introductions', 'Numbers & Time', 'Food & Restaurant',
    'Transport & Directions', 'Shopping & Money', 'Health & Emergency',
    'Family & Relationships', 'Work & Business', 'Weather & Environment',
    'Culture & Traditions',
  ],
  alphabet: [
    'Basic Letters A-F', 'Letters G-L', 'Letters M-R', 'Letters S-Z',
    'Vowels & Consonants', 'Letter Combinations', 'Common Words Spelling',
    'Reading Simple Words', 'Writing Practice', 'Reading Short Sentences',
  ],
  numbers: [
    '1-10 Basic Counting', '11-100 Numbers', 'Ordinal Numbers', 'Time & Clock',
    'Days & Months', 'Money & Prices', 'Measurements & Weight', 'Math Operations',
    'Dates & Calendar', 'Phone & Address Numbers',
  ],
};

const AIPlanningInputSchema = z.object({
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  week: z.number().int().min(1).max(48),
  language: z.string(),
  previousPerformanceSummary: z.string().optional(),
  availableThemes: z.array(z.string()),
});

const AIPlanningOutputSchema = z.object({
  chosenTopic: z.string(),
});

const aiPlanningTopicPrompt = ai.definePrompt({
  name: 'aiPlanningTopicPrompt',
  input: { schema: AIPlanningInputSchema },
  output: { schema: AIPlanningOutputSchema },
  config: { maxOutputTokens: 200 },
  prompt: `You are a language learning assistant. Select the best topic for a lesson.
User is learning "{{language}}" on the "{{path}}" path, week {{week}}.
Performance summary: "{{previousPerformanceSummary}}".
Available themes:
{{#each availableThemes}}- {{this}}
{{/each}}
Return ONLY valid JSON: {"chosenTopic": "selected theme here"}`,
});

// This internal schema defines the data required by the lesson generation prompt itself.
const LessonGenerationPromptInputSchema = z.object({
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  week: z.number().int().min(1).max(48),
  nativeLanguage: z.string(),
  theme: z.string(),
  pathDesc: z.string(),
  currencyHint: z.string().optional(),
});

const lessonGenerationPrompt = ai.definePrompt({
  name: 'lessonGenerationPrompt',
  input: { schema: LessonGenerationPromptInputSchema },
  output: { schema: WeeklyLessonPlanSchema },
  config: { maxOutputTokens: 8192 },
  prompt: `You are an expert language lesson planner. Your task is to generate a complete, 7-day weekly lesson plan based on the provided schema.

Please adhere strictly to the format and data types defined in the output schema. Use the descriptions within the schema as your guide for what to generate for each field.

Generate the lesson plan for:
- Target Language: {{language}}
- Native Language (for context): {{nativeLanguage}}
- Learning Path: {{path}} (focus on: {{pathDesc}})
- Week: {{week}}
- Weekly Theme: {{theme}}
{{#if currencyHint}}

Special Instructions for this theme: {{currencyHint}}
{{/if}}

IMPORTANT:
- Your entire response must be ONLY the raw JSON object.
- Do not wrap the JSON in markdown backticks or provide any explanation.`,
});

export const generateDynamicWeeklyLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateDynamicWeeklyLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: WeeklyLessonPlanSchema,
  },
  async (input) => {
    let theme: string;

    // 1. Determine the weekly theme (either by AI or by predefined logic)
    if (input.aiPlanningEnabled) {
      const currentPathThemes = weekThemes[input.path];
      const { output: aiPlanningOutput } = await aiPlanningTopicPrompt({
        path: input.path,
        week: input.week,
        language: input.language,
        previousPerformanceSummary: input.previousPerformanceSummary,
        availableThemes: currentPathThemes,
      });
      if (!aiPlanningOutput) {
        throw new Error("AI failed to choose a topic. Please try again.");
      }
      theme = aiPlanningOutput.chosenTopic;
    } else {
      // Default logic to pick a theme based on the week number
      theme = input.selectedTopic
        ?? weekThemes[input.path][(input.week - 1) % weekThemes[input.path].length];
    }
    
    let currencyHint: string | undefined = undefined;
    if (theme === 'Money & Prices') {
      currencyHint = `The target language is ${input.language}. When generating content for the "Money & Prices" theme, it is crucial to include the local currency symbol and name (e.g., €, JPY, ¥) in vocabulary and examples. For example, for French, use the Euro (€). For Japanese, use the Yen (¥).`;
    }

    // 2. Call the main lesson generation prompt with the determined theme
    const response = await lessonGenerationPrompt(
      {
        language: input.language,
        path: input.path,
        week: input.week,
        nativeLanguage: input.nativeLanguage,
        theme: theme,
        pathDesc: pathDescription[input.path],
        currencyHint: currencyHint,
      },
      { model: 'googleai/gemini-1.5-flash-latest' }
    );

    const output = response.output;

    // 3. Validate the output and handle failures
    if (!output) {
      console.error('AI response failed schema validation. Raw text:', response.text);
      throw new Error('AI failed to generate a valid lesson plan. The response format was incorrect.');
    }

    return output;
  }
);

export async function generateDynamicWeeklyLessonPlan(
  input: GenerateLessonPlanInput
): Promise<WeeklyLessonPlanOutput> {
  return generateDynamicWeeklyLessonPlanFlow(input);
}

'use server';
/**
 * @fileOverview A Genkit flow for generating dynamic weekly lesson plans for the LingoForge app.
 *
 * - generateDynamicWeeklyLessonPlan - A function that generates a complete 7-day lesson plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  GenerateLessonPlanInputSchema,
  WeeklyLessonPlanSchema,
  type GenerateLessonPlanInput,
  type WeeklyLessonPlanOutput,
} from '@/ai/schemas/lesson-plan-schemas';


const pathDescription = {
  survival: 'everyday survival phrases, greetings, shopping, transport, food, emergency',
  alphabet: 'letters of the alphabet, writing system, character recognition, reading basics',
  numbers: 'numbers 1-100, counting, dates, time, money, measurements',
};

const weekThemes = {
  survival: [
    'Greetings & Introductions',
    'Numbers & Time',
    'Food & Restaurant',
    'Transport & Directions',
    'Shopping & Money',
    'Health & Emergency',
    'Family & Relationships',
    'Work & Business',
    'Weather & Environment',
    'Culture & Traditions',
  ],
  alphabet: [
    'Basic Letters A-F',
    'Letters G-L',
    'Letters M-R',
    'Letters S-Z',
    'Vowels & Consonants',
    'Letter Combinations',
    'Common Words Spelling',
    'Reading Simple Words',
    'Writing Practice',
    'Reading Short Sentences',
  ],
  numbers: [
    '1-10 Basic Counting',
    '11-100 Numbers',
    'Ordinal Numbers',
    'Time & Clock',
    'Days & Months',
    'Money & Prices',
    'Measurements & Weight',
    'Math Operations',
    'Dates & Calendar',
    'Phone & Address Numbers',
  ],
};


const AIPanningTopicSelectionInputSchema = z.object({
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  week: z.number().int().min(1).max(48),
  language: z.string(),
  previousPerformanceSummary: z.string().optional(),
  availableThemes: z.array(z.string()).describe('List of available themes for the given path.'),
});

const AIPanningTopicSelectionOutputSchema = z.object({
  chosenTopic: z.string().describe('The chosen topic for the week.'),
});

const aiPlanningTopicPrompt = ai.definePrompt({
  name: 'aiPlanningTopicPrompt',
  input: { schema: AIPanningTopicSelectionInputSchema },
  output: { schema: AIPanningTopicSelectionOutputSchema },
  config: {
    maxOutputTokens: 200, // Small output, just a topic string
  },
  prompt:
    `You are an AI language learning assistant whose sole purpose is to suggest the most suitable topic for a language lesson based on provided context.
  The user is on the "{{path}}" learning path for "{{language}}", currently on week {{week}}.
  The user's previous performance summary is: "{{previousPerformanceSummary}}". (If this is empty or "undefined", assume average performance).
  
  Available themes for this path are:
  {{#each availableThemes}}- {{this}}
  {{/each}}

  Based on the user's previous performance (if available) and the available themes, select the single most suitable topic from the 'availableThemes' list for the upcoming week.
  Prioritize themes that might address weaknesses mentioned in the performance summary, or ensure a logical progression from previous themes.
  Return ONLY valid JSON with a single key 'chosenTopic' containing the selected topic as a string. Do not include any other text or markdown.
  `,
});

const LessonGenerationPromptInputSchema = z.object({
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  week: z.number().int().min(1).max(48),
  nativeLanguage: z.string(),
  theme: z.string(),
  pathDescription: z.record(z.string(), z.string()).describe('Description of learning paths.'),
});

const lessonGenerationPrompt = ai.definePrompt({
  name: 'lessonGenerationPrompt',
  input: { schema: LessonGenerationPromptInputSchema },
  output: { schema: WeeklyLessonPlanSchema },
  config: {
    maxOutputTokens: 8192,
  },
  prompt:
    `You are an expert JSON generator specializing in creating language lesson plans.
Your task is to generate a complete 7-day lesson plan for the following parameters:

- Language to teach: {{language}}
- Student native language: {{nativeLanguage}} (all translations should be to this language)
- Learning path: {{path}} ({{lookup pathDescription path}})
- Week number: {{week}}
- Week theme: {{theme}}

You MUST return ONLY a single, valid JSON object that conforms to the structure provided below. Do not include any explanatory text, markdown formatting, or code fences like \`\`\`json.
IMPORTANT: Return ONLY a raw JSON object. No markdown, no backticks, no explanation. Just the JSON.

The JSON object must contain a "days" array with exactly 7 complete day objects.
Each day object must contain:
- A list of vocabulary items.
- A dialogue with several lines.
- An 'exercises' object containing 'fillBlanks', 'multipleChoice', and 'matching' questions.
- A 'culturalNote'.
- 'progressTracking' with a unique badge name.

Use this EXACT JSON structure for your response:

{
  "week": {{week}},
  "language": "{{language}}",
  "path": "{{path}}",
  "title": "Week {{week}}: {{theme}}",
  "description": "A brief description of the learning goals for this week's theme.",
  "days": [
    {
      "day": 1,
      "title": "Day 1 Topic Title",
      "type": "vocabulary",
      "items": [
        {
          "id": "w1",
          "target": "word in {{language}}",
          "phonetic": "pronunciation guide",
          "english": "English meaning",
          "audioText": "word for text-to-speech",
          "exampleSentence": {
            "target": "sentence in {{language}}",
            "english": "English translation"
          }
        }
      ],
      "dialogue": {
        "title": "Short Conversation Scene",
        "lines": [
          {
            "speaker": "A",
            "target": "dialogue in {{language}}",
            "english": "English translation",
            "phonetic": "pronunciation"
          }
        ]
      },
      "exercises": {
        "fillBlanks": [],
        "multipleChoice": [],
        "matching": []
      },
      "culturalNote": "An interesting cultural fact related to the lesson.",
      "progressTracking": {
        "xpReward": 50,
        "streakBonus": 10,
        "badge": "Week{{week}}Day1{{path}}Badge"
      }
    }
  ]
}
`,
});

export const generateDynamicWeeklyLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateDynamicWeeklyLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: WeeklyLessonPlanSchema,
  },
  async (input) => {
    let theme: string;

    if (input.aiPlanningEnabled) {
      const currentPathThemes = weekThemes[input.path];
      const { output } = await aiPlanningTopicPrompt({
        path: input.path,
        week: input.week,
        language: input.language,
        previousPerformanceSummary: input.previousPerformanceSummary,
        availableThemes: currentPathThemes,
      });
      theme = output!.chosenTopic;
    } else {
      if (input.selectedTopic) {
        theme = input.selectedTopic;
      }
      else {
        theme = weekThemes[input.path][(input.week - 1) % weekThemes[input.path].length];
      }
    }

    const response = await lessonGenerationPrompt(
      {
        language: input.language,
        path: input.path,
        week: input.week,
        nativeLanguage: input.nativeLanguage,
        theme: theme,
        pathDescription: pathDescription,
      },
      { model: 'googleai/gemini-1.5-flash-latest' }
    );

    const output = response.output;
    
    console.log('AI raw response:', JSON.stringify(output));

    if (!output) {
      console.error("Genkit validation failed. LLM output did not match schema. Raw text:", response.text);
      throw new Error(
          'The AI failed to generate a valid lesson plan that matched the required structure. Please try again.'
      );
    }
    
    return output;
  }
);

export async function generateDynamicWeeklyLessonPlan(
  input: GenerateLessonPlanInput
): Promise<WeeklyLessonPlanOutput> {
  return generateDynamicWeeklyLessonPlanFlow(input);
}

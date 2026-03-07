'use server';
/**
 * @fileOverview A Genkit flow for generating dynamic weekly lesson plans for the LingoForge app.
 *
 * - generateDynamicWeeklyLessonPlan - A function that generates a complete 7-day lesson plan.
 * - GenerateLessonPlanInput - The input type for the generateDynamicWeeklyLessonPlan function.
 * - WeeklyLessonPlanOutput - The return type for the generateDynamicWeeklyLessonPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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

const LessonItemExampleSentenceSchema = z.object({
  target: z.string(),
  english: z.string(),
  sinhala: z.string(),
  hindi: z.string(),
  urdu: z.string(),
  arabic: z.string(),
  bengali: z.string(),
});

const LessonItemSchema = z.object({
  id: z.string().describe('Unique ID for the vocabulary item, e.g., w1'),
  target: z.string(),
  phonetic: z.string(),
  english: z.string(),
  sinhala: z.string(),
  hindi: z.string(),
  urdu: z.string(),
  arabic: z.string(),
  bengali: z.string(),
  audioText: z.string(),
  exampleSentence: LessonItemExampleSentenceSchema.optional(),
});

const DialogueLineSchema = z.object({
  speaker: z.string(),
  target: z.string(),
  english: z.string(),
  sinhala: z.string(),
  phonetic: z.string(),
});

const DialogueSchema = z.object({
  title: z.string(),
  lines: z.array(DialogueLineSchema).length(4).describe('Exactly 4 dialogue lines.'),
});

const FillBlankExerciseSchema = z.object({
  id: z.string().describe('Unique ID for the fill-in-the-blank question, e.g., fb1'),
  sentence: z.string(),
  answer: z.string(),
  hint: z.string(),
});

const MultipleChoiceExerciseSchema = z.object({
  id: z.string().describe('Unique ID for the multiple choice question, e.g., mc1'),
  question: z.string(),
  options: z.array(z.string()).length(4).describe('Exactly 4 options for multiple choice.'),
  correct: z.number().int().min(0).max(3).describe('Index of the correct option (0-3).'),
  explanation: z.string(),
});

const MatchingExerciseSchema = z.object({
  target: z.string(),
  english: z.string(),
});

const ExercisesSchema = z.object({
  fillBlanks: z.array(FillBlankExerciseSchema).length(3).describe('Exactly 3 fill-in-the-blank questions.'),
  multipleChoice: z.array(MultipleChoiceExerciseSchema).length(3).describe('Exactly 3 multiple choice questions.'),
  matching: z.array(MatchingExerciseSchema).length(5).describe('Exactly 5 matching pairs.'),
});

const CulturalNoteSchema = z.string();

const ProgressTrackingSchema = z.object({
  xpReward: z.number().int(),
  streakBonus: z.number().int(),
  badge: z.string(),
});

const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7),
  title: z.string(),
  type: z.literal('vocabulary'), // Assuming primary type is vocabulary based on prompt
  items: z.array(LessonItemSchema).length(5).describe('Exactly 5 vocabulary items.'),
  dialogue: DialogueSchema,
  exercises: ExercisesSchema,
  culturalNote: CulturalNoteSchema,
  progressTracking: ProgressTrackingSchema.optional(),
});

export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int(),
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  title: z.string(),
  description: z.string(),
  days: z.array(DayLessonSchema).length(7).describe('Exactly 7 days of lessons.'),
});

export type WeeklyLessonPlanOutput = z.infer<typeof WeeklyLessonPlanSchema>;

export const GenerateLessonPlanInputSchema = z.object({
  language: z.string().describe('The target language for the lesson.'),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]).describe('The learning path.'),
  week: z.number().int().min(1).max(48).describe('The week number for the lesson.'),
  nativeLanguage: z.string().describe('The native language of the student.'),
  aiPlanningEnabled: z.boolean().describe('Whether AI planning for the topic is enabled.'),
  selectedTopic: z.string().optional().describe('User-selected topic if AI planning is disabled.'),
  previousPerformanceSummary: z.string().optional().describe('Summary of previous performance for AI planning.'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

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
    `You are a professional language teacher.
Create a complete 7-day lesson week.

Language to teach: {{language}}
Student native language: {{nativeLanguage}}
Learning path: {{path}} ({{pathDescription.[path]}})
Week number: {{week}}
Week theme: {{theme}}

Return ONLY valid JSON. No other text. No markdown.
Use this EXACT structure:

{
  "week": {{week}},
  "language": "{{language}}",
  "path": "{{path}}",
  "title": "Week {{week}}: {{theme}}",
  "description": "Brief description of this week",
  "days": [
    {
      "day": 1,
      "title": "Day 1 topic title (native translation)",
      "type": "vocabulary",
      "items": [
        {
          "id": "w1",
          "target": "word in {{language}}",
          "phonetic": "pronunciation guide",
          "english": "English meaning",
          "sinhala": "සිංහල",
          "hindi": "हिंदी",
          "urdu": "اردو",
          "arabic": "عربي",
          "bengali": "বাংলা",
          "audioText": "word for text-to-speech",
          "exampleSentence": {
            "target": "sentence in {{language}}",
            "english": "English translation",
            "sinhala": "සිංහල",
            "hindi": "हिंदी",
            "urdu": "اردو",
            "arabic": "عربي",
            "bengali": "বাংলা"
          }
        },
        // [w2, w3, w4, w5 - 5 words total, ensure unique IDs like w2, w3, w4, w5]
      ],
      "dialogue": {
        "title": "conversation scene",
        "lines": [
          {
            "speaker": "A",
            "target": "dialogue in {{language}}",
            "english": "English translation",
            "sinhala": "සිංහල",
            "phonetic": "pronunciation"
          },
          // [3 more lines A and B speakers - 4 lines total]
        ]
      },
      "exercises": {
        "fillBlanks": [
          {
            "id": "fb1",
            "sentence": "_____ means Hello in French",
            "answer": "Bonjour",
            "hint": "morning greeting"
          },
          // [2 more questions - 3 questions total, ensure unique IDs like fb2, fb3]
        ],
        "multipleChoice": [
          {
            "id": "mc1",
            "question": "What does Bonjour mean?",
            "options": ["Hello", "Goodbye", "Thank you", "Please"],
            "correct": 0,
            "explanation": "Explanation for correct answer"
          },
          // [2 more questions with 4 options each - 3 questions total, ensure unique IDs like mc2, mc3]
        ],
        "matching": [
          {"target": "Word in {{language}}", "english": "English equivalent"},
          // [4 more pairs - 5 pairs total]
        ]
      },
      "culturalNote": "interesting fact about the language/culture related to the week's theme",
      "progressTracking": {
        "xpReward": 50,
        "streakBonus": 10,
        "badge": "{{language}}_w{{week}}_d{{day}}_{{path}}"
      }
    },
    // [days 2, 3, 4, 5, 6, 7 - ALL 7 DAYS REQUIRED, follow the same structure and critical rules for each day]
  ]
}

CRITICAL RULES:
1. ALL 7 days must be included in the 'days' array.
2. Each day needs exactly 5 vocabulary items in the 'items' array.
3. Each item needs translations in all 6 native languages (english, sinhala, hindi, urdu, arabic, bengali).
4. For each day's dialogue, ensure exactly 4 lines with alternating speakers A and B.
5. For each day's exercises, include exactly 3 fillBlanks questions, 3 multipleChoice questions (each with 4 options), and 5 matching pairs.
6. Return ONLY the JSON object. Do not include \`\`\`json or \`\`\` or any other text.
7. Do not stop until all 7 days are complete.
8. Make content relevant to the "{{theme}}" theme for the current week and learning path.
9. Ensure all 'id' fields (for vocabulary items, fillBlanks, multipleChoice) are unique within their respective arrays for each day. For vocabulary items, use 'w1' through 'w5'. For fillBlanks, 'fb1' through 'fb3'. For multipleChoice, 'mc1' through 'mc3'.
10. All phonetic spellings should be provided in a clear, easy-to-understand phonetic guide, similar to the "Bon-zhoor" example.
11. The 'type' field for each day should primarily be "vocabulary" unless explicitly stated otherwise by the theme.
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
      // LLM output is wrapped in an object { chosenTopic: string }
      theme = output!.chosenTopic;
    } else {
      if (input.selectedTopic) {
        theme = input.selectedTopic;
      }
      else {
        // Fallback to default theme if no topic is selected and AI is off,
        // mimicking the logic from claudeGenerator.ts.
        theme = weekThemes[input.path][(input.week - 1) % weekThemes[input.path].length];
      }
    }

    const { output } = await lessonGenerationPrompt({
      language: input.language,
      path: input.path,
      week: input.week,
      nativeLanguage: input.nativeLanguage,
      theme: theme,
      pathDescription: pathDescription,
    });

    return output!;
  }
);

export async function generateDynamicWeeklyLessonPlan(
  input: GenerateLessonPlanInput
): Promise<WeeklyLessonPlanOutput> {
  return generateDynamicWeeklyLessonPlanFlow(input);
}

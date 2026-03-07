import { z } from 'zod';

export const LessonItemExampleSentenceSchema = z.object({
  target: z.string().describe("The example sentence in the target language."),
  english: z.string().describe("The English translation of the example sentence."),
});

export const LessonItemSchema = z.object({
  id: z.string().describe("A unique ID for the vocabulary item, e.g., 'w1'."),
  target: z.string().describe("The vocabulary word or phrase in the target language."),
  phonetic: z.string().optional().describe("A phonetic transcription of the target word (e.g., IPA)."),
  english: z.string().describe("The English translation of the target word."),
  audioText: z.string().optional().describe("The exact text to be used for text-to-speech generation. Can be omitted if same as 'target'."),
  exampleSentence: LessonItemExampleSentenceSchema.optional().describe("An optional example sentence using the vocabulary item."),
});

export const DialogueLineSchema = z.object({
  speaker: z.enum(["A", "B"]).describe("The speaker in the dialogue, either 'A' or 'B'."),
  target: z.string().describe("The speaker's line in the target language."),
  english: z.string().describe("The English translation of the speaker's line."),
  phonetic: z.string().optional().describe("A phonetic transcription of the line."),
});

export const DialogueSchema = z.object({
  title: z.string().describe("The title of the dialogue (e.g., 'At the Restaurant')."),
  lines: z.array(DialogueLineSchema).describe("An array of dialogue lines."),
});

export const FillBlankExerciseSchema = z.object({
  id: z.string().describe("A unique ID for this question, e.g., 'fb1'."),
  sentence: z.string().describe("A sentence with a blank represented by '_____'."),
  answer: z.string().describe("The correct word or phrase that fills the blank."),
  hint: z.string().optional().describe("An optional hint for the user."),
});

export const MultipleChoiceExerciseSchema = z.object({
  id: z.string().describe("A unique ID for this question, e.g., 'mc1'."),
  question: z.string().describe("The multiple choice question."),
  options: z.array(z.string()).describe("An array of potential answers."),
  correct: z.number().int().min(0).describe("The 0-based index of the correct option in the 'options' array."),
  explanation: z.string().optional().describe("An optional explanation for why the answer is correct."),
});

export const MatchingExerciseSchema = z.object({
  target: z.string().describe("A word or phrase in the target language."),
  english: z.string().describe("The corresponding English translation to be matched."),
});

export const ExercisesSchema = z.object({
  fillBlanks: z.array(FillBlankExerciseSchema).optional().describe("A list of fill-in-the-blank questions."),
  multipleChoice: z.array(MultipleChoiceExerciseSchema).optional().describe("A list of multiple choice questions."),
  matching: z.array(MatchingExerciseSchema).optional().describe("A list of word pairs for a matching exercise."),
});

export const CulturalNoteSchema = z.string();

export const ProgressTrackingSchema = z.object({
  xpReward: z.number().int().describe("Experience points awarded for completing the day."),
  streakBonus: z.number().int().describe("Bonus XP for maintaining a streak."),
  badge: z.string().describe("A unique name for the achievement badge, e.g., 'Week1Day1SurvivalBadge'."),
});

export const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7).describe("The day number within the week (1-7)."),
  title: z.string().describe("The specific topic or title for this day's lesson."),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']).describe("The primary focus of the day's lesson."),
  items: z.array(LessonItemSchema).describe("A list of vocabulary words or phrases for the day."),
  dialogue: DialogueSchema.describe("A conversational dialogue for the day."),
  exercises: ExercisesSchema.describe("An object containing various types of practice exercises."),
  culturalNote: CulturalNoteSchema.optional().describe("A brief, interesting cultural fact related to the lesson. Can be omitted."),
  progressTracking: ProgressTrackingSchema.describe("An object defining the rewards for completing the lesson."),
});

export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int().describe('The week number of the lesson plan.'),
  language: z.string().describe('The target language being taught.'),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]).describe('The learning path this lesson belongs to.'),
  title: z.string().describe("A title for the entire week's lesson plan."),
  description: z.string().describe("A brief description of what the user will learn this week."),
  days: z.array(DayLessonSchema).length(7).describe('An array containing exactly 7 daily lesson objects.'),
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

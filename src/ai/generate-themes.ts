'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define input schema for the theme generation flow
const GenerateThemesInputSchema = z.object({
  targetLanguage: z.string(),
  nativeLanguage: z.string(),
  path: z.string(),
  week: z.number(),
});
type GenerateThemesInput = z.infer<typeof GenerateThemesInputSchema>;

// Define output schema
const GenerateThemesOutputSchema = z.object({
    themes: z.array(z.string()).length(7).describe("An array of 7 unique, one-sentence themes for the week's lessons."),
});
export type GenerateThemesOutput = z.infer<typeof GenerateThemesOutputSchema>;


// This is the function we'll export and call from our server action
export async function generateThemes(input: GenerateThemesInput): Promise<GenerateThemesOutput> {
    const output = await generateThemesFlow(input);
    if (!output) {
      throw new Error("AI did not return a valid theme object.");
    }
    return output;
}

// Define the Genkit flow for generating themes
const generateThemesFlow = ai.defineFlow(
  {
    name: 'generateThemesFlow',
    inputSchema: GenerateThemesInputSchema,
    outputSchema: GenerateThemesOutputSchema,
  },
  async (input) => {
    
    // Define the prompt for the AI
    const themeGenerationPrompt = ai.definePrompt(
      {
        name: 'themeGenerationPrompt',
        model: 'claude-3-sonnet-20240229',
        input: { schema: GenerateThemesInputSchema },
        output: { schema: GenerateThemesOutputSchema },
        prompt: `
          You are an expert curriculum designer for language learners, focusing on practical, real-world skills for migrant workers.

          Your task is to generate a list of 7 distinct, engaging, and logically progressive themes for a single week of language lessons. Each theme should be a short phrase or sentence.

          The themes should build on each other if possible, starting simple and becoming slightly more complex by the end of the week.

          **CRITICAL INSTRUCTIONS:**
          1.  Generate exactly 7 themes.
          2.  The output **MUST** be a single, raw JSON object that validates against this schema: { "themes": ["theme1", "theme2", ...] }
          3.  Do **NOT** wrap the JSON in markdown code blocks.

          **Lesson Parameters:**
          - Target Language: ${input.targetLanguage}
          - Learning Path: ${input.path}
          - Week Number: ${input.week}

          **Example for Path: "survival", Week: 1, Language: "French"**
          {
            "themes": [
              "Basic Greetings & Introductions",
              "Saying Yes/No and Thank You/Please",
              "Numbers 1-10 & Asking 'How much?'",
              "Ordering a Coffee and a Water",
              "Asking for the Bathroom",
              "Saying 'I don't understand'",
              "Asking for Help & Basic Emergencies"
            ]
          }
        `,
        config: {
          temperature: 0.5, 
        },
      },
    );
    
    const response = await themeGenerationPrompt(input);
    const output = response.output;

    if (!output) {
      throw new Error("AI did not return a valid theme object.");
    }
    
    return output;
  }
);

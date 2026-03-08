'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// Define input schema for the flow
const GenerateLessonInputSchema = z.object({
  targetLanguage: z.string(),
  nativeLanguage: z.string(),
  path: z.string(),
  week: z.number(),
  day: z.number(),
  theme: z.string(),
});
export type GenerateLessonInput = z.infer<typeof GenerateLessonInputSchema>;

// This is the function we'll export and call from our server action
export async function generateLesson(input: GenerateLessonInput): Promise<{ json: string } | { error: string }> {
  try {
    const jsonResult = await generateLessonFlow(input);
    return { json: jsonResult };
  } catch (e: any) {
    console.error("Error generating lesson:", e);
    return { error: e.message || "Failed to generate lesson content." };
  }
}

// Define the Genkit flow
const generateLessonFlow = ai.defineFlow(
  {
    name: 'generateLessonFlow',
    inputSchema: GenerateLessonInputSchema,
    outputSchema: z.string(), // We expect a raw JSON string
  },
  async (input) => {
    // Load the schema file. This happens on the server.
    const schemaPath = path.join(process.cwd(), 'docs', 'lesson-schema.json');
    const lessonSchema = await fs.readFile(schemaPath, 'utf-8');

    const samplePath = path.join(process.cwd(), 'docs', 'lesson-generation-guide.md');
    const lessonSampleContent = await fs.readFile(samplePath, 'utf-8');
    const sampleJson = lessonSampleContent.split('```json')[1].split('```')[0].trim();


    // Define the prompt for the AI
    const lessonGenerationPrompt = ai.definePrompt(
      {
        name: 'lessonGenerationPrompt',
        model: 'anthropic/claude-3-sonnet-20240229',
        input: { schema: GenerateLessonInputSchema },
        output: {
          format: 'json',
        },
        prompt: `
          You are an expert curriculum designer specializing in language education.
          Your task is to generate a single daily language lesson.

          **CRITICAL INSTRUCTIONS:**
          1.  The output **MUST** be a single, raw JSON object.
          2.  Do **NOT** wrap the JSON in markdown code blocks (e.g., \`\`\`json).
          3.  The JSON object **MUST** strictly validate against the following JSON Schema.
          4.  Ensure all fields are filled with high-quality, relevant content based on the user's request.
          5.  All 'id' fields must be unique within the lesson file (e.g., 'w1_1_1', 'd1_1_1', 'fb1_1_1').

          **Lesson Parameters:**
          - Target Language: ${input.targetLanguage}
          - Native Language (for translations): ${input.nativeLanguage}
          - Learning Path: ${input.path}
          - Week: ${input.week}
          - Day: ${input.day}
          - Daily Theme: "${input.theme}"

          **JSON Schema to Follow:**
          \`\`\`json
          ${lessonSchema}
          \`\`\`

          **Example of a valid output structure:**
          \`\`\`json
          ${sampleJson}
          \`\`\`
        `,
        config: {
          temperature: 0.3, // Lower temperature for more predictable, structured output
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

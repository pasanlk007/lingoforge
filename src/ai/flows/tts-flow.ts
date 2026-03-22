'use server';
/**
 * @fileOverview A flow for converting text to speech using Google's AI.
 *
 * - textToSpeech - Converts text to a WAV audio data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Converts raw PCM audio data from the AI model into a WAV format base64 string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000, // Gemini TTS default sample rate
  sampleWidth = 2 // 16-bit audio
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d: Buffer) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Define the input schema for our TTS flow
const TextToSpeechInputSchema = z.object({
    text: z.string().describe('The text to convert to speech.'),
    language: z.string().describe('The language of the text.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

// Define the output schema for our TTS flow
const TextToSpeechOutputSchema = z.object({
    media: z.string().describe("The audio data URI in WAV format."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

// Define the Genkit flow for Text-to-Speech
const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text, language }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // This is a simple configuration. A real implementation might map
            // language codes to specific voices for better quality.
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('No media was returned from the AI model.');
    }
    const audioBuffer = Buffer.from(
      // The returned URL is a data URI, so we strip the prefix to get the base64 data.
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // Convert the raw PCM audio to a WAV file and return it as a data URI.
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

/**
 * An exported server action that wraps the Genkit flow.
 * This can be called from client components to generate audio.
 */
export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

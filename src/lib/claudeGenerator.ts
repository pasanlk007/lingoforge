// This file is generated based on user's prompt and should not be modified by the AI.
// The user has specified to use this exact code for the claudeGenerator.
'use server'

import Anthropic from "@anthropic-ai/sdk";
import type { LanguageLesson, LearningPath } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateLesson(
  language: string,
  path: LearningPath,
  week: number,
  nativeLanguage: string = "English",
  topic?: string
): Promise<LanguageLesson> {
  const pathDescription = {
    survival: "everyday survival phrases, greetings, shopping, transport, food, emergency",
    alphabet: "letters of the alphabet, writing system, character recognition, reading basics",
    numbers: "numbers 1-100, counting, dates, time, money, measurements"
  };

  const weekThemes = {
    survival: [
      "Greetings & Introductions", "Numbers & Time",
      "Food & Restaurant", "Transport & Directions",
      "Shopping & Money", "Health & Emergency",
      "Family & Relationships", "Work & Business",
      "Weather & Environment", "Culture & Traditions"
    ],
    alphabet: [
      "Basic Letters A-F", "Letters G-L",
      "Letters M-R", "Letters S-Z",
      "Vowels & Consonants", "Letter Combinations",
      "Common Words Spelling", "Reading Simple Words",
      "Writing Practice", "Reading Short Sentences"
    ],
    numbers: [
      "1-10 Basic Counting", "11-100 Numbers",
      "Ordinal Numbers", "Time & Clock",
      "Days & Months", "Money & Prices",
      "Measurements & Weight", "Math Operations",
      "Dates & Calendar", "Phone & Address Numbers"
    ]
  };

  const theme = topic || 
    weekThemes[path as keyof typeof weekThemes]
    [(week - 1) % 10];

  const prompt = `
You are a professional language teacher.
Create a complete 7-day lesson week.

Language to teach: ${language}
Student native language: ${nativeLanguage}  
Learning path: ${path} (${pathDescription[path as keyof typeof pathDescription]})
Week number: ${week}
Week theme: ${theme}

Return ONLY valid JSON. No other text. No markdown.
Use this EXACT structure as a TypeScript interface LanguageLesson:

{
  "week": ${week},
  "language": "${language}",
  "path": "${path}",
  "title": "Week ${week}: ${theme}",
  "description": "Brief description of this week's content related to ${theme}.",
  "days": [
    {
      "day": 1,
      "title": "Day 1 Topic (e.g., Basic Greetings)",
      "type": "vocabulary",
      "items": [
        {
          "id": "w1",
          "target": "word in ${language}",
          "phonetic": "pronunciation guide",
          "english": "English meaning",
          "sinhala": "සිංහල",
          "hindi": "हिंदी",
          "urdu": "اردو",
          "arabic": "عربي",
          "bengali": "বাংলা",
          "audioText": "word for text-to-speech",
          "exampleSentence": {
            "target": "example sentence in ${language}",
            "english": "English translation",
            "sinhala": "සිංහල",
            "hindi": "हिंदी",
            "urdu": "اردو",
            "arabic": "عربي",
            "bengali": "বাংলা"
          }
        }
      ],
      "dialogue": {
        "title": "A relevant conversation scene",
        "lines": []
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
        "badge": "${language.toLowerCase()}_w${week}_d1_${path}"
      }
    }
  ]
}

CRITICAL RULES:
1.  The final output must be a single, valid JSON object, and nothing else. No "'''json" markers or any other text.
2.  The 'days' array MUST contain exactly 7 complete day objects (day 1 through 7). Do not stop generation early.
3.  Each day's 'items' array MUST contain exactly 5 unique vocabulary words/phrases relevant to the day's topic.
4.  Each vocabulary item MUST have translations for ALL 6 native languages specified (english, sinhala, hindi, urdu, arabic, bengali).
5.  Each day's 'dialogue' MUST contain exactly 4 lines, alternating between speaker "A" and "B".
6.  Each day's 'exercises.fillBlanks' array MUST contain exactly 3 questions.
7.  Each day's 'exercises.multipleChoice' array MUST contain exactly 3 questions, and each question MUST have 4 options.
8.  Each day's 'exercises.matching' array MUST contain exactly 5 pairs.
9.  All content (vocabulary, dialogue, exercises, cultural notes) MUST be relevant to the weekly theme: "${theme}".
10. Ensure JSON syntax is perfect. No trailing commas. All strings properly quoted and escaped.
`;

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307", // As per user request for an updated model
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].type === "text"
      ? response.content[0].text : "";

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    // Basic validation to ensure it's a JSON object
    if (!clean.startsWith('{') || !clean.endsWith('}')) {
      throw new Error("Generated content is not a valid JSON object.");
    }

    return JSON.parse(clean);
  } catch (error) {
    console.error("Error generating lesson from Claude AI:", error);
    throw new Error("Failed to generate or parse lesson from AI.");
  }
}

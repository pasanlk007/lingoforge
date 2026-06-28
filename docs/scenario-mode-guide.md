# Scenario Mode — AI Generation Guide

Isolated feature. Does NOT touch survival/pro/alphabet lesson generation,
schemas, or Firestore collections. New collection only: `scenarioSessions`.

## CRITICAL: Output Format Requirements (same discipline as weekly lessons)

1. **No Markdown** — do not wrap in ```json fences.
2. **No Extra Text** — response must start with `{` and end with `}`.
3. **Proper String Escaping** — escape `\`, `"`, and all control characters
   (`\n`, `\r`, `\t`). Bad control characters break JSON.parse.

---

## ScenarioPlan JSON Schema

```json
{
  "scenario_title": "string",
  "scenario_title_native": "string",
  "scenario_summary": "string",
  "targetLanguage": "string",
  "nativeLanguage": "string",
  "total_days": "number (7 or 14)",
  "daily_topics": [
    {
      "day": "number",
      "topic_title": "string",
      "topic_title_native": "string",
      "situation_context": "string",
      "target_vocab": [
        {
          "id": "string",
          "target": "string",
          "phonetic": "string",
          "native_meaning": "string",
          "english": "string"
        }
      ],
      "sample_dialogue": [
        {
          "id": "string",
          "context": "string",
          "lines": [
            { "speaker": "A", "target": "string", "native": "string", "phonetic": "string" },
            { "speaker": "B", "target": "string", "native": "string", "phonetic": "string" }
          ]
        }
      ],
      "conversation_prompts": ["string", "string", "string"]
    }
  ]
}
```

Notes:
- `target_vocab`: 5-8 items per day, directly relevant to the day's situation.
- `sample_dialogue`: 1-2 dialogues per day, same shape as existing lesson dialogues (reuses `Dialogue`/`DialogueLine` types — no new dialogue type needed).
- `conversation_prompts`: 3-5 open-ended lines the AI voice partner can use to start/continue the live conversation that day. These should escalate slightly in difficulty across the week.
- `total_days`: default to 7 unless the situation clearly needs more runway (e.g. "embassy interview in 3 weeks" → 14).

---

## Sample Prompt for AI (Sonnet)

```
You are generating a personalized daily-conversation plan for a language learner
preparing for a real, specific life situation.

User's situation (raw, may mix Sinhala/English): "{userInputRaw}"

- Target Language: {targetLanguage}
- Native Language: {nativeLanguage}

Infer the user's specific real-world goal from their situation (e.g. job interview,
workplace communication, embassy interview, daily survival in a new role) and design
a {total_days}-day conversation plan that builds toward handling that situation
confidently.

Each day must escalate slightly in complexity. Day 1 should be the most basic,
most essential vocabulary/phrases for the situation. The final day should closely
simulate the real interaction the user described.

The output must be a single, raw JSON object that strictly follows this schema:
<PASTE THE CONTENT OF the ScenarioPlan JSON Schema HERE>

All native-language fields must be in {nativeLanguage}. Phonetic spellings must be
simple and easy for a {nativeLanguage} speaker to read aloud.
```

---

## Sample Output (abridged, Day 1 only)

```json
{
  "scenario_title": "Restaurant Waiter Job in Italy",
  "scenario_title_native": "ඉතාලියේ රෙස්ටුරන්ට් වේටර් රැකියාව",
  "scenario_summary": "User is preparing to work as a waiter in an Italian restaurant.",
  "targetLanguage": "Italian",
  "nativeLanguage": "Sinhala",
  "total_days": 7,
  "daily_topics": [
    {
      "day": 1,
      "topic_title": "Greeting and Seating Customers",
      "topic_title_native": "පිරිස් ආචාර කිරීම සහ අසුන් ගැන්වීම",
      "situation_context": "A customer walks in and you greet them at the door.",
      "target_vocab": [
        {
          "id": "sv1_1",
          "target": "Buonasera, benvenuti!",
          "phonetic": "බුවෝනසේරා, බෙන්වෙනූතී",
          "native_meaning": "සුභ සන්ධ්‍යාවක්, සාදරයෙන් පිළිගන්නවා!",
          "english": "Good evening, welcome!"
        }
      ],
      "sample_dialogue": [],
      "conversation_prompts": [
        "A customer just walked in — greet them.",
        "They ask for a table for two — respond."
      ]
    }
  ]
}
```

---

## Notes on Pronunciation Scoring (Day-level conversation turns)

Stored as `ScenarioConversationTurn.matchScore` (0-100). This is a **fuzzy
intelligibility proxy**, not a true phoneme-level pronunciation score:

1. Whisper transcribes the user's spoken attempt.
2. Compare transcription against `expectedTarget` using normalized edit-distance
   (case/punctuation-insensitive).
3. Score = `100 * (1 - levenshtein(transcribed, expected) / max(len(transcribed), len(expected)))`,
   clamped to 0-100.
4. UI must label this as "~match confidence", never "pronunciation accuracy %",
   to avoid overstating precision.

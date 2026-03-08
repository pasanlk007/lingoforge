# Guide for Generating Daily Language Lessons

To generate a daily lesson file that is compatible with the LingoForge application, the output **must** be a single, raw JSON object that validates against the structure defined in `lesson-schema.json`.

Do not wrap the JSON in markdown code blocks (```json) or any other text. The output must be the JSON object itself.

## Sample Prompt for AI

```
Please generate a daily language lesson based on the following parameters. The output must be a single, raw JSON object that strictly follows the structure defined in the provided JSON Schema.

- **Target Language:** French
- **Native Language:** English
- **Path:** survival
- **Week:** 1
- **Day:** 1
- **Theme:** "Basic Greetings & Introductions"

Here is the JSON schema to follow:
<PASTE THE CONTENT OF lesson-schema.json HERE>

Here is a sample of the expected output structure:
<PASTE THE SAMPLE JSON OBJECT FROM BELOW HERE>
```

---

## Sample JSON Object

This is an example of a valid JSON object for a single day's lesson.

```json
{
  "week": 1,
  "day": 1,
  "title": "Week 1 Day 1: Basic Greetings",
  "title_native": "Semaine 1 Jour 1 : Salutations de base",
  "theme": "Greetings & Introductions",
  "path": "survival",
  "targetLanguage": "French",
  "nativeLanguage": "English",
  "words": [
    {
      "id": "w1_1_1",
      "target": "Bonjour",
      "phonetic": "bon-ZHOOR",
      "native_meaning": "Hello",
      "english": "Hello",
      "example_sentence_target": "Bonjour, comment ça va ?",
      "example_sentence_native": "Hello, how are you?"
    },
    {
      "id": "w1_1_2",
      "target": "Merci",
      "phonetic": "mer-SEE",
      "native_meaning": "Thank you",
      "english": "Thank you",
      "example_sentence_target": "Merci beaucoup.",
      "example_sentence_native": "Thank you very much."
    },
    {
      "id": "w1_1_3",
      "target": "Au revoir",
      "phonetic": "o ruh-VWAHR",
      "native_meaning": "Goodbye",
      "english": "Goodbye",
      "example_sentence_target": "Au revoir, à demain.",
      "example_sentence_native": "Goodbye, see you tomorrow."
    }
  ],
  "dialogues": [
    {
      "id": "d1_1_1",
      "context": "Meeting someone for the first time.",
      "lines": [
        {
          "speaker": "A",
          "target": "Bonjour, je m'appelle Marie.",
          "native": "Hello, my name is Marie.",
          "phonetic": "bon-ZHOOR, zhuh ma-PELL ma-REE."
        },
        {
          "speaker": "B",
          "target": "Bonjour Marie, je suis Paul.",
          "native": "Hello Marie, I am Paul.",
          "phonetic": "bon-ZHOOR ma-REE, zhuh swee POL."
        }
      ]
    }
  ],
  "exercises": {
    "fillBlanks": [
      {
        "id": "fb1_1_1",
        "sentence": "Pour dire 'Hello' en français, on dit __.",
        "answer": "Bonjour",
        "hint": "Starts with 'B'"
      }
    ],
    "matching": [
      {
        "id": "m1_1_1",
        "target": "Bonjour",
        "native": "Hello"
      },
      {
        "id": "m1_1_2",
        "target": "Merci",
        "native": "Thank you"
      }
    ],
    "multipleChoice": [
        {
            "id": "mc1_1_1",
            "question": "How do you say 'Goodbye' in French?",
            "options": [
                "Bonjour",
                "Merci",
                "Au revoir",
                "Oui"
            ],
            "correct": 2,
            "explanation": "'Au revoir' is the common way to say goodbye."
        }
    ]
  },
  "cultural_note": "When greeting someone in France, it's common to shake hands with strangers and do 'la bise' (a kiss on the cheeks) with friends and family.",
  "pronunciation_tip": "The 'r' in 'Bonjour' is a soft sound made in the back of the throat, not a hard 'r' like in English.",
  "progress": {
    "xp": 100,
    "streak_bonus": 20,
    "badge": "W1D1-Greetings"
  }
}
```

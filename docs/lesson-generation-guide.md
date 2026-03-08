# Guide for Generating Weekly Language Lessons

To generate a weekly lesson file that is compatible with the LingoForge application, the output **must** be a single, raw JSON object that validates against the structure defined in `weekly-lesson-schema.json`.

Do not wrap the JSON in markdown code blocks (```json) or any other text. The output must be the JSON object itself.

## Sample Prompt for AI

```
Please generate a complete 7-day weekly language lesson plan based on the following parameters. The output must be a single, raw JSON object that strictly follows the structure defined in the provided JSON Schema for a weekly plan.

- **Target Language:** French
- **Native Language:** Sinhala
- **Path:** survival
- **Week:** 1
- **Overall Weekly Theme:** "Basic Greetings, Introductions, and Politeness"

**Instructions for each day:**
- **Day 1:** Basic Greetings (Bonjour, Merci)
- **Day 2:** Common Politeness (Oui, Non, S'il vous plaît)
- **Day 3:** Introducing Yourself (Je m'appelle...)
- **Day 4:** Asking "How are you?" (Comment ça va?)
- **Day 5:** Saying Goodbye (Au revoir, À bientôt)
- **Day 6:** Numbers 1-5
- **Day 7:** Review and combine concepts from the week.

**For EACH of the 7 days, the JSON object must include:**
- 5 vocabulary `words`.
- At least 2 `dialogues`.
- Exercises: at least one of each type (`fillBlanks`, `matching`, `multipleChoice`, `sentenceScramble`).
- A `cultural_note`.
- A `pronunciation_tip`.
- All text fields for the native language (e.g., `native_meaning`, `example_sentence_native`, `nativeHint`) must be in Sinhala.
- Phonetic spellings should be simple and easy for a Sinhala speaker to read.

Here is the **weekly** JSON schema to follow:
<PASTE THE CONTENT OF weekly-lesson-schema.json HERE>

Here is a sample of the expected **weekly** output structure:
<PASTE THE SAMPLE WEEKLY JSON OBJECT FROM BELOW HERE>
```

---

## Sample Weekly JSON Object

This is an example of a valid JSON object for a single **week's** lesson plan. It contains a `days` array with 7 daily lesson objects.

```json
{
  "week": 1,
  "path": "survival",
  "targetLanguage": "French",
  "nativeLanguage": "Sinhala",
  "days": [
    {
      "week": 1,
      "day": 1,
      "title": "1 වන සතිය, 1 වන දිනය: මූලික සුබ පැතුම්",
      "title_native": "Semaine 1, Jour 1 : Salutations de base",
      "theme": "Greetings & Introductions",
      "path": "survival",
      "targetLanguage": "French",
      "nativeLanguage": "Sinhala",
      "words": [
        {
          "id": "w1_1_1",
          "target": "Bonjour",
          "phonetic": "බොන්-ෂූහ්",
          "native_meaning": "ආයුබෝවන්",
          "english": "Hello",
          "example_sentence_target": "Bonjour, comment ça va ?",
          "example_sentence_native": "ආයුබෝවන්, ඔබට කොහොමද?"
        }
      ],
      "dialogues": [
        {
          "id": "d1_1_1",
          "context": "පළමු වරට කෙනෙකු හමුවීම.",
          "lines": [
            {
              "speaker": "A",
              "target": "Bonjour, je m'appelle Marie.",
              "native": "ආයුබෝවන්, මගේ නම මාරි.",
              "phonetic": "බොන්-ෂූහ්, ෂuh මා-පෙල් මාරි."
            },
            {
              "speaker": "B",
              "target": "Bonjour Marie, je suis Paul.",
              "native": "ආයුබෝවන් මාරි, මම පෝල්.",
              "phonetic": "බොන්-ෂූහ් මාරි, ෂuh ස්වී පෝල්."
            }
          ]
        }
      ],
      "exercises": {
        "sentenceScramble": [
            {
                "id": "ss1_1_1",
                "scrambled": ["ça", "va", "comment", "?"],
                "correct": "comment ça va ?",
                "nativeHint": "ඔබට කොහොමද?"
            }
        ]
      },
      "cultural_note": "ප්‍රංශයේදී, ආගන්තුකයන්ට ආචාර කිරීමේදී අතට අත දීම සහ මිතුරන් හා පවුලේ අය සමඟ 'la bise' (කම්මුල් වලට හාදුවක්) දීම සාමාන්‍ය දෙයකි.",
      "pronunciation_tip": "'Bonjour' හි 'r' යනු ඉංග්‍රීසි භාෂාවේ මෙන් දැඩි 'r' ශබ්දයක් නොව, උගුරේ පිටුපසින් නිකුත් කරන මෘදු ශබ්දයකි.",
      "progress": {
        "xp": 100,
        "streak_bonus": 20,
        "badge": "W1D1-Greetings"
      }
    },
    {
      "week": 1,
      "day": 2,
      "title": "Day 2: Placeholder",
      "title_native": "Placeholder",
      "theme": "Placeholder",
      "path": "survival",
      "targetLanguage": "French",
      "nativeLanguage": "Sinhala",
      "words": [{"id": "w1_2_1", "target": "Placeholder", "phonetic": "Placeholder", "native_meaning": "Placeholder", "english": "Placeholder", "example_sentence_target": "Placeholder.", "example_sentence_native": "Placeholder."}],
      "dialogues": [],
      "exercises": {},
      "cultural_note": "Placeholder",
      "pronunciation_tip": "Placeholder",
      "progress": {
        "xp": 0,
        "streak_bonus": 0,
        "badge": "W1D2-Placeholder"
      }
    }
  ]
}
```

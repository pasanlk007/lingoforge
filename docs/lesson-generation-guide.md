# Guide for Generating Weekly Language Lessons

## CRITICAL: Output Format Requirements

**THE OUTPUT MUST BE A SINGLE, RAW, VALID JSON OBJECT.**

1.  **No Markdown:** Do **not** wrap the JSON in ` ```json ` or any other markdown code blocks.
2.  **No Extra Text:** Do **not** include any explanatory text, greetings, or sign-offs before or after the JSON object. The response body must start with `{` and end with `}`.
3.  **Proper String Escaping:** All string values within the JSON object **must** be properly escaped.
    *   Backslashes (`\`) must be escaped as `\\`.
    *   Double quotes (`"`) within a string must be escaped as `\"`.
    *   **Crucially, all control characters must be escaped.** This includes newlines (`\n` must become `\\n`), carriage returns (`\r` must become `\\r`), tabs (`\t` must become `\\t`), etc. Failure to escape these characters will result in a "Bad control character" parsing error and make the file unreadable.

---

To generate a weekly lesson file that is compatible with the LingoForge application, the output **must** be a single, raw JSON object that validates against the structure defined in `weekly-lesson-schema.json`.

Do not wrap the JSON in markdown code blocks (```json) or any other text. The output must be the JSON object itself.

## Sample Prompt for AI (Week 1)

```
Please generate a complete 7-day weekly language lesson plan for **Week 1** based on the following parameters. The output must be a single, raw JSON object that strictly follows the structure defined in the provided JSON Schema for a weekly plan.

- **Target Language:** French
- **Native Language:** Sinhala
- **Path:** survival
- **Week:** 1
- **Overall Weekly Theme:** "Basic Greetings, Introductions, and Politeness"

**Instructions for each day (Week 1):**
- 5 vocabulary `words`.
- At least 2 `dialogues`.
- Exercises: at least one of each type (`fillBlanks`, `matching`, `multipleChoice`, `sentenceScramble`).
- A `cultural_note`.
- A `pronunciation_tip`.
- All text fields for the native language must be in the specified native language.
- Phonetic spellings should be simple and easy for the native speaker to read.

Here is the **weekly** JSON schema to follow:
<PASTE THE CONTENT OF weekly-lesson-schema.json HERE>
```

---

## Sample Prompt for AI (Week 2 - Basic Communication)

```
Please generate a complete 7-day weekly language lesson plan for **Week 2** based on the following parameters. The output must be a single, raw JSON object that strictly follows the structure defined in the **updated** JSON Schema for a weekly plan.

- **Target Language:** [e.g., Spanish]
- **Native Language:** [e.g., Sinhala]
- **Path:** survival
- **Week:** 2
- **Overall Weekly Theme:** "Basic Communication"

**Daily Themes:**
- **Day 8 (Day 1 of Week 2):** Asking for help
- **Day 9 (Day 2 of Week 2):** Understanding questions
- **Day 10 (Day 3 of Week 2):** Giving simple information
- **Day 11 (Day 4 of Week 2):** Asking location
- **Day 12 (Day 5 of Week 2):** Directions
- **Day 13 (Day 6 of Week 2):** Public places
- **Day 14 (Day 7 of Week 2):** Travel

**CRITICAL INSTRUCTIONS for EACH of the 7 days (Week 2 Plan):**
- **Exactly 6** vocabulary `words`.
- **Exactly 4** standalone `sentences`.
- **Exactly 4** `dialogues`.
- **Exercises:**
    - At least one `fillBlanks` exercise.
    - At least one `matching` exercise.
    - At least one `sentenceScramble` exercise.
- A `cultural_note`.
- A `pronunciation_tip`.
- All text fields for the native language must be in the specified native language.
- Phonetic spellings should be simple and easy for the native speaker to read.

Here is the **weekly** JSON schema to follow (note the updated constraints for Week 2):
<PASTE THE CONTENT OF weekly-lesson-schema.json HERE>
```

---

## Sample Weekly JSON Object (Week 1)

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
          "example_sentence_native": "ආයුබෝවන්, ඔබට කොහොමද?",
          "example_sentence_phonetic": "බොන්-ෂූහ්, කො-මෝන්-සා-වා?"
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
      "words": [{"id": "w1_2_1", "target": "Placeholder", "phonetic": "Placeholder", "native_meaning": "Placeholder", "english": "Placeholder", "example_sentence_target": "Placeholder.", "example_sentence_native": "Placeholder.", "example_sentence_phonetic": "Placeholder."}],
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

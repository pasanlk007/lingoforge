# **App Name**: LingoForge

## Core Features:

- AI-Powered Lesson Generation: Utilize the Anthropic Claude API to dynamically generate comprehensive 7-day language lessons based on user language, path, week, and native language preferences. This tool dynamically tailors vocabulary, dialogues, exercises, and cultural notes.
- Interactive Lesson Modules: Engage users with structured daily lessons featuring vocabulary cards, simulated dialogues, interactive fill-in-the-blank, multiple-choice, and matching exercises.
- Free Audio Pronunciation: Provide native audio pronunciation for target language words and phrases using the Web Speech API, offering a free and accessible listening experience.
- User Authentication & Profiles: Secure user registration and login via Firebase Authentication, alongside a customizable profile to manage learning progress, native language, and chosen target language.
- Progress Tracking & Gamification: Track user progress, maintain daily learning streaks, award XP points and levels, and provide achievement badges to motivate continued engagement, stored in Firestore.
- Subscription & Payments: Manage a tiered subscription model (free, monthly, yearly) using Stripe for payments, enabling access to advanced features like full course content, audio, and the AI Guide.
- Lesson Caching with Firestore: Store all generated lessons in a Firebase Firestore cache to ensure rapid retrieval and consistency across users, avoiding redundant AI generation requests.

## Style Guidelines:

- Color scheme: Dark theme, reflecting a premium and sophisticated learning environment. Primary actions and brand elements use a deep indigo blue (#2E2ECC), conveying intelligence and professionalism. This blue acts as a powerful anchor against darker backgrounds, symbolizing trust and depth in learning. The background is a very dark, slightly bluish-gray (#1A1B1F), providing a sleek, modern foundation that helps content pop and reduces eye strain. Accent elements, interactive components, and highlights use a vibrant cyan (#6DD9FF) for contrast, indicating interactivity and clarity.
- Headline and Body font: 'Inter' (sans-serif), chosen for its modern, clean, and highly legible characteristics. Its objective and neutral aesthetic perfectly suits a content-rich learning application, ensuring optimal readability across various learning modules and for diverse language scripts.
- Utilize modern, clean, and contextually relevant icons for features, lesson types, and navigational elements. Leverage expressive emojis for AI planning categories and a system of flat, outline-style icons to maintain a sophisticated yet intuitive user interface.
- A modular and grid-based layout prioritizes content clarity and accessibility across all pages. The design emphasizes a structured progression through learning paths while maintaining intuitive navigation and clear visual hierarchy for lesson elements, interactive exercises, and user progress displays.
- Subtle and purposeful animations enhance user engagement and provide visual feedback. This includes floating language flag cards on the landing page, smooth card flip animations for vocabulary, and transitions for progress indicators and section reveals, adding a polished, premium feel without distraction.
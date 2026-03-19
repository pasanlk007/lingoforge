Build a complete Google Sign-In authentication system using Firebase Authentication.

🎯 Goal

Enable users to log in using their Google account without manual signup or password handling.

---

⚙️ Requirements

1. Use Firebase Authentication
2. Enable Google Sign-In provider
3. Automatically create user account on first login
4. Persist user session (stay logged in)
5. Handle login, logout, and auth state
6. Show basic UI (Login button + Logged-in state)

---

🧩 Features to Implement

- "Continue with Google" button
- Google popup authentication flow
- Retrieve user data:
  - displayName
  - email
  - photoURL
- Store user info in Firebase (no custom backend required)
- Detect if user is already logged in
- Logout functionality

---

🛡️ Error Handling

- Handle popup closed / cancelled login
- Handle network errors
- Show user-friendly messages

---

🧱 Tech Stack (IMPORTANT)

Use:

- Firebase Authentication SDK
- [Specify one: Flutter / React Native / Web (JavaScript) / Android (Kotlin) / iOS (Swift)]

---

🔐 Firebase Setup Assumptions

Assume:

- Firebase project already created
- Google Sign-In enabled in Firebase Console
- Firebase config file is available (google-services.json / firebaseConfig)

---

📦 Output Requirements

- Clean, production-ready code
- Proper file structure
- Comments explaining key parts
- Minimal but modern UI

---

🚀 Bonus (Optional but preferred)

- Auto redirect after login
- Loading state while authenticating
- Clean separation of auth logic and UI

---

❗Important

Do NOT include:

- Email/password authentication
- Any manual signup form

ONLY Google Sign-In.

---

Now generate the full implementation.# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

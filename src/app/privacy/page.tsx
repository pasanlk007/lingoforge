'use client';

import { Navigation } from "@/components/Navigation";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <div className="prose prose-invert mx-auto">
            <h1>Privacy Policy for LingoForge</h1>
            <p>
              <em>Last Updated: March 8, 2026</em>
            </p>

            <h2>1. Introduction</h2>
            <p>
              Welcome to LingoForge. We are committed to protecting your privacy
              and handling your data in an open and transparent manner. This
              privacy policy sets out how we collect, use, and protect any
              information that you give us when you use this application.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We may collect the following information:</p>
            <ul>
              <li>
                <strong>Account Information:</strong> When you sign up, we
                collect your name, email address, and chosen native/target
                languages.
              </li>
              <li>
                <strong>Usage Data:</strong> We track your progress, including
                completed lessons, XP points, and streaks to personalize your
                learning experience.
              </li>
              <li>
                <strong>Firebase Services:</strong> We use Firebase
                Authentication to manage your account and Firestore to store your
                profile and progress data securely.
              </li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
              We use the information we collect to operate and maintain our
              application, including to:
            </p>
            <ul>
              <li>Personalize your learning path and content.</li>
              <li>Track your progress and achievements.</li>
              <li>Authenticate your account and secure your data.</li>
              <li>Communicate with you about your account or our services.</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We are committed to ensuring that your information is secure. We use
              Firebase, a platform with industry-standard security measures, to
              protect your data from unauthorized access, alteration, or
              disclosure. All data is stored in secure, access-controlled
              databases.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal
              information. You can manage your profile information directly from
              your profile page. If you wish to delete your account entirely,
              please contact us.
            </p>
            
            <h2>6. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of
              any changes by posting the new privacy policy on this page.
            </p>

            <p>
              <Link href="/">Go back to the homepage</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

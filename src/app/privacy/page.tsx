'use client';

import { Navigation } from "@/components/Navigation";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 pb-24">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <div className="prose prose-invert mx-auto">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground italic">Last Updated: May 20, 2026</p>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">1. Introduction</h2>
              <p>
                LingoForge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use our mobile application and website.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">2. Information We Collect</h2>
              <h3 className="text-lg font-medium mt-4">2.1 Personal Information</h3>
              <p>When you create an account, we collect information such as your name, email address, and profile picture (if provided via Google Sign-In).</p>
              
              <h3 className="text-lg font-medium mt-4">2.2 Usage & Progress Data</h3>
              <p>We track your learning progress, including completed lessons, XP points, streaks, and quiz results to provide a personalized learning experience.</p>

              <h3 className="text-lg font-medium mt-4">2.3 Payment Data</h3>
              <p>We process payments through third-party billing services (Google Play Store and RevenueCat). We do not store your credit card numbers directly on our servers; however, we receive transaction tokens to verify your subscription status.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">3. Third-Party Services</h2>
              <p>We use the following third-party services to ensure a seamless experience:</p>
              <ul>
                <li><strong>Google Firebase:</strong> For authentication and secure database storage.</li>
                <li><strong>RevenueCat:</strong> To manage and sync subscriptions across devices.</li>
                <li><strong>Anthropic & OpenAI:</strong> To generate AI-powered lessons and speech-to-text transcriptions.</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">4. Data Deletion & Account Termination</h2>
              <p>
                You have the right to delete your account at any time. You can do this directly within the <strong>Profile</strong> section of the app. Deleting your account will permanently remove all your progress, XP, and personal data from our active databases.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">5. Children's Privacy</h2>
              <p>
                LingoForge is designed for adults and professionals (migrant workers). We do not knowingly collect information from children under the age of 13.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:support@lingoforge.app" className="text-primary underline">support@lingoforge.app</a>
              </p>
            </section>

            <div className="mt-12 pt-6 border-t">
              <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

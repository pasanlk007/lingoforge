'use client';

import { Navigation } from "@/components/Navigation";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 pb-24">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <div className="prose prose-invert mx-auto">
            <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
            <p className="text-muted-foreground italic">Last Updated: May 20, 2026</p>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
              <p>By downloading or using LingoForge, you agree to these Terms and Conditions. If you do not agree, you must cease use of the service immediately.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">2. Description of Service</h2>
              <p>LingoForge provides language learning tools, including structured paths (Survival, Alphabet, Numbers) and AI-powered custom scenario plans.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">3. Pricing and Payments</h2>
              <p>LingoForge offers both one-time purchases and recurring subscriptions:</p>
              <ul>
                <li><strong>Survival Pack ($26):</strong> A one-time payment for lifetime access to the Survival, Alphabet, and Numbers paths for a single chosen language.</li>
                <li><strong>Lifetime Pro ($49):</strong> A one-time payment for lifetime access to ALL current and future languages and paths (excluding Scenario Mode).</li>
                <li><strong>Scenario Mode Monthly ($13/month):</strong> A recurring subscription that unlocks the ability to generate unlimited custom AI conversation plans.</li>
              </ul>
              <p>Prices are in USD and may vary based on local taxes and currency exchange rates managed by the Google Play Store.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">4. Subscriptions & Cancellations</h2>
              <p>
                Scenario Mode is a recurring monthly subscription. It will automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel your subscriptions through your <strong>Google Play Store Account Settings</strong>.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">5. Refunds</h2>
              <p>
                Refunds are handled according to the standard policies of the platform you used for purchase (e.g., Google Play Store). For web-based purchases, we offer a 7-day money-back guarantee.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">6. AI Content Disclaimer</h2>
              <p>
                LingoForge uses artificial intelligence to generate lesson content and custom plans. While we aim for high quality, we do not guarantee the absolute accuracy of AI-generated translations or legal/civic guidance. The service is for educational purposes only.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">7. Contact</h2>
              <p>Questions? Reach us at <a href="mailto:support@lingoforge.app" className="text-primary underline">support@lingoforge.app</a></p>
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

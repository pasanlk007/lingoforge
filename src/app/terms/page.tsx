'use client';

import { Navigation } from "@/components/Navigation";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <div className="prose prose-invert mx-auto">
            <h1>Terms and Conditions for LingoForge</h1>
            <p>
              <em>Last Updated: March 8, 2026</em>
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using LingoForge (the "Service"), you accept and
              agree to be bound by the terms and provision of this agreement. If
              you do not agree to abide by these terms, please do not use this
              Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              LingoForge provides users with AI-powered language learning
              lessons, progress tracking, and other related services. You agree
              that the Service may include certain communications from LingoForge,
              such as service announcements and administrative messages, and that
              these communications are considered part of your subscription.
            </p>

            <h2>3. User Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account and password and for restricting access to your computer.
              You agree to accept responsibility for all activities that occur
              under your account or password.
            </p>

            <h2>4. Content</h2>
            <p>
              All content provided by the Service is for informational and
              educational purposes only. While we strive to provide accurate and
              effective learning materials, we make no guarantees about the
              completeness, reliability, or accuracy of the lesson content.
            </p>

            <h2>5. Prohibited Conduct</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Violate any local, state, national, or international law.
              </li>
              <li>
                Reverse-engineer, decompile, or otherwise attempt to discover the
                source code of the Service.
              </li>
              <li>
                Use any automated means to access the Service for any purpose
                without our express written permission.
              </li>
            </ul>

            <h2>6. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service immediately,
              without prior notice or liability, for any reason whatsoever,
              including without limitation if you breach the Terms.
            </p>
            
            <h2>7. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. We will provide notice of any changes on
              this page.
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

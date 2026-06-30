"use client";

import { useEffect } from "react";

/**
 * An invisible client component that ensures the browser's speech synthesis
 * voices are loaded and ready for use. This is crucial for reliability,
 * especially in WebViews where voice loading can be asynchronous.
 *
 * Some Android WebViews do not implement the Web Speech API at all — this
 * component runs on every page mount, so an unguarded call here was likely
 * the primary trigger for the "ReferenceError: speechSynthesis is not
 * defined" crash seen on dashboard/lesson pages on those devices.
 */
export default function VoiceInit() {
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      // This triggers the browser to fetch the list of available voices.
      window.speechSynthesis.getVoices();

      // The 'onvoiceschanged' event fires when the voice list has been updated.
      // We re-call getVoices() inside the handler to ensure the list is fresh.
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    } catch (e) {
      console.warn("VoiceInit: speechSynthesis init failed, skipping.", e);
    }
  }, []);

  // This component does not render any UI.
  return null;
}

"use client";

import { useEffect } from "react";

/**
 * An invisible client component that ensures the browser's speech synthesis
 * voices are loaded and ready for use. This is crucial for reliability,
 * especially in WebViews where voice loading can be asynchronous.
 */
export default function VoiceInit() {
  useEffect(() => {
    // This triggers the browser to fetch the list of available voices.
    speechSynthesis.getVoices();

    // The 'onvoiceschanged' event fires when the voice list has been updated.
    // We re-call getVoices() inside the handler to ensure the list is fresh.
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };
  }, []);

  // This component does not render any UI.
  return null;
}

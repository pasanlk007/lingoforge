"use client";

import { useEffect } from "react";

export default function VoiceInit() {
  useEffect(() => {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };
  }, []);

  return null;
}

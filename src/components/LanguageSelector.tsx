"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { targetLanguages, nativeLanguages } from "@/lib/translations";
import type { TargetLanguage } from "@/lib/types";

interface LanguageSelectorProps {
  onLanguageChange: (language: TargetLanguage) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg bg-card/80 p-4 backdrop-blur-sm sm:grid-cols-2">
      <div>
        <label htmlFor="target-lang" className="mb-2 block text-left text-sm font-medium text-muted-foreground">
          I want to learn...
        </label>
        <Select defaultValue={targetLanguages[0].lang} onValueChange={(value) => onLanguageChange(value as TargetLanguage)}>
          <SelectTrigger id="target-lang" className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {targetLanguages.map((lang) => (
              <SelectItem key={lang.lang} value={lang.lang}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.lang}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="native-lang" className="mb-2 block text-left text-sm font-medium text-muted-foreground">
          I speak...
        </label>
        <Select defaultValue={nativeLanguages[0]}>
          <SelectTrigger id="native-lang" className="w-full">
            <SelectValue placeholder="Select your language" />
          </SelectTrigger>
          <SelectContent>
            {nativeLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TARGET_LANGUAGES, NATIVE_LANGUAGES } from "@/lib/constants";
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
        <Select defaultValue={TARGET_LANGUAGES[0].name} onValueChange={(value) => onLanguageChange(value as TargetLanguage)}>
          <SelectTrigger id="target-lang" className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.name}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
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
        <Select defaultValue={NATIVE_LANGUAGES[0].name}>
          <SelectTrigger id="native-lang" className="w-full">
            <SelectValue placeholder="Select your language" />
          </SelectTrigger>
          <SelectContent>
            {NATIVE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.name}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

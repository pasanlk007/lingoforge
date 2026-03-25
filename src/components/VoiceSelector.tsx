
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RATE_STORAGE_KEY = 'tts_rate';
const DEFAULT_RATE = 1;

const LINGOFORGE_LANGUAGES = [
  { name: 'English',    code: 'en-US' },
  { name: 'German',     code: 'de-DE' },
  { name: 'French',     code: 'fr-FR' },
  { name: 'Italian',    code: 'it-IT' },
  { name: 'Spanish',    code: 'es-ES' },
  { name: 'Portuguese', code: 'pt-PT' },
  { name: 'Dutch',      code: 'nl-NL' },
  { name: 'Greek',      code: 'el-GR' },
  { name: 'Polish',     code: 'pl-PL' },
  { name: 'Romanian',   code: 'ro-RO' },
  { name: 'Serbian',    code: 'sr-RS' },
  { name: 'Russian',    code: 'ru-RU' },
  { name: 'Finnish',    code: 'fi-FI' },
  { name: 'Korean',     code: 'ko-KR' },
  { name: 'Japanese',   code: 'ja-JP' },
  { name: 'Arabic',     code: 'ar-SA' },
  { name: 'Hebrew',     code: 'he-IL' },
  { name: 'Turkish',    code: 'tr-TR' },
  { name: 'Hindi',      code: 'hi-IN' },
  { name: 'Tamil',      code: 'ta-IN' },
  { name: 'Chinese',    code: 'zh-CN' },
];

function getVoiceKey(langCode: string) { return `tts_voice_${langCode}`; }
function getSavedVoice(langCode: string) { return localStorage.getItem(getVoiceKey(langCode)) || 'default'; }
function saveVoice(langCode: string, voiceName: string) {
  if (voiceName && voiceName !== 'default') {
    localStorage.setItem(getVoiceKey(langCode), voiceName);
  } else {
    localStorage.removeItem(getVoiceKey(langCode));
  }
}

const RATE_LABELS: Record<number, string> = { 0.5: 'Very Slow', 0.7: 'Slow', 1.0: 'Normal', 1.25: 'Fast', 1.5: 'Very Fast' };
function getRateLabel(rate: number) {
  const closest = Object.keys(RATE_LABELS).map(Number).reduce((a, b) => Math.abs(b - rate) < Math.abs(a - rate) ? b : a);
  return RATE_LABELS[closest] ?? `${rate}x`;
}

const PREVIEW_TEXTS: Record<string, string> = {
  'en-US': 'Hello! This is a voice preview.',
  'fr-FR': 'Bonjour! Ceci est un apercu de la voix.',
  'de-DE': 'Hallo! Dies ist eine Sprachvorschau.',
  'es-ES': 'Hola! Esta es una vista previa de voz.',
  'it-IT': 'Ciao! Questa e un anteprima vocale.',
  'ja-JP': 'Konnichiwa! Kore wa onsei purebyū desu.',
  'ko-KR': 'Annyeonghaseyo! Eumsong miribogi imnida.',
  'zh-CN': 'Nihao! Zhe shi yuyin yulan.',
  'ar-SA': 'Marhaba! Hadha maeinatan lilsawt.',
  'hi-IN': 'Namaste! Yah ek aawaz poorvaavalokan hai.',
  'ru-RU': 'Privet! Eto predvaritelnyy prosmotr golosa.',
};

export function VoiceSelector() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const populateVoiceList = useCallback(() => {
    const v = speechSynthesis.getVoices();
    if (v.length > 0) {
      setVoices(v);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    populateVoiceList();
    speechSynthesis.onvoiceschanged = populateVoiceList;

    const savedRate = parseFloat(localStorage.getItem(RATE_STORAGE_KEY) || '');
    if (!isNaN(savedRate)) {
      setRate(savedRate);
    }
  }, [populateVoiceList]);

  useEffect(() => {
    if (isMounted) {
      setSelectedVoice(getSavedVoice(selectedLang));
    }
  }, [selectedLang, isMounted]);

  const voicesForLang = voices.filter(v => {
    if (!v.name) return false; // FIX: Explicitly filter out voices with no name to prevent crash.
    const short = selectedLang.split('-')[0];
    return v.lang === selectedLang || v.lang.startsWith(short);
  });

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    saveVoice(selectedLang, voiceName);
    const langName = LINGOFORGE_LANGUAGES.find(l => l.code === selectedLang)?.name;
    toast({ title: 'Voice Saved', description: `Voice for ${langName} set to ${voiceName === 'default' ? 'Default' : voiceName}.` });
  };

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    localStorage.setItem(RATE_STORAGE_KEY, String(newRate));
  };

  const handlePreview = () => {
    speechSynthesis.cancel();
    const lang = LINGOFORGE_LANGUAGES.find(l => l.code === selectedLang);
    const text = PREVIEW_TEXTS[selectedLang] || `Hello! Preview for ${lang?.name}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = rate;
    if (selectedVoice && selectedVoice !== 'default') {
      const v = voices.find(v => v.name === selectedVoice);
      if (v) utterance.voice = v;
    }
    speechSynthesis.speak(utterance);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Text-to-Speech Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger><SelectValue placeholder="Select language..." /></SelectTrigger>
            <SelectContent className="max-h-60">
              {LINGOFORGE_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}{getSavedVoice(lang.code) !== 'default' ? ' ✓' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Voice for {LINGOFORGE_LANGUAGES.find(l => l.code === selectedLang)?.name}</Label>
          {voicesForLang.length === 0 ? (
            <p className="text-sm text-muted-foreground">No voices available for this language on your device.</p>
          ) : (
            <Select value={selectedVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger><SelectValue placeholder="Select a voice..." /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="default">Default</SelectItem>
                {voicesForLang.map(voice => (
                  <SelectItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang}){voice.localService ? ' 📱' : ' ☁️'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">📱 Local · ☁️ Network</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Speech Rate</Label>
            <span className="text-sm font-medium text-primary">{getRateLabel(rate)}</span>
          </div>
          <Slider min={0.5} max={1.5} step={0.05} value={[rate]} onValueChange={handleRateChange} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5x</span><span>1.0x</span><span>1.5x</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={handlePreview}>
          <Play className="h-4 w-4" />
          Preview Voice
        </Button>
      </CardContent>
    </Card>
  );
}

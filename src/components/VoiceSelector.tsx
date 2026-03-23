'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VOICE_STORAGE_KEY = 'tts_voice';

export function VoiceSelector() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs only on the client side
    setIsMounted(true);
    
    const populateVoiceList = () => {
      const availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const savedVoice = localStorage.getItem(VOICE_STORAGE_KEY);
        setSelectedVoice(savedVoice || '');
      }
    };

    populateVoiceList();
    // The onvoiceschanged event is crucial for some browsers (like Chrome)
    // where the voice list is loaded asynchronously.
    speechSynthesis.onvoiceschanged = populateVoiceList;

  }, []);

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    if (voiceName) {
      localStorage.setItem(VOICE_STORAGE_KEY, voiceName);
    } else {
      // If "Default" is selected, remove the preference
      localStorage.removeItem(VOICE_STORAGE_KEY);
    }
    toast({
      title: "Voice Changed",
      description: `TTS voice set to ${voiceName || 'Default'}.`,
    });
  };

  if (!isMounted || voices.length === 0) {
    // Don't render the component if it's not mounted or no voices are available.
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Text-to-Speech Voice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor="voice-select">Preferred Voice</Label>
        <Select value={selectedVoice} onValueChange={handleVoiceChange}>
          <SelectTrigger id="voice-select">
            <SelectValue placeholder="Select a voice..." />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="">Default</SelectItem>
            {voices.map(voice => (
              <SelectItem key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

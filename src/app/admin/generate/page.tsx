'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { targetLanguages, nativeLanguages } from '@/lib/translations';
import { PATHS } from '@/lib/constants';
import { generateLessonAction } from './actions';
import { Loader2, ClipboardCopy } from 'lucide-react';

export default function AdminGeneratePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');
  const [filePath, setFilePath] = useState('public/lessons/english_french/survival/week_01/day_1.json');

  const updateFilePath = (form: HTMLFormElement) => {
    const native = form.nativeLanguage.value || 'english';
    const target = form.targetLanguage.value || 'french';
    const path = form.path.value || 'survival';
    const week = parseInt(form.week.value, 10) || 1;
    const day = parseInt(form.day.value, 10) || 1;
    const newPath = `public/lessons/${native.toLowerCase()}_${target.toLowerCase()}/${path}/week_${String(week).padStart(2, '0')}/day_${day}.json`;
    setFilePath(newPath);
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    updateFilePath(event.currentTarget);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setGeneratedJson('');
    updateFilePath(event.currentTarget);

    const formData = new FormData(event.currentTarget);
    const result = await generateLessonAction(formData);

    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error,
      });
    } else if (result.json) {
      try {
        const parsed = JSON.parse(result.json);
        setGeneratedJson(JSON.stringify(parsed, null, 2));
        toast({
          title: 'Lesson Generated!',
          description: 'Review the JSON below and save it to the correct file path.',
        });
      } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Parsing Failed',
            description: "The AI returned invalid JSON. Please try again.",
        });
        setGeneratedJson(result.json);
      }
    }
  };

  const handleCopy = () => {
    if (!generatedJson) return;
    navigator.clipboard.writeText(generatedJson);
    toast({ title: 'Copied to clipboard!' });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Lesson</CardTitle>
              <CardDescription>
                Fill out the form to generate a daily lesson using AI. The
                output will be a JSON object that you can save to the correct
                file path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} onChange={handleFormChange} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="targetLanguage">Target Language</Label>
                        <Select name="targetLanguage" defaultValue="French">
                        <SelectTrigger id="targetLanguage">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {targetLanguages.map((lang) => (
                            <SelectItem key={lang.lang} value={lang.lang}>{lang.lang}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nativeLanguage">Native Language</Label>
                         <Select name="nativeLanguage" defaultValue="English">
                        <SelectTrigger id="nativeLanguage">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {nativeLanguages.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="path">Learning Path</Label>
                    <Select name="path" defaultValue="survival">
                        <SelectTrigger id="path">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {PATHS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="week">Week</Label>
                        <Input id="week" name="week" type="number" defaultValue="1" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="day">Day</Label>
                        <Input id="day" name="day" type="number" defaultValue="1" required />
                    </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme">Daily Theme</Label>
                  <Input
                    id="theme"
                    name="theme"
                    placeholder="e.g., Basic Greetings & Introductions"
                    defaultValue="Basic Greetings & Introductions"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Generate Lesson"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-4">
              <Card className="h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Generated JSON Output</CardTitle>
                            <CardDescription>Copy this and save it to the file path below.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!generatedJson}>
                            <ClipboardCopy />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <Textarea
                        readOnly
                        value={generatedJson || "JSON output will appear here..."}
                        className="h-full min-h-[400px] resize-none font-mono text-xs"
                    />
                </CardContent>
            </Card>
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                <p className="font-semibold">File Path:</p>
                <code className="text-xs break-all">{filePath}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

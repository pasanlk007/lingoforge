'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/Navigation';
import { targetLanguages, nativeLanguages } from '@/lib/translations';
import { PATHS } from '@/lib/constants';
import { generateWeeklyLessonAction } from './actions';
import { Loader2, ClipboardCopy, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminGeneratePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');
  const [lessonCacheId, setLessonCacheId] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setGeneratedJson('');
    setLessonCacheId('');

    const formData = new FormData(event.currentTarget);
    const result = await generateWeeklyLessonAction(formData);

    setIsGenerating(false);

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

        const id = `${formData.get('targetLanguage')}_${formData.get('path')}_week_${formData.get('week')}`.toLowerCase();
        setLessonCacheId(id);
        
        toast({
          title: 'Weekly Lesson Generated!',
          description: 'Review the JSON below and save it to the cache.',
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

  const handleCopyToClipboard = () => {
    if (!generatedJson) return;
    navigator.clipboard.writeText(generatedJson);
    toast({ title: 'Copied to clipboard!' });
  }

  const handleCacheLesson = async () => {
    if (!generatedJson || !lessonCacheId || !firestore) {
        toast({ variant: 'destructive', title: 'Caching Failed', description: 'No lesson content or ID to cache.' });
        return;
    }
    setIsCaching(true);
    try {
        const lessonRef = doc(firestore, 'lessonCache', lessonCacheId);
        await setDoc(lessonRef, {
            id: lessonCacheId,
            lessonJson: generatedJson,
            cachedAt: serverTimestamp(),
        });
        toast({ title: 'Lesson Cached!', description: `Successfully saved ${lessonCacheId} to Firestore.`});
    } catch(e: any) {
        console.error("Failed to cache lesson:", e);
        toast({ variant: 'destructive', title: 'Firestore Error', description: e.message || "Could not write to lesson cache."});
    } finally {
        setIsCaching(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Generate & Cache Weekly Lesson</CardTitle>
              <CardDescription>
                Fill out the form to generate a 7-day lesson plan. Review the JSON, then save it to the Firestore cache.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="space-y-2">
                    <Label htmlFor="week">Week</Label>
                    <Input id="week" name="week" type="number" defaultValue="1" min="1" max="48" required />
                </div>
                
                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="animate-spin" /> : "Generate Weekly Lesson"}
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
                            <CardDescription>Review, then save to the Firestore cache.</CardDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button variant="outline" size="icon" onClick={handleCopyToClipboard} disabled={!generatedJson}>
                              <ClipboardCopy />
                          </Button>
                          <Button variant="default" size="icon" onClick={handleCacheLesson} disabled={!generatedJson || isCaching}>
                              {isCaching ? <Loader2 className="animate-spin"/> : <Save />}
                          </Button>
                        </div>
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
            {lessonCacheId && (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                  <p className="font-semibold">Firestore Cache ID:</p>
                  <code className="text-xs break-all">{lessonCacheId}</code>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Sparkles, Bot } from 'lucide-react';
import { chatWithAIGuide } from '@/ai/flows/chat-with-ai-guide-flow';

export function AIGuideClient() {
  const [question, setQuestion] = useState('');
  const [lessonContext, setLessonContext] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this might come from a global state management library
    const targetLanguage = localStorage.getItem('targetLanguage') || 'French';
    const activePath = localStorage.getItem('activePath') || 'Survival';
    setLessonContext(`Current language: ${targetLanguage}, Current path: ${activePath}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const result = await chatWithAIGuide({
        userQuestion: question,
        lessonContext: lessonContext,
      });
      setResponse(result.aiResponse);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-primary" />
          <span>LingoForge AI Guide</span>
        </CardTitle>
        <CardDescription>
          Ask anything about your language journey. Get explanations, grammar help, or cultural insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-question">Your Question</Label>
            <Textarea
              id="ai-question"
              placeholder="e.g., 'What's the difference between 'bonjour' and 'salut'?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
             <p className="text-xs text-muted-foreground">Context: {lessonContext}</p>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Thinking...' : 'Ask AI Guide'}
          </Button>
        </form>
      </CardContent>

      {(isLoading || response || error) && (
        <CardFooter className="flex flex-col items-start gap-4">
            <div className="w-full space-y-4">
                {isLoading && (
                    <div className="flex items-start space-x-4">
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                            <Bot className="h-5 w-5" />
                         </div>
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {response && (
                    <div className="flex items-start space-x-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                           <Bot className="h-5 w-5" />
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                           <p className="whitespace-pre-wrap">{response}</p>
                        </div>
                    </div>
                )}
            </div>
        </CardFooter>
      )}
    </Card>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { translations } from '@/lib/translations';
import { Label } from './ui/label';
import { isNativeApp } from '@/lib/isNativeApp';

interface DailyReminder {
  enabled: boolean;
  time: string;
}

export function ReminderCard() {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'prompt' | 'denied' | 'granted'>('default');
  const [reminder, setReminder] = useState<DailyReminder>({ enabled: false, time: '09:00' });
  const { toast } = useToast();

  const t_dashboard = (isMounted && translations[nativeLanguage]?.dashboard) ? translations[nativeLanguage].dashboard : translations.English.dashboard;
  const t_notifications = (isMounted && translations[nativeLanguage]) ? translations[nativeLanguage].notifications : translations.English.notifications;

  useEffect(() => {
    setIsMounted(true);
    const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    const savedTargetLang = localStorage.getItem("targetLanguage");
    if (savedTargetLang) {
      setTargetLanguage(savedTargetLang);
    }
    
    const checkPermissions = async () => {
      if (isNativeApp()) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const status = await LocalNotifications.checkPermissions();
          setPermission(status.display as any);
        } catch (e) {
          console.error("Capacitor permissions check failed", e);
        }
      } else if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    checkPermissions();
    
    const savedReminder = localStorage.getItem('lingoforge_daily_reminder');
    if (savedReminder) {
      try {
        const parsed = JSON.parse(savedReminder);
        if(typeof parsed.enabled === 'boolean' && typeof parsed.time === 'string') {
          setReminder(parsed);
        }
      } catch (e) {
        console.error("Failed to parse reminder from localStorage", e);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (isNativeApp()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.requestPermissions();
        setPermission(status.display as any);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Native error', description: 'Failed to request notification permissions.' });
      }
    } else if ('Notification' in window) {
      const status = await Notification.requestPermission();
      setPermission(status);
    } else {
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: 'This browser does not support desktop notifications.',
      });
    }
  };

  const handleReminderChange = (field: keyof DailyReminder, value: boolean | string) => {
    setReminder(prev => ({ ...prev, [field]: value }));
  };
  
  const saveReminder = async () => {
    setIsSaving(true);
    try {
      if (reminder.enabled && permission !== 'granted') {
         toast({
          variant: 'destructive',
          title: t_dashboard.reminders.permissionNeeded,
          description: 'Please grant notification permission to enable daily study reminders.',
        });
        setIsSaving(false);
        return;
      }

      localStorage.setItem('lingoforge_daily_reminder', JSON.stringify(reminder));

      if (isNativeApp()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // Cancel existing daily reminders
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

        if (reminder.enabled) {
          const [hours, minutes] = reminder.time.split(':').map(Number);
          
          await LocalNotifications.schedule({
            notifications: [
              {
                id: 1,
                title: t_notifications.title,
                body: t_notifications.body.replace('{language}', targetLanguage),
                schedule: {
                  on: { hour: hours, minute: minutes },
                  repeats: true,
                  allowWhileIdle: true,
                },
                sound: 'default',
              },
            ],
          });
        }
      }

      toast({ title: t_dashboard.reminders.saved });
    } catch (e: any) {
      console.error("Failed to save reminder", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save reminder. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }

  if (!isMounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          {t_dashboard.reminders.title}
        </CardTitle>
        <CardDescription>
          {t_dashboard.reminders.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permission !== 'granted' ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              {t_dashboard.reminders.permissionNeeded}
            </p>
            <Button onClick={requestPermission}>{t_dashboard.reminders.grantPermission}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="daily-reminder-switch" className="font-semibold">{t_dashboard.reminders.dailyReminder}</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="time"
                        value={reminder.time}
                        disabled={!reminder.enabled}
                        className="w-28"
                        onChange={(e) => handleReminderChange('time', e.target.value)}
                    />
                    <Switch
                        id="daily-reminder-switch"
                        checked={reminder.enabled}
                        onCheckedChange={(checked) => handleReminderChange('enabled', checked)}
                    />
                </div>
            </div>
            <Button onClick={saveReminder} className="w-full mt-4" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t_dashboard.reminders.save}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { BellRing, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { translations } from '@/lib/translations';
import { Label } from './ui/label';

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_NAME_MAP: { [key: number]: string } = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };

interface Reminder {
  day: string;
  enabled: boolean;
  time: string;
}

export function ReminderCard() {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [isMounted, setIsMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState<Reminder[]>([]);
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
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    const savedReminders = localStorage.getItem('lingoforge_reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    } else {
      setReminders(WEEK_DAYS.map(day => ({ day, enabled: false, time: '09:00' })));
    }
  }, []);

  useEffect(() => {
    if (permission !== 'granted' || !isMounted || reminders.length === 0) {
      return;
    }

    const checkReminders = () => {
      const now = new Date();
      const currentDayKey = DAY_NAME_MAP[now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      const reminderForToday = reminders.find(r => r.day === currentDayKey);
      
      if (reminderForToday && reminderForToday.enabled && reminderForToday.time === currentTime) {
        new Notification(t_notifications.title, {
          body: t_notifications.body.replace('{language}', targetLanguage),
          icon: '/icon.png' 
        });
      }
    };
    
    checkReminders(); // Check immediately on load
    const intervalId = setInterval(checkReminders, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [permission, reminders, isMounted, targetLanguage, t_notifications]);


  const requestPermission = () => {
    if (!('Notification' in window)) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: 'This browser does not support desktop notifications.',
      });
      return;
    }
    Notification.requestPermission().then(setPermission);
  };

  const handleReminderChange = (day: string, field: 'enabled' | 'time', value: boolean | string) => {
    setReminders(reminders.map(r => r.day === day ? { ...r, [field]: value } : r));
  };
  
  const saveReminders = () => {
    if (permission !== 'granted' && reminders.some(r => r.enabled)) {
       toast({
        variant: 'destructive',
        title: 'Permission Required',
        description: 'Please grant notification permission to save enabled reminders.',
      });
      return;
    }
    localStorage.setItem('lingoforge_reminders', JSON.stringify(reminders));
    toast({
      title: t_dashboard.reminders.saved,
    });
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
            {reminders.map(({ day, enabled, time }) => (
              <div key={day} className="flex items-center justify-between gap-4">
                <Label htmlFor={`switch-${day}`} className="min-w-[3rem] font-semibold">{t_dashboard.days[day as keyof typeof t_dashboard.days]}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    disabled={!enabled}
                    className="w-28"
                    onChange={(e) => handleReminderChange(day, 'time', e.target.value)}
                  />
                  <Switch
                    id={`switch-${day}`}
                    checked={enabled}
                    onCheckedChange={(checked) => handleReminderChange(day, 'enabled', checked)}
                  />
                </div>
              </div>
            ))}
            <Button onClick={saveReminders} className="w-full mt-4">{t_dashboard.reminders.save}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

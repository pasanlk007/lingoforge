'use client';
import { useState, useEffect } from 'react';
import { useRemoteConfig } from '@/firebase';
import { fetchAndActivate, getAll, getValue, getBoolean, getNumber, getString } from 'firebase/remote-config';

// Safe default config as required
const DEFAULT_CONFIG = {
  lessons_weeks_enabled: { week1: true, week2: true, week3: true },
  free_trial_days: 3,
  require_previous_week_completion: true,
  max_free_weeks: 1,
  app_mode: "normal"
};

export type AppConfig = typeof DEFAULT_CONFIG;

// Safe config loader function as required
function getSafeConfig(remoteValues: Partial<AppConfig>): AppConfig {
  const config = { ...DEFAULT_CONFIG, ...remoteValues };

  // Validate types and apply defaults if validation fails
  if (typeof config.free_trial_days !== 'number' || isNaN(config.free_trial_days)) {
    config.free_trial_days = DEFAULT_CONFIG.free_trial_days;
  }
  if (typeof config.max_free_weeks !== 'number' || isNaN(config.max_free_weeks)) {
    config.max_free_weeks = DEFAULT_CONFIG.max_free_weeks;
  }
  if (typeof config.require_previous_week_completion !== 'boolean') {
    config.require_previous_week_completion = DEFAULT_CONFIG.require_previous_week_completion;
  }
  if (typeof config.lessons_weeks_enabled !== 'object' || config.lessons_weeks_enabled === null) {
    config.lessons_weeks_enabled = DEFAULT_CONFIG.lessons_weeks_enabled;
  }
  if (!['normal', 'maintenance'].includes(config.app_mode)) {
    config.app_mode = DEFAULT_CONFIG.app_mode;
  }
  
  return config;
}

/**
 * A hook to safely fetch, cache, and access Firebase Remote Config values.
 * It handles loading states, errors, and fallbacks to a safe default configuration.
 */
export function useAppConfig() {
    const remoteConfig = useRemoteConfig();
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!remoteConfig) return;

        // Set cache settings. In production, a longer interval is better.
        // The prompt asks for 12 hours. 12 * 60 * 60 * 1000 = 43200000
        remoteConfig.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 10000 : 43200000;
        
        // Set default values. This is a fallback for the getter functions if fetch fails.
        remoteConfig.defaultConfig = {
          'lessons_weeks_enabled': JSON.stringify(DEFAULT_CONFIG.lessons_weeks_enabled),
          'free_trial_days': DEFAULT_CONFIG.free_trial_days,
          'require_previous_week_completion': DEFAULT_CONFIG.require_previous_week_completion,
          'max_free_weeks': DEFAULT_CONFIG.max_free_weeks,
          'app_mode': DEFAULT_CONFIG.app_mode,
        };

        const fetchConfig = async () => {
            try {
                await fetchAndActivate(remoteConfig);
                const remoteValues: Partial<AppConfig> = {
                    free_trial_days: getNumber(remoteConfig, 'free_trial_days'),
                    require_previous_week_completion: getBoolean(remoteConfig, 'require_previous_week_completion'),
                    max_free_weeks: getNumber(remoteConfig, 'max_free_weeks'),
                    app_mode: getString(remoteConfig, 'app_mode') as 'normal' | 'maintenance',
                };
                try {
                  remoteValues.lessons_weeks_enabled = JSON.parse(getString(remoteConfig, 'lessons_weeks_enabled'));
                } catch {
                  // JSON parsing failed, safe default will be applied by getSafeConfig
                }
                
                setConfig(getSafeConfig(remoteValues));
            } catch (err: any) {
                console.error("Remote Config fetch failed, using defaults.", err);
                setError(err);
                setConfig(getSafeConfig({})); // Use defaults
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, [remoteConfig]);

    return { config, isLoading, error };
}
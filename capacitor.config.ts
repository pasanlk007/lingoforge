import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingoforge.app',
  appName: 'LingoForge',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f1923',
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingoforge.app',
  appName: 'LingoForge',
  webDir: 'out',
  server: {
    url: 'https://lingoforge.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f1923',
  },
};

export default config;

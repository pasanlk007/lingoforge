import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingoforge.app',
  appName: 'BhashaGuru',
  webDir: 'out',
  server: {
    url: 'https://lingoforge.app',
    cleartext: false,
    allowNavigation: ['studio-3754329818-ee8cf.firebaseapp.com', 'accounts.google.com', '*.googleapis.com'],
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#0f1923',
  },
};

export default config;

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

  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '157119324096-gse15lm640iflcvgi25kbrj6tnhl36ee.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
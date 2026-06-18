import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.justlog.app',
  appName: 'JustLog',
  webDir: 'out',
  server: {
    url: 'https://just-log-nu.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;

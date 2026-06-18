import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.justlog.app',
  appName: 'JustLog',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;

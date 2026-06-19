import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.justlog.app',
  appName: 'JustLog',
  webDir: 'out',
  server: {
    url: 'https://just-log-nu.vercel.app',
    cleartext: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '756989560868-hcod837ib8atuo11dtnkrm3nves8i916.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

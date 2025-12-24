import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tumbi.app',
  appName: 'Tumbi Marketplace',
  webDir: 'dist',
  server: {
    url: 'https://tumbi-app.vercel.app/',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'tumbi-app.vercel.app',
      'tumbi-backend.bekalu77.workers.dev'
    ]
  }
};

export default config;

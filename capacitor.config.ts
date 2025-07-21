import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.avyo.ingathering',
  appName: 'AVYO In-Gathering',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },  
  plugins: {
    App: {
      deepLinkSchemes: ['avyo'],
    },
  },
};

export default config;

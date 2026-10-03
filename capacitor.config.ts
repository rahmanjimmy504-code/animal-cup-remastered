import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jimmyrahman.animalcup',
  appName: 'Animal Cup Remastered',
  webDir: 'public',
  server: {
    url: 'https://animal-cup.rahmanjimmy504.workers.dev/',
    cleartext: false,
    allowNavigation: ['animal-cup.rahmanjimmy504.workers.dev'],
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: false,
    backgroundColor: '#5d9038',
  },
};

export default config;

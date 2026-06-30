import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.clubmanager',
  appName: 'Club Manager',
  // Vite gera o build estático em `dist`; o Capacitor empacota essa pasta.
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config

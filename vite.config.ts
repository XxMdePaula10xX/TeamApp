import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
// `base` vem de VITE_BASE (ex.: "/clubmanager/" no GitHub Pages); default "/"
// para Firebase Hosting / dev.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // O app tem alvo iOS 13 (IPHONEOS_DEPLOYMENT_TARGET=13.0). Sem definir
    // target, o Vite deixaria `??`/`?.` crus (ES2020) no bundle, e o WebKit
    // do iOS 13.0–13.3 lança SyntaxError no parse → tela branca. Transpila
    // para baixo cobrindo Safari 13.0.
    target: ['es2019', 'safari13'],
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase é grande; em chunk próprio melhora o cache do browser.
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
        },
      },
    },
  },
})

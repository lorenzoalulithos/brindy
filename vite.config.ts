import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH lets the same build run under a sub-path (GitHub Pages: /brindy/). Native/Capacitor builds keep '/'.
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // public/ assets and the manifest icons are already matched by globPatterns below.
      includeManifestIcons: false,
      // Single source of truth for the web app manifest (emitted as manifest.webmanifest and linked automatically).
      manifest: {
        name: 'Brindy — Party Games 3D',
        short_name: 'Brindy',
        description: 'Party games 3D per serate epiche.',
        lang: 'it',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0614',
        theme_color: '#0b0614',
        icons: [{ src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // App shell + every lazy game chunk + fonts + the rapier physics chunk (its wasm is inlined, ~2 MB).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,wasm,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        // Keep the heavy physics engine in its own, clearly named chunk shared by the games that use it.
        manualChunks: (id) => (id.includes('@dimforge/rapier') ? 'rapier' : undefined),
      },
    },
  },
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Only activate Service Worker in production builds
      devOptions: { enabled: false },
      workbox: {
        // Pre-cache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // Network-first for API calls (fail fast, don't serve stale orders)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Static menu — stale-while-revalidate (serve instantly, update in bg)
            urlPattern: /\/api\/menu/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-menu-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Aura & Spice',
        short_name: 'AuraSpice',
        description: 'Premium dine-in ordering experience',
        theme_color: '#d4af37',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if ('writeHead' in res && typeof res.writeHead === 'function') {
              (res as import('http').ServerResponse).writeHead(503, {
                'Content-Type': 'application/json',
              });
              (res as import('http').ServerResponse).end(
                JSON.stringify({
                  success: false,
                  message: 'API server offline. Run \'npm start\' for full API support.',
                })
              );
            }
          });
        },
      },
    },
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome61',
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'react-vendor'
            }

            if (id.includes('/@supabase/')) {
              return 'supabase-vendor'
            }

            if (id.includes('/framer-motion/') || id.includes('/canvas-confetti/')) {
              return 'motion-vendor'
            }

            if (id.includes('/lucide-react/')) {
              return 'ui-vendor'
            }

            if (id.includes('@sentry/')) {
              return 'sentry-vendor'
            }
          }

          return undefined
        },
      },
    },
  },
  base: '/',
  define: {
    __VITE_PUBLIC_URL__: JSON.stringify(env.VITE_PUBLIC_URL ?? 'https://auraspice.example.com'),
  },
}
})

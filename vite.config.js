import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // ======================
  // GITHUB PAGES BASE PATH
  // ======================

  base: '/aplikasi-berbagi-cerita/',

  // ======================
  // ROOT PROJECT
  // ======================

  root: 'src',

  // ======================
  // PUBLIC DIRECTORY
  // ======================

  publicDir: '../public',

  // ======================
  // BUILD CONFIGURATION
  // ======================

  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      injectRegister: 'auto',

      includeAssets: [
        'favicon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'screenshots/desktop.png',
        'screenshots/mobile.png',
      ],

      manifest: {
        name: 'Story App',

        short_name: 'StoryApp',

        description: 'Aplikasi berbagi cerita',

        theme_color: '#0f172a',

        background_color: '#ffffff',

        display: 'standalone',

        // ======================
        // PWA URL CONFIG
        // ======================

        start_url: '/aplikasi-berbagi-cerita/',

        scope: '/aplikasi-berbagi-cerita/',

        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },

          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },

          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

        screenshots: [
          {
            src: 'screenshots/desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Halaman utama desktop',
          },

          {
            src: 'screenshots/mobile.png',
            sizes: '540x720',
            type: 'image/png',
            label: 'Halaman utama mobile',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,png,svg,jpg,jpeg,webp,json}',
        ],

        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/story-api\.dicoding\.dev\/v1\/stories/,

            handler: 'NetworkFirst',

            options: {
              cacheName: 'stories-api-cache',

              expiration: {
                maxEntries: 50,

                maxAgeSeconds:
                  60 * 60 * 24,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: ({ request }) =>
              request.destination ===
              'image',

            handler: 'CacheFirst',

            options: {
              cacheName: 'images-cache',

              expiration: {
                maxEntries: 60,

                maxAgeSeconds:
                  60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
});
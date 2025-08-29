import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
VitePWA({ registerType: 'autoUpdate', workbox: { cleanupOutdatedCaches: true, /* … */ }})


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // SWを自動更新（新ビルドが出たら差し替え）
      registerType: 'autoUpdate',
      devOptions: { enabled: false }, // 開発時も本番に近い挙動に
      includeAssets: ['favicon.svg'],

      // オフライン対応のワークボックス設定
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          // HTML/JSON はネット優先（3秒でキャッシュfallback）
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'document' || url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-and-json',
              networkTimeoutSeconds: 3,
            },
          },
          // 画像はキャッシュ優先
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },

      // PWAマニフェスト
      manifest: {
        name: 'Keiba Predictor',
        short_name: 'KeibaAI',
        start_url: '/',        // ルート開始（iOSでもOK）
        scope: '/',            // スコープ明示（任意だけど推奨）
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5e9',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],

  // LAN共有開発を楽に（npm run dev だけで iPhone から見える）
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  // 生成物を軽量化（任意）
  build: {
    target: 'es2019', // iOS 15+ならOK
    sourcemap: false
  }
})

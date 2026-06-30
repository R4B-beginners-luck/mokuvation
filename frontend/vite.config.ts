import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // キャッシュ対象ファイル
        // ⚠️ wasm が抜けていたため、Automerge(CRDT)が使う .wasm 本体が
        // オフライン時にキャッシュから読めず、起動処理が止まって画面が
        // 真っ白になるバグがあった。wasm を追加して解消する。
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        // デフォルトの上限(2MB)だと automerge の wasm(約1.8MB)がギリギリ／
        // 将来的なバージョンアップで超える可能性があるため余裕を持たせる
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // API は NetworkFirst（オフライン時のみキャッシュ使用）
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Mokuvation',
        short_name: 'Mokuvation',
        description: '目標・タスク管理アプリ',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'ja',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

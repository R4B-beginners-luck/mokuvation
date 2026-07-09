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
      // ⚠️ registerType: 'prompt' のままだと、新しいSWが見つかっても
      // アプリ側で明示的に updateSW(true) を呼ぶまでずっと「待機中」で止まる。
      // 待機中のSWはまだ現在開いてるページを制御(control)していないため、
      // その状態でオフラインにすると navigateFallback が一切効かず、
      // ブラウザ本体の「インターネットに接続できません」ページが出てしまう。
      // autoUpdate にすると、新しいSWが見つかり次第すぐ有効化・制御まで行うため、
      // 「気づいたらオフライン対応が効いていない」状態を避けられる。
      registerType: 'autoUpdate',
      injectRegister: false,
      devOptions: {
        enabled: false,
      },
      workbox: {
        // registerType: 'autoUpdate' の場合デフォルトでもtrueだが、
        // 「新しいSWをインストール後すぐ有効化し、既存タブもすぐ制御下に置く」
        // 挙動を明示しておく（初回インストール直後にオフラインへ切り替える
        // ようなテストでも、SWの制御が間に合わないケースを減らせる）。
        skipWaiting: true,
        clientsClaim: true,
        // キャッシュ対象ファイル
        // ⚠️ wasm が抜けていたため、Automerge(CRDT)が使う .wasm 本体が
        // オフライン時にキャッシュから読めず、起動処理が止まって画面が
        // 真っ白になるバグがあった。wasm を追加して解消する。
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        // デフォルトの上限(2MB)だと automerge の wasm(約1.8MB)がギリギリ／
        // 将来的なバージョンアップで超える可能性があるため余裕を持たせる
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // ⚠️ これが無いと、SPAのナビゲーションリクエスト（リロード/画面遷移）に
        // 対するフォールバックルートがSWに生成されず、オフライン時にリロードすると
        // アプリのindex.htmlではなくブラウザのネイティブ「オフライン」エラー画面
        // （ERR_INTERNET_DISCONNECTED）が表示されてしまう。
        // precacheされたindex.htmlを常に返すことでSPAとして正しく起動できるようにする。
        navigateFallback: '/index.html',
        // /api/ 宛のリクエストはnavigation(ページ遷移)ではないので通常は該当しないが、
        // 念のため明示的にfallback対象から除外しておく。
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // API は NetworkFirst（オフライン時のみキャッシュ使用）
            // ⚠️ method指定が無いとPATCH/POST/DELETEまでSWが横取りしてしまう。
            // Cache APIはGET以外をcache.put()できず、更新系リクエストがSW経由だと
            // 素のfetch失敗と異なる壊れ方をして isNetworkFailure() の判定が
            // すり抜け、オフラインフォールバックが効かないバグの原因になっていた。
            // 更新系はキャッシュ不要なのでそもそもSWを通す必要がなく、GETのみに限定する。
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            method: 'GET',
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

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8')) as { version: string }

/** Vercel / CI の短いコミットハッシュ。無いときは local */
const gitSha = (
  process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.CF_PAGES_COMMIT_SHA
  || process.env.GITHUB_SHA
  || 'local'
).slice(0, 7)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_GIT_SHA__: JSON.stringify(gitSha),
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    VitePWA({
      // ⚠️ 従来の generateSW（workboxオプションを直接書くだけの方式）では、
      // /api/* のキャッシュキーにユーザー識別情報を混ぜるカスタムプラグイン
      // (cacheKeyWillBeUsed)を差し込めないため、自前のService Worker
      // (src/sw.ts)をビルドに注入する injectManifest 戦略に変更した。
      // プリキャッシュ対象ファイルの一覧だけは、従来通り自動的に
      // self.__WB_MANIFEST へ注入される。
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      devOptions: {
        enabled: false,
      },
      injectManifest: {
        // キャッシュ対象ファイル
        // ⚠️ wasm が抜けていたため、Automerge(CRDT)が使う .wasm 本体が
        // オフライン時にキャッシュから読めず、起動処理が止まって画面が
        // 真っ白になるバグがあった。wasm を追加して解消する。
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        // デフォルトの上限(2MB)だと automerge の wasm(約1.8MB)がギリギリ／
        // 将来的なバージョンアップで超える可能性があるため余裕を持たせる
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
            purpose: 'any',
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
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

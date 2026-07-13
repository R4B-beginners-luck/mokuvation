/// <reference lib="webworker" />
/**
 * sw.ts
 *
 * vite-plugin-pwa の injectManifest 戦略で使うカスタムService Worker。
 *
 * 【なぜ generateSW から切り替えたか】
 * 従来の generateSW(workboxオプションをvite.config.tsに書くだけの方式)では、
 * /api/* のGETレスポンスを NetworkFirst でキャッシュしていたが、Workboxの
 * デフォルトのキャッシュキーは「URLのみ」で、Authorizationヘッダー(誰の
 * リクエストか)を一切区別しない。
 *
 * そのため、同じ端末で別アカウントに切り替えた場合、オンライン時は問題
 * ないが、オフライン中やAPIが5秒タイムアウトした瞬間にNetworkFirstが
 * このキャッシュへフォールバックすると、前のユーザーの /api/tasks 等の
 * レスポンスがそのまま新しいユーザーの画面に返ってきてしまう
 * （Dexie/CRDT側の別アカウント混入バグとは別レイヤーの、同種の問題）。
 *
 * generateSW はビルド時にワークロードを固定コードへ変換するだけで、
 * cacheKeyWillBeUsed のようなカスタムのWorkboxプラグインを差し込めない
 * ため、injectManifest（＝このファイルを自分で書き、プリキャッシュ対象の
 * 一覧だけビルド時に self.__WB_MANIFEST へ注入してもらう方式）に切り替え、
 * 下記の userScopedCacheKeyPlugin でキャッシュキーにユーザー識別情報を
 * 含めるようにした。
 */

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import type { WorkboxPlugin } from 'workbox-core/types';

declare const self: ServiceWorkerGlobalScope;

// ─── 静的アセットのプリキャッシュ ──────────────────────────────
// self.__WB_MANIFEST はビルド時に vite-plugin-pwa が実ファイル一覧へ
// 差し替える（旧 workbox.globPatterns 相当）。
precacheAndRoute(self.__WB_MANIFEST);

// ─── SWの更新反映（main.tsx の registerSW 側からの制御を受け付ける） ──
// main.tsx は registerType:'prompt' のまま、更新検知時に自前で
// updateSW(true) を呼んで即時反映する設計（詳細は main.tsx のコメント参照）。
// updateSW(true) は 'SKIP_WAITING' メッセージを待機中のSWへ送るため、
// ここで受け取れるようにしておく（generateSW時代は自動生成されていたが、
// injectManifestでは自前で用意する必要がある）。
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── SPAナビゲーションのフォールバック ─────────────────────────
// オフライン時にリロード/画面遷移しても、ブラウザ本体の
// 「インターネットに接続できません」画面ではなく、常に index.html
// （precache済み）を返すことでSPAとして正しく起動できるようにする。
// /api/ 宛はnavigationではなく通常該当しないが、念のため除外しておく。
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  }),
);

// ─── APIキャッシュのキーにログインユーザーを区別する情報を含める ──
// リクエストの Authorization ヘッダー(Bearerトークン)を軽量にハッシュ化し、
// キャッシュキー(URL)のクエリパラメータとして付与する。
// これにより、ユーザー(トークン)が変われば別々のキャッシュエントリとして
// 保存・参照されるため、NetworkFirstがオフライン等でキャッシュへ
// フォールバックしても、別アカウントのレスポンスが返ることがなくなる。
//
// トークンの生値をそのままキーに使うと、キャッシュのURL一覧
// (chrome://inspect 等)から見えてしまいログ的にもリスクがあるため、
// SHA-256でハッシュ化した上で先頭16文字だけを使う。
const hashAuthHeader = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
};

const userScopedCacheKeyPlugin: WorkboxPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const auth = request.headers.get('Authorization') ?? 'anonymous';
    const scope = await hashAuthHeader(auth);
    const url = new URL(request.url);
    url.searchParams.set('__u', scope);
    return url.toString();
  },
};

// ─── API(GET)は NetworkFirst（オフライン時のみキャッシュ使用） ────
// method指定が無いとPATCH/POST/DELETEまで横取りしてしまう
// （Cache APIはGET以外をcache.put()できず、素のfetch失敗と異なる
// 壊れ方をしてisNetworkFailure()の判定をすり抜けるバグの原因になる）
// ため、GETのみに限定する。
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      userScopedCacheKeyPlugin,
    ],
  }),
  'GET',
);

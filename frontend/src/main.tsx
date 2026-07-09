import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// registerType: 'prompt' のため、新しいSWが見つかっても自動activateしない。
// ただし「待機中のまま放置される」と、待機中のSWは現在開いてるページを
// 制御(control)していないため、その状態でオフラインにするとnavigateFallbackが
// 効かず、ブラウザネイティブの「インターネットに接続できません」エラー画面が
// 出てしまう（実際に起きていた問題）。
//
// registerType: 'autoUpdate' にする案もあったが、過去に「更新の度に自動リロード
// →その瞬間の通信不安定でAPI取得が失敗→画面がダミーデータに化ける」という
// 別バグ（TopPage.tsx側、修正済み）の影響で「PWAの自動読み込みが画面表示を
// 壊す」ように見えたことがあったため、まずは挙動を大きく変えずに済む
// 「registerTypeはpromptのまま、更新を検知したら手動ですぐupdateSWを呼ぶ」
// 方式にする。動作としてはautoUpdateとほぼ同じ（見つかり次第即activate＋
// 必要なら1回だけ自動リロード）だが、onNeedRefresh側にログを残せるので、
// また同じような不具合が起きた時に「更新が原因か」を切り分けやすくなる。
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[PWA] 新しいバージョンのService Workerを検知したため、即時反映します。');
    void updateSW(true);
  },
  onOfflineReady() {
    console.info('[PWA] オフライン利用の準備ができました（Service Worker有効化・キャッシュ完了）。');
  },
  onRegisteredSW(swUrl, registration) {
    console.info('[PWA] Service Worker registered:', swUrl, registration);
  },
  onRegisterError(error) {
    console.error('[PWA] Service Worker の登録に失敗しました:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

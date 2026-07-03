import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// registerType: 'prompt' のため、新しいSWが見つかっても自動activateしない。
// 今回はまずSW自体を登録することが目的なので、シンプルに即時更新する運用にする
// （将来的に「更新があります」トースト等をUIに出したくなったら onNeedRefresh 側で対応する）
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

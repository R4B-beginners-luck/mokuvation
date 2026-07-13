/**
 * デバッグ表示の有効判定。
 *
 * 通常は開発サーバー（import.meta.env.DEV）のみ。
 * 本番 / Preview の実機調査用に、設定画面のバージョン連打で
 * localStorage を ON にした場合も有効になる。
 *
 * 有効化:
 * - 開発: URL ?mapDebug=1 または localStorage
 * - 本番/Preview: 設定のバージョン表示を連続タップ → 目標マップへ
 */
export function isDebugEnabled(options?: {
  /** localStorage のキー（例: 'goal-map-debug'） */
  storageKey?: string;
  /** URL クエリ名（例: 'mapDebug'） */
  queryParam?: string;
}): boolean {
  if (typeof window === 'undefined') return false;

  const storageKey = options?.storageKey;
  const queryParam = options?.queryParam;

  try {
    if (storageKey && localStorage.getItem(storageKey) === '1') {
      return true;
    }
    // URL クエリは開発時のみ（一般ユーザーが偶然付けても本番では無効）
    if (import.meta.env.DEV && queryParam) {
      return new URLSearchParams(window.location.search).get(queryParam) === '1';
    }
  } catch {
    return false;
  }

  return false;
}

export const MAP_DEBUG_STORAGE_KEY = 'goal-map-debug';

export function isMapDebugStorageOn(): boolean {
  try {
    return localStorage.getItem(MAP_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMapDebugStorage(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(MAP_DEBUG_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(MAP_DEBUG_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

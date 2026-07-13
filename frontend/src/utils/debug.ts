/**
 * 開発時のみ有効なデバッグ表示用ヘルパー。
 * 本番ビルド（import.meta.env.DEV === false）では常に false。
 *
 * 有効化（開発時のみ）:
 * - URL: ?mapDebug=1 など flag クエリ
 * - localStorage: key に '1' をセット
 */
export function isDebugEnabled(options?: {
  /** localStorage のキー（例: 'goal-map-debug'） */
  storageKey?: string;
  /** URL クエリ名（例: 'mapDebug'） */
  queryParam?: string;
}): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;

  const storageKey = options?.storageKey;
  const queryParam = options?.queryParam;

  try {
    if (storageKey && localStorage.getItem(storageKey) === '1') {
      return true;
    }
    if (queryParam) {
      return new URLSearchParams(window.location.search).get(queryParam) === '1';
    }
  } catch {
    return false;
  }

  return false;
}

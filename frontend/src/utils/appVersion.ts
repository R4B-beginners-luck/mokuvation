/**
 * アプリの表示用バージョン情報。
 * Vite の define でビルド時に埋め込む（vite.config.ts）。
 */
export function getAppVersionLabel(): string {
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
  const sha = typeof __APP_GIT_SHA__ === 'string' ? __APP_GIT_SHA__ : '';
  if (sha && sha !== 'local') {
    return `v${version} (${sha})`;
  }
  return `v${version}`;
}

export function getAppVersionMeta(): { version: string; gitSha: string } {
  return {
    version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0',
    gitSha: typeof __APP_GIT_SHA__ === 'string' ? __APP_GIT_SHA__ : 'local',
  };
}

/** 認証フォーム共通の文字数制限（フロント検証用） */
export const AUTH_FIELD_LIMITS = {
  userId: { min: 4, max: 32, label: 'ユーザーID' },
  userName: { min: 1, max: 10, label: 'ユーザー名' },
  password: { min: 8, max: 72, label: 'パスワード' },
} as const;

export type AuthFieldKey = keyof typeof AUTH_FIELD_LIMITS;

export function validateAuthLength(
  key: AuthFieldKey,
  value: string,
): string | null {
  const { min, max, label } = AUTH_FIELD_LIMITS[key];
  const len = value.trim().length;
  // パスワードは trim せず生の長さで見る（前後空白も文字数に含める）
  const rawLen = key === 'password' ? value.length : len;
  if (rawLen === 0) return null; // 空は required / 別メッセージ側
  if (rawLen < min) return `${label}は${min}文字以上で入力してください`;
  if (rawLen > max) return `${label}は${max}文字以内で入力してください`;
  return null;
}

/** タスク完了時にチェック横へ表示する短い一言（カジュアル） */
export const TASK_COMPLETION_MESSAGES = [
  'いいね！',
  'その一歩、ちゃんと見えてる。',
  '小さくても、前に進んだ。',
  '続けられてるのが強い。',
  '今日の自分、えらい。',
  '積み重ねが効いてる。',
  'いいリズム。',
  'ここまで来れた。',
] as const;

/**
 * 目標達成時に中央オーバーレイへ表示するメッセージ。
 * `{goalName}` は達成した目標名に置換する。
 */
export const GOAL_COMPLETION_MESSAGE_TEMPLATES = [
  '「{goalName}」を達成しました。積み重ねてきたものが、ここに繋がりましたね。',
  '「{goalName}」、クリアおめでとう。ここまで来るの、簡単じゃなかったはず。',
  '「{goalName}」を達成。一歩一歩、ちゃんと意味がある。',
  '「{goalName}」に到達しました。続けてきた自分を、一度褒めてあげて。',
  '「{goalName}」達成。次の一歩も、きっと踏み出せる。',
  '「{goalName}」を成し遂げました。遠回りでも、前に進んだ証です。',
] as const;

export function pickRandomTaskMessage(): string {
  const index = Math.floor(Math.random() * TASK_COMPLETION_MESSAGES.length);
  return TASK_COMPLETION_MESSAGES[index] ?? TASK_COMPLETION_MESSAGES[0];
}

export function pickRandomGoalMessage(goalName: string): string {
  const index = Math.floor(Math.random() * GOAL_COMPLETION_MESSAGE_TEMPLATES.length);
  const template = GOAL_COMPLETION_MESSAGE_TEMPLATES[index] ?? GOAL_COMPLETION_MESSAGE_TEMPLATES[0];
  return template.replace(/\{goalName\}/g, goalName);
}

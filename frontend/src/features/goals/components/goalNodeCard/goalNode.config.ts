import { Flag, Target, ListChecks, HelpCircle, type LucideIcon } from "lucide-react";

/**
 * 目標の「状態」。分野色やUI操作（選択）とは別軸。
 * 状態色（赤/緑/アンバー）とUI色（紫=選択）はここ＝予約色で、分野パレットからは除外する。
 */
export type GoalStatus = "todo" | "in_progress" | "due_soon" | "overdue" | "done";

export interface GoalTypeMeta {
  label: string;
  icon: LucideIcon; // 暫定。意味は弱め（種別変更に強くするため）
}

/**
 * 目標種別の定義はここだけ。将来「長期 / 関連」などに変えるときも
 * このマップを編集するだけで全カードに反映される（カード本体は触らない）。
 */
export const GOAL_TYPE_CONFIG: Record<string, GoalTypeMeta> = {
  long: { label: "長期", icon: Flag },
  mid: { label: "中期", icon: Target },
  short: { label: "短期", icon: ListChecks },
  // 例) related: { label: "関連", icon: Workflow },
};

export const FALLBACK_TYPE: GoalTypeMeta = { label: "目標", icon: HelpCircle };

export interface StatusMeta {
  badge?: "text" | "warning" | "danger" | "check"; // 右上の出し方（未指定＝出さない）
  label?: string;
  outline?: boolean; // カード全体を赤枠に（期限切れ）
  warningOutline?: boolean; // カード全体を黄枠に（期限間近）
  dimmed?: boolean; // 低彩度＋取り消し線
}

/**
 * 状態ごとの「どこまで見せるか」を定義。
 * 未着手は何も出さない／進行中は小さく／期限切れは枠＋バッジで強調／達成は低彩度＋チェック。
 */
export const STATUS_CONFIG: Record<GoalStatus, StatusMeta> = {
  todo: {},
  in_progress: { badge: "text", label: "進行中" },
  due_soon: { badge: "warning", label: "期限間近", warningOutline: true },
  overdue: { badge: "danger", label: "期限切れ", outline: true },
  done: { badge: "check", dimmed: true },
};

/**
 * 進捗の単位（"タスク" / "子目標"）は原則アダプタ（toProgress）が
 * 配下の再帰集計で決め、progress.unit としてカードに渡す（仕様書 §4・§5）。
 * 下記マップは progress.unit を省略したときのフォールバックのみ。
 */
export const PROGRESS_UNIT: Record<string, "子目標" | "タスク"> = {
  long: "タスク",
  mid: "タスク",
  short: "タスク",
};
import type { MouseEvent } from "react";
import { Check, Clock } from "lucide-react";
import "./goal-node.css";
import {
  GOAL_TYPE_CONFIG,
  FALLBACK_TYPE,
  STATUS_CONFIG,
  PROGRESS_UNIT,
  type GoalStatus,
} from "./goalNode.config";

export interface GoalProgress {
  done: number;
  total: number;
  /** 省略時は goalType から自動（長期/中期=子目標、短期=タスク） */
  unit?: "子目標" | "タスク";
}

/** ズーム率に応じた表示密度（LOD） */
export type NodeDensity = "full" | "compact" | "mini";

export interface GoalNodeCardProps {
  goalType: string; // "long" | "mid" | "short" | 将来の種別
  status: GoalStatus;
  title: string;
  progress: GoalProgress;
  /** ユーザーが設定する分野色（左バー）。状態色とは別管理＝混在させない */
  categoryColor: string;
  /** 一時的なUI操作の状態。状態テキストは出さず枠の発光だけで表す */
  selected?: boolean;
  density?: NodeDensity;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
}

export default function GoalNodeCard({
  goalType,
  status,
  title,
  progress,
  categoryColor,
  selected = false,
  density = "full",
  onClick,
  onContextMenu,
}: GoalNodeCardProps) {
  const type = GOAL_TYPE_CONFIG[goalType] ?? FALLBACK_TYPE;
  const st = STATUS_CONFIG[status];
  const TypeIcon = type.icon;
  const unit = progress.unit ?? PROGRESS_UNIT[goalType] ?? "子目標";
  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const cls = [
    "gnc",
    `gnc--${density}`,
    selected && "gnc--selected",
    st.outline && "gnc--overdue",
    st.warningOutline && "gnc--due-soon",
    st.dimmed && "gnc--done",
  ]
    .filter(Boolean)
    .join(" ");

  // さらに縮小：色＋アイコンだけ
  if (density === "mini") {
    return (
      <div
        className={cls}
        onClick={onClick}
        onContextMenu={onContextMenu}
        role="button"
        tabIndex={0}
        aria-label={`${type.label}：${title}`}
        title={title}
      >
        <span className="gnc__bar" style={{ background: categoryColor }} aria-hidden />
        <TypeIcon size={20} className="gnc__miniIcon" aria-hidden />
      </div>
    );
  }

  // 縮小：目標名だけ
  if (density === "compact") {
    return (
      <div
        className={cls}
        onClick={onClick}
        onContextMenu={onContextMenu}
        role="button"
        tabIndex={0}
        title={title}
      >
        <span className="gnc__bar" style={{ background: categoryColor }} aria-hidden />
        <div className="gnc__titleOneLine">{title}</div>
        <div className="gnc__track gnc__track--thin">
          <div className="gnc__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  // 通常：全情報
  return (
    <div
      className={cls}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
      tabIndex={0}
    >
      <span className="gnc__bar" style={{ background: categoryColor }} aria-hidden />

      <div className="gnc__top">
        <span className="gnc__type">
          <TypeIcon size={13} aria-hidden />
          {type.label}
        </span>

        {st.badge === "text" && <span className="gnc__statusText">{st.label}</span>}
        {st.badge === "warning" && (
          <span className="gnc__badge gnc__badge--warning">
            <Clock size={13} aria-hidden />
            {st.label}
          </span>
        )}
        {st.badge === "danger" && (
          <span className="gnc__badge gnc__badge--danger">
            <Clock size={13} aria-hidden />
            {st.label}
          </span>
        )}
        {st.badge === "check" && <Check className="gnc__checkIcon" size={13} strokeWidth={2.5} aria-hidden />}
      </div>

      <div className="gnc__title">{title}</div>

      <div className="gnc__progress">
        <div className="gnc__track">
          <div className="gnc__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="gnc__count">
          {unit} {progress.done}/{progress.total}
        </span>
      </div>
    </div>
  );
}

/*
使用例:
<GoalNodeCard
  goalType={goal.type}            // "long" | "mid" | "short"（将来の種別もOK）
  status={goal.status}           // "todo" | "in_progress" | "overdue" | "done"
  title={goal.title}
  progress={{ done: 4, total: 7 }}   // unit 省略で goalType から自動
  categoryColor={goal.categoryColor} // ユーザー設定の分野色（状態色とは別）
  selected={goal.id === selectedId}
  density={zoom < 0.5 ? "mini" : zoom < 0.8 ? "compact" : "full"}
  onClick={() => selectGoal(goal.id)}
  onContextMenu={(e) => openMenu(e, goal.id)}
/>
*/
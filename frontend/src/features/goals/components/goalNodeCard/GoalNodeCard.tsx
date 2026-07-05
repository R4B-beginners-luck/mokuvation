import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
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
  /** 一時的なUI操作の状態。選択時は着地バウンス＋控えめな枠で表す */
  selected?: boolean;
  density?: NodeDensity;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
}

/** 着地バウンスの CSS 時間と揃える（animationend 未発火時のフォールバック用） */
const LANDING_ANIMATION_MS = 420;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function LongTermPin() {
  return (
    <div className="gnc-pin" aria-hidden>
      <span className="gnc-pin__head" />
      <span className="gnc-pin__shaft" />
    </div>
  );
}

function LongTermCardWrap({
  density,
  isLanding,
  onLandingEnd,
  children,
}: {
  density: NodeDensity;
  isLanding: boolean;
  onLandingEnd: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "gnc-wrap",
        "gnc-wrap--long",
        `gnc-wrap--${density}`,
        isLanding && "gnc-wrap--landing",
      ]
        .filter(Boolean)
        .join(" ")}
      onAnimationEnd={isLanding ? onLandingEnd : undefined}
    >
      <LongTermPin />
      {children}
    </div>
  );
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
  const isLong = goalType === "long";
  const prevSelectedRef = useRef(selected);
  const [isLanding, setIsLanding] = useState(false);

  // selected が false→true になった瞬間だけ着地バウンスを再生（選択中はループしない）
  useEffect(() => {
    if (selected && !prevSelectedRef.current) {
      // 動きを減らす設定では CSS animation が走らず animationend も来ないため、
      // isLanding を立てない（gnc--selected の枠だけで選択を示す）
      if (!prefersReducedMotion()) {
        setIsLanding(true);
      }
    }
    prevSelectedRef.current = selected;
  }, [selected]);

  // animationend のフォールバック（環境差・子要素からのバブル漏れ対策）
  useEffect(() => {
    if (!isLanding) return undefined;
    if (prefersReducedMotion()) {
      setIsLanding(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setIsLanding(false), LANDING_ANIMATION_MS + 80);
    return () => window.clearTimeout(timer);
  }, [isLanding]);

  const endLanding = useCallback(() => {
    setIsLanding(false);
  }, []);

  const type = GOAL_TYPE_CONFIG[goalType] ?? FALLBACK_TYPE;
  const st = STATUS_CONFIG[status];
  const TypeIcon = type.icon;
  const unit = progress.unit ?? PROGRESS_UNIT[goalType] ?? "子目標";
  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const cls = [
    "gnc",
    `gnc--${density}`,
    isLong && "gnc--long",
    selected && "gnc--selected",
    !isLong && isLanding && "gnc--landing",
    st.outline && "gnc--overdue",
    st.warningOutline && "gnc--due-soon",
    st.dimmed && "gnc--done",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapIfLong = (card: ReactNode) =>
    isLong ? (
      <LongTermCardWrap density={density} isLanding={isLanding} onLandingEnd={endLanding}>
        {card}
      </LongTermCardWrap>
    ) : (
      card
    );

  const landingProps = isLong
    ? {}
    : { onAnimationEnd: isLanding ? endLanding : undefined };

  // さらに縮小：色＋アイコンだけ
  if (density === "mini") {
    return wrapIfLong(
      <div
        className={cls}
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...landingProps}
        role="button"
        tabIndex={0}
        aria-label={`${type.label}：${title}`}
        title={title}
      >
        <span className="gnc__bar" style={{ background: categoryColor }} aria-hidden />
        <TypeIcon size={20} strokeWidth={1.75} className="gnc__miniIcon" aria-hidden />
      </div>
    );
  }

  // 縮小：目標名だけ
  if (density === "compact") {
    return wrapIfLong(
      <div
        className={cls}
        onClick={onClick}
        onContextMenu={onContextMenu}
        {...landingProps}
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
  return wrapIfLong(
    <div
      className={cls}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...landingProps}
      role="button"
      tabIndex={0}
    >
      <span className="gnc__bar" style={{ background: categoryColor }} aria-hidden />

      <div className="gnc__top">
        <span className="gnc__type">
          <TypeIcon size={13} strokeWidth={1.75} aria-hidden />
          {type.label}
        </span>

        {st.badge === "text" && <span className="gnc__statusText">{st.label}</span>}
        {st.badge === "warning" && (
          <span className="gnc__badge gnc__badge--warning">
            <Clock size={13} strokeWidth={1.75} aria-hidden />
            {st.label}
          </span>
        )}
        {st.badge === "danger" && (
          <span className="gnc__badge gnc__badge--danger">
            <Clock size={13} strokeWidth={1.75} aria-hidden />
            {st.label}
          </span>
        )}
        {st.badge === "check" && <Check className="gnc__checkIcon" size={13} strokeWidth={1.75} aria-hidden />}
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

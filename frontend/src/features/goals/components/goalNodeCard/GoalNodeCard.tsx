import { useCallback, useEffect, useRef, useState, type AnimationEvent, type MouseEvent, type ReactNode } from "react";
import { Check, Clock, MapPin } from "lucide-react";
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
  /** 一時的なUI操作の状態。中期・短期は紫ピン、長期は枠発光のみ */
  selected?: boolean;
  /** ghost = 達成済み親の痕跡表示（点線枠・薄い文字・進捗非表示） */
  variant?: 'default' | 'ghost';
  density?: NodeDensity;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
}

/** CSS の gnc-select-pin-drop / lift と揃える（animationend 未発火時のフォールバック） */
const PIN_ENTER_MS = 380;
const PIN_EXIT_MS = 280;

/** 中期・短期の選択ピン：入場→留まる→退場 */
type SelectionPinPhase = "idle" | "entering" | "pinned" | "exiting";

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
  isGhost = false,
  children,
}: {
  density: NodeDensity;
  isGhost?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "gnc-wrap",
        "gnc-wrap--long",
        `gnc-wrap--${density}`,
        isGhost && "gnc-wrap--ghost",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <LongTermPin />
      {children}
    </div>
  );
}

function SelectionPin({
  phase,
  density,
  onAnimationEnd,
}: {
  phase: SelectionPinPhase;
  density: NodeDensity;
  onAnimationEnd: (e: AnimationEvent<HTMLDivElement>) => void;
}) {
  const iconSize = density === "mini" ? 22 : density === "compact" ? 24 : 28;

  return (
    <div
      className={[
        "gnc-select-pin",
        phase === "entering" && "gnc-select-pin--entering",
        phase === "pinned" && "gnc-select-pin--pinned",
        phase === "exiting" && "gnc-select-pin--exiting",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
      onAnimationEnd={phase === "entering" || phase === "exiting" ? onAnimationEnd : undefined}
    >
      <MapPin size={iconSize} strokeWidth={2.25} className="gnc-select-pin__icon" />
    </div>
  );
}

function SelectableCardWrap({
  density,
  pinPhase,
  onPinAnimationEnd,
  children,
}: {
  density: NodeDensity;
  pinPhase: SelectionPinPhase;
  onPinAnimationEnd: (e: AnimationEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  const showPin = pinPhase !== "idle";

  return (
    <div
      className={[
        "gnc-wrap",
        "gnc-wrap--selectable",
        `gnc-wrap--${density}`,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showPin && (
        <SelectionPin phase={pinPhase} density={density} onAnimationEnd={onPinAnimationEnd} />
      )}
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
  variant = "default",
  density = "full",
  onClick,
  onContextMenu,
}: GoalNodeCardProps) {
  const isLong = goalType === "long";
  const prevSelectedRef = useRef(selected);
  const isFirstSelectionEffect = useRef(true);
  /** タイムアウトと animationend の競合を generation で無効化する */
  const pinAnimGenRef = useRef(0);
  const [pinPhase, setPinPhase] = useState<SelectionPinPhase>(() => (
    !isLong && selected ? "pinned" : "idle"
  ));

  // 長期は金色ピンが種別表示のため、選択ピン演出は中期・短期のみ
  useEffect(() => {
    if (isLong) return;

    if (isFirstSelectionEffect.current) {
      isFirstSelectionEffect.current = false;
      prevSelectedRef.current = selected;
      if (selected) {
        setPinPhase("pinned");
      }
      return;
    }

    const wasSelected = prevSelectedRef.current;
    if (selected === wasSelected) return;

    prevSelectedRef.current = selected;
    pinAnimGenRef.current += 1;

    if (selected) {
      setPinPhase(prefersReducedMotion() ? "pinned" : "entering");
      return;
    }

    setPinPhase((current) => {
      if (current === "idle") return "idle";
      return prefersReducedMotion() ? "idle" : "exiting";
    });
  }, [selected, isLong]);

  // animationend 未発火環境向けフォールバック
  useEffect(() => {
    if (isLong) return undefined;
    if (pinPhase !== "entering" && pinPhase !== "exiting") return undefined;

    const gen = pinAnimGenRef.current;
    const durationMs = pinPhase === "entering" ? PIN_ENTER_MS : PIN_EXIT_MS;
    const timer = window.setTimeout(() => {
      if (pinAnimGenRef.current !== gen) return;
      setPinPhase(pinPhase === "entering" ? "pinned" : "idle");
    }, durationMs + 80);

    return () => window.clearTimeout(timer);
  }, [pinPhase, isLong]);

  const handlePinAnimationEnd = useCallback((e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

    const name = e.animationName;
    if (name.includes("gnc-select-pin-drop")) {
      setPinPhase((current) => (current === "entering" ? "pinned" : current));
    } else if (name.includes("gnc-select-pin-lift")) {
      setPinPhase((current) => (current === "exiting" ? "idle" : current));
    }
  }, []);

  const type = GOAL_TYPE_CONFIG[goalType] ?? FALLBACK_TYPE;
  const st = STATUS_CONFIG[status];
  const TypeIcon = type.icon;
  const unit = progress.unit ?? PROGRESS_UNIT[goalType] ?? "子目標";
  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const isGhost = variant === 'ghost';

  const cls = [
    "gnc",
    `gnc--${density}`,
    isLong && "gnc--long",
    isGhost && "gnc--ghost",
    selected && "gnc--selected",
    !isGhost && st.outline && "gnc--overdue",
    !isGhost && st.warningOutline && "gnc--due-soon",
    !isGhost && st.dimmed && "gnc--done",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapCard = (card: ReactNode) => {
    if (isLong) {
      return (
        <LongTermCardWrap density={density} isGhost={isGhost}>
          {card}
        </LongTermCardWrap>
      );
    }
    // 中期・短期は常に同じラッパーで包み、ピンだけ absolute 表示（padding を増やさない）
    return (
      <SelectableCardWrap
        density={density}
        pinPhase={pinPhase}
        onPinAnimationEnd={handlePinAnimationEnd}
      >
        {card}
      </SelectableCardWrap>
    );
  };

  // さらに縮小：色＋アイコンだけ
  if (density === "mini") {
    return wrapCard(
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
        <TypeIcon size={20} strokeWidth={1.75} className="gnc__miniIcon" aria-hidden />
      </div>
    );
  }

  // 縮小：目標名だけ
  if (density === "compact") {
    return wrapCard(
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
        {progress.total > 0 && (
          <div className="gnc__track gnc__track--thin">
            <div className="gnc__fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    );
  }

  // 通常：全情報
  return wrapCard(
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

      {progress.total > 0 && (
        <div className="gnc__progress">
          <div className="gnc__track">
            <div className="gnc__fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="gnc__count">
            {unit} {progress.done}/{progress.total}
          </span>
        </div>
      )}
    </div>
  );
}

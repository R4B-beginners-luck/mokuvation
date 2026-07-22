import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LocalGoal } from '../../../services/db';
import { GoalTypeBadge } from '../../../components/goals/GoalTypeIcon';

// ─── 目標一覧を「長期→中期→短期」の階層で組み立てるヘルパー ───
// DB上は各目標が parent_goal_id で直接の親を指しているだけ（フラット構造）
// なので、ここでクライアント側で木構造に組み立て直す。
//
// ⚠️ 単純に parent_goal_id を1段ずつそのまま辿って親子付けすると、
// 「短期目標が別の短期目標を親に持つ」ようなデータがあった場合、
// 本来は同じ長期/中期目標の下に並ぶべき兄弟同士が
// A→B→C→D のような直列の連鎖に見えてしまう
// （実際に動いている目標マップ側 GoalsPage.tsx の buildGoalTree では、
//   これを避けるため「一番近い非短期の祖先」まで遡ってフラット化している）。
// ここでも同じ考え方に合わせ、
//   ・中期目標は必ず「その長期目標ルート」の直下
//   ・短期目標は必ず「一番近い非短期の祖先（中期 or 長期）」の直下
// になるように組み立て直す。
type GoalNode = LocalGoal & { children: GoalNode[] };

const periodTypeOf = (g: LocalGoal): 'long' | 'middle' | 'short' =>
  (g.period_type as 'long' | 'middle' | 'short') ?? 'short';

// parent_goal_id を最後まで遡って、長期目標のルートIDを求める
const findRootLongId = (byId: Map<string, LocalGoal>, goal: LocalGoal): string => {
  let current = goal;
  const seen = new Set<string>(); // 循環参照の保険
  while (current.parent_goal_id && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = byId.get(current.parent_goal_id);
    if (!parent) break;
    current = parent;
  }
  return current.id;
};

// parent_goal_id を遡り、period_type が 'short' でない最初の祖先を返す
// （短期目標同士の連鎖を1つの階層に畳み込むため）
const findNearestNonShortAncestorId = (
  byId: Map<string, LocalGoal>,
  goal: LocalGoal,
): string | null => {
  let parent = goal.parent_goal_id ? byId.get(goal.parent_goal_id) : undefined;
  const seen = new Set<string>();
  while (parent && parent.period_type === 'short' && !seen.has(parent.id)) {
    seen.add(parent.id);
    parent = parent.parent_goal_id ? byId.get(parent.parent_goal_id) : undefined;
  }
  return parent?.id ?? null;
};

const buildGoalTree = (goals: LocalGoal[]): GoalNode[] => {
  const byId = new Map<string, LocalGoal>(goals.map((g) => [g.id, g]));
  const nodeById = new Map<string, GoalNode>(
    goals.map((g) => [g.id, { ...g, children: [] }]),
  );

  const roots: GoalNode[] = [];

  for (const goal of goals) {
    const node = nodeById.get(goal.id)!;
    const type = periodTypeOf(goal);

    if (type === 'long') {
      roots.push(node);
      continue;
    }

    if (type === 'middle') {
      const rootId = findRootLongId(byId, goal);
      const parentNode = rootId !== goal.id ? nodeById.get(rootId) : undefined;
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
      continue;
    }

    // short: 一番近い非短期の祖先（中期 or 長期）の直下にまとめる
    const nearestId = findNearestNonShortAncestorId(byId, goal);
    const parentNode = nearestId ? nodeById.get(nearestId) : undefined;
    if (parentNode) {
      parentNode.children.push(node);
    } else {
      // 中期にも長期にも辿り着けない孤立データはルート扱いにしておく
      roots.push(node);
    }
  }

  const byTitle = (a: GoalNode, b: GoalNode) => a.title.localeCompare(b.title, 'ja');
  const sortTree = (nodes: GoalNode[]) => {
    nodes.sort(byTitle);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);

  return roots;
};

// 選択中の目標から実効的な祖先（buildGoalTreeと同じ解決規則）を遡って
// IDの集合を作る（開いた時に自動展開するため）。
// ※ 生の parent_goal_id をそのまま1段ずつ辿ると、buildGoalTree側で
//   フラット化した木構造と食い違い、正しく展開されないことがあるため
//   同じ解決ロジックに揃える。
const findAncestorIds = (goals: LocalGoal[], targetId: string): Set<string> => {
  const byId = new Map(goals.map((g) => [g.id, g]));
  const ids = new Set<string>();
  const target = byId.get(targetId);
  if (!target) return ids;

  const type = periodTypeOf(target);

  if (type === 'middle') {
    const rootId = findRootLongId(byId, target);
    if (rootId !== target.id) ids.add(rootId);
    return ids;
  }

  if (type === 'short') {
    const nearestId = findNearestNonShortAncestorId(byId, target);
    if (nearestId) {
      ids.add(nearestId);
      const nearest = byId.get(nearestId);
      if (nearest && periodTypeOf(nearest) === 'middle') {
        const rootId = findRootLongId(byId, nearest);
        if (rootId !== nearest.id) ids.add(rootId);
      }
    }
  }

  return ids;
};

interface GoalPickerProps {
  goals: LocalGoal[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

// ─── 開閉状態の永続化 ───────────────────────────────────────────
// タスク追加のたびにモーダル（＝GoalPickerのインスタンス）が作り直され、
// そのままだとコンポーネントのstateも毎回リセットされて開閉状態が
// 覚えられない。localStorageに保存しておき、次にモーダルを開いた時も
// 同じ展開状態から始められるようにする。
const EXPANDED_STORAGE_KEY = 'mokuvation_goal_picker_expanded';

const loadExpandedFromStorage = (): Set<string> => {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveExpandedToStorage = (expanded: Set<string>) => {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...expanded]));
  } catch {
    // localStorageが使えない環境（プライベートモード等）では諦めて無視する
  }
};

export function GoalPicker({ goals, value, onChange, disabled }: GoalPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(loadExpandedFromStorage);
  const wrapRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildGoalTree(goals), [goals]);
  const selectedGoal = useMemo(() => goals.find((g) => g.id === value), [goals, value]);

  // 開閉状態が変わるたびに保存しておく
  useEffect(() => {
    saveExpandedToStorage(expanded);
  }, [expanded]);

  // 開いた時、選択中の目標がある階層まで自動的に展開しておく
  useEffect(() => {
    if (!isOpen) return;
    if (value) {
      setExpanded((prev) => new Set([...prev, ...findAncestorIds(goals, value)]));
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 外側クリック／Escapeで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const select = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  // Windowsのフォルダツリーと同じ操作感：
  // ・矢印（▶/▼）をクリック → 展開/折りたたみのみ、選択はしない
  // ・行本体（アイコン・タイトル部分）をクリック → その目標を選択して閉じる
  const renderNode = (node: GoalNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`goal-picker__row${value === node.id ? ' goal-picker__row--selected' : ''}`}
          style={{ paddingLeft: 8 + depth * 20 }}
        >
          <button
            type="button"
            className="goal-picker__twisty"
            disabled={!hasChildren}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
            aria-label={hasChildren ? (isExpanded ? '折りたたむ' : '展開する') : undefined}
          >
            {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </button>

          <button
            type="button"
            className="goal-picker__option"
            onClick={() => select(node.id)}
          >
            <GoalTypeBadge type={periodTypeOf(node)} />
            <span className="goal-picker__title">{node.title}</span>
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="goal-picker" ref={wrapRef}>
      <button
        type="button"
        className="form-input goal-picker__trigger"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
      >
        {selectedGoal ? (
          <span className="goal-picker__trigger-value">
            <GoalTypeBadge type={periodTypeOf(selectedGoal)} />
            <span className="goal-picker__title">{selectedGoal.title}</span>
          </span>
        ) : (
          <span className="goal-picker__placeholder">-- 指定なし（単独タスク） --</span>
        )}
        <ChevronDown size={16} strokeWidth={2} aria-hidden style={{ flexShrink: 0, opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div className="goal-picker__panel" role="tree">
          <button
            type="button"
            className={`goal-picker__option goal-picker__option--flat${value === '' ? ' goal-picker__row--selected' : ''}`}
            onClick={() => select('')}
          >
            -- 指定なし（単独タスク） --
          </button>

          {tree.length === 0 && (
            <div className="goal-picker__empty">目標がまだありません</div>
          )}

          {tree.map((root) => renderNode(root, 0))}
        </div>
      )}
    </div>
  );
}

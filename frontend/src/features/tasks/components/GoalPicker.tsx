import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LocalGoal } from '../../../services/db';
import { GoalTypeBadge } from '../../../components/goals/GoalTypeIcon';

// ─── 目標一覧を「長期→中期→短期」の階層で組み立てるヘルパー ───
// DB上は各目標が parent_goal_id で直接の親を指しているだけ（フラット構造）
// なので、ここでクライアント側で木構造に組み立て直す。
//
// ・中期目標は必ず「その長期目標ルート」の直下
// ・短期目標は「直接の親が中期ならその中期のみ」「親が長期なら長期直下」
//   （短期→短期の連鎖がある場合は、一番近い非短期祖先まで畳み込む）
// ・中期ノードの children には、その中期に紐づく短期以外を入れない
type GoalNode = LocalGoal & { children: GoalNode[] };

const periodTypeOf = (g: Pick<LocalGoal, 'period_type'>): 'long' | 'middle' | 'short' => {
  const t = g.period_type as string | undefined;
  if (t === 'long') return 'long';
  // API / 画面側で 'mid' と書かれるケースも中期として扱う
  if (t === 'middle' || t === 'mid') return 'middle';
  return 'short';
};

const findRootLongId = (byId: Map<string, LocalGoal>, goal: LocalGoal): string => {
  let current = goal;
  const seen = new Set<string>();
  while (current.parent_goal_id && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = byId.get(current.parent_goal_id);
    if (!parent) break;
    current = parent;
  }
  return current.id;
};

/** 短期連鎖を畳み、直近の中期 or 長期の ID を返す */
const findNearestNonShortAncestorId = (
  byId: Map<string, LocalGoal>,
  goal: LocalGoal,
): string | null => {
  let parent = goal.parent_goal_id ? byId.get(goal.parent_goal_id) : undefined;
  const seen = new Set<string>();
  while (parent && periodTypeOf(parent) === 'short' && !seen.has(parent.id)) {
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
      if (parentNode && periodTypeOf(parentNode) === 'long') {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
      continue;
    }

    // short: 直近の非短期祖先（中期 or 長期）の直下のみ
    const nearestId = findNearestNonShortAncestorId(byId, goal);
    if (!nearestId) {
      roots.push(node);
      continue;
    }

    const parentNode = nodeById.get(nearestId);
    if (!parentNode) {
      roots.push(node);
      continue;
    }

    const parentType = periodTypeOf(parentNode);
    // 中期 or 長期以外の下には付けない（誤紐づけ防止）
    if (parentType === 'middle' || parentType === 'long') {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 中期の children を再検証：その中期が「直近の非短期祖先」である短期だけ残す
  for (const node of nodeById.values()) {
    if (periodTypeOf(node) !== 'middle') continue;
    node.children = node.children.filter((child) => {
      if (periodTypeOf(child) !== 'short') return false;
      return findNearestNonShortAncestorId(byId, child) === node.id;
    });
  }

  // 長期の children: 中期 +（長期直下の）短期のみ。他長期などは除外
  for (const node of nodeById.values()) {
    if (periodTypeOf(node) !== 'long') continue;
    node.children = node.children.filter((child) => {
      const childType = periodTypeOf(child);
      if (childType === 'middle') {
        return findRootLongId(byId, child) === node.id;
      }
      if (childType === 'short') {
        return findNearestNonShortAncestorId(byId, child) === node.id;
      }
      return false;
    });
  }

  const byTitle = (a: GoalNode, b: GoalNode) => a.title.localeCompare(b.title, 'ja');
  // 長期直下は中期を先、短期（長期直下）を後にして見やすくする
  const byTypeThenTitle = (a: GoalNode, b: GoalNode) => {
    const order = (n: GoalNode) => {
      const t = periodTypeOf(n);
      if (t === 'middle') return 0;
      if (t === 'short') return 1;
      return 2;
    };
    const diff = order(a) - order(b);
    return diff !== 0 ? diff : byTitle(a, b);
  };

  const sortTree = (nodes: GoalNode[], underLong: boolean) => {
    nodes.sort(underLong ? byTypeThenTitle : byTitle);
    nodes.forEach((n) => sortTree(n.children, false));
  };
  sortTree(roots, false);
  roots.forEach((root) => {
    if (periodTypeOf(root) === 'long') sortTree(root.children, true);
  });

  return roots;
};

// 選択中の目標から実効的な祖先（buildGoalTreeと同じ解決規則）を遡って
// IDの集合を作る（開いた時に自動展開するため）。
// ※ 生の parent_goal_id をそのまま1段ずつ辿ると、buildGoalTree側で
//   フラット化した木構造と食い違い、正しく展開されないことがあるため
//   同じ解決ロジックに揃える。

/** 選択中ノードの祖先＋自分（中期の場合）を展開用に返す */
const findExpandIds = (goals: LocalGoal[], targetId: string): Set<string> => {
  const byId = new Map(goals.map((g) => [g.id, g]));
  const ids = new Set<string>();
  const target = byId.get(targetId);
  if (!target) return ids;

  const type = periodTypeOf(target);

  if (type === 'middle') {
    const rootId = findRootLongId(byId, target);
    if (rootId !== target.id) ids.add(rootId);
    // 中期自身も展開し、配下の短期だけが見えるようにする
    ids.add(target.id);
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

export function GoalPicker({ goals, value, onChange, disabled }: GoalPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildGoalTree(goals), [goals]);
  const selectedGoal = useMemo(() => goals.find((g) => g.id === value), [goals, value]);

  // 開いた時、選択中の目標がある階層まで自動的に展開しておく
  useEffect(() => {
    if (!isOpen) return;
    if (value) {
      setExpanded((prev) => new Set([...prev, ...findExpandIds(goals, value)]));
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
          <span className="goal-picker__placeholder">指定なし（単独タスク）</span>
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

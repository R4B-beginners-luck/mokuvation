import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LocalGoal } from '../../../services/db';
import { GoalTypeBadge } from '../../../components/goals/GoalTypeIcon';

type GoalNode = LocalGoal & { children: GoalNode[] };

const periodTypeOf = (g: LocalGoal): 'long' | 'middle' | 'short' =>
  (g.period_type as 'long' | 'middle' | 'short') ?? 'short';

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

    const nearestId = findNearestNonShortAncestorId(byId, goal);
    const parentNode = nearestId ? nodeById.get(nearestId) : undefined;
    if (parentNode) {
      parentNode.children.push(node);
    } else {
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

export function GoalPicker({ goals, value, onChange, disabled }: GoalPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildGoalTree(goals), [goals]);
  const selectedGoal = useMemo(() => goals.find((g) => g.id === value), [goals, value]);

  useEffect(() => {
    if (!isOpen) return;
    if (value) {
      setExpanded((prev) => new Set([...prev, ...findAncestorIds(goals, value)]));
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

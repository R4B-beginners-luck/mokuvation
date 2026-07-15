import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LocalGoal } from '../../../services/db';
import { GoalTypeIcon, GOAL_PERIOD_LABEL } from '../../../components/goals/GoalTypeIcon';
import { COLOR_PALETTE, DEFAULT_GOAL_COLOR } from '../../../const/colors';

// ─── 目標一覧を「長期→中期→短期」の階層で並べるためのヘルパー ───
// DB上は各目標が parent_goal_id で直接の親を指しているだけ（フラット構造）
// なので、ここでクライアント側で木構造に組み立て直す。
type GoalNode = LocalGoal & { children: GoalNode[] };

const periodTypeOf = (g: LocalGoal): 'long' | 'middle' | 'short' =>
  (g.period_type as 'long' | 'middle' | 'short') ?? 'short';

const resolveColor = (g: LocalGoal): string =>
  typeof g.color_code === 'number' ? (COLOR_PALETTE[g.color_code] ?? DEFAULT_GOAL_COLOR) : DEFAULT_GOAL_COLOR;

const buildGoalTree = (goals: LocalGoal[]): GoalNode[] => {
  const nodeById = new Map<string, GoalNode>(
    goals.map((g) => [g.id, { ...g, children: [] }]),
  );
  const roots: GoalNode[] = [];

  for (const node of nodeById.values()) {
    const parent = node.parent_goal_id ? nodeById.get(node.parent_goal_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      // 長期目標、または親が見つからない（孤立した）目標はルート扱いにする
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

type FlatRow =
  | { kind: 'group-label'; key: string; label: string }
  | { kind: 'option'; key: string; goal: GoalNode; depth: number };

const flatten = (nodes: GoalNode[], depth = 0): FlatRow[] =>
  nodes.flatMap((node) => [
    { kind: 'option' as const, key: node.id, goal: node, depth },
    ...flatten(node.children, depth + 1),
  ]);

const buildRows = (goals: LocalGoal[]): FlatRow[] => {
  const tree = buildGoalTree(goals);
  return tree.flatMap((root) => [
    { kind: 'group-label' as const, key: `group-${root.id}`, label: root.title },
    ...flatten([root]),
  ]);
};

interface GoalPickerProps {
  goals: LocalGoal[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function GoalPicker({ goals, value, onChange, disabled }: GoalPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => buildRows(goals), [goals]);
  const selectedGoal = useMemo(() => goals.find((g) => g.id === value), [goals, value]);

  // 外側クリックで閉じる
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

  const select = (id: string) => {
    onChange(id);
    setIsOpen(false);
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
            <GoalTypeIcon type={periodTypeOf(selectedGoal)} color={resolveColor(selectedGoal)} />
            <span
              className={`tag tag--${periodTypeOf(selectedGoal) === 'middle' ? 'mid' : periodTypeOf(selectedGoal)}`}
            >
              {GOAL_PERIOD_LABEL[periodTypeOf(selectedGoal)]}
            </span>
            <span className="goal-picker__title">{selectedGoal.title}</span>
          </span>
        ) : (
          <span className="goal-picker__placeholder">-- 指定なし（単独タスク） --</span>
        )}
        <ChevronDown size={16} strokeWidth={2} aria-hidden style={{ flexShrink: 0, opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div className="goal-picker__panel" role="listbox">
          <button
            type="button"
            className={`goal-picker__option${value === '' ? ' goal-picker__option--selected' : ''}`}
            onClick={() => select('')}
          >
            -- 指定なし（単独タスク） --
          </button>

          {rows.map((row) => {
            if (row.kind === 'group-label') {
              return (
                <div key={row.key} className="goal-picker__group-label">
                  {row.label}
                </div>
              );
            }
            const { goal, depth } = row;
            const period = periodTypeOf(goal);
            return (
              <button
                type="button"
                key={row.key}
                className={`goal-picker__option${value === goal.id ? ' goal-picker__option--selected' : ''}`}
                style={{ paddingLeft: 12 + depth * 16 }}
                onClick={() => select(goal.id)}
              >
                <GoalTypeIcon type={period} color={resolveColor(goal)} />
                <span className={`tag tag--${period === 'middle' ? 'mid' : period}`}>
                  {GOAL_PERIOD_LABEL[period]}
                </span>
                <span className="goal-picker__title">{goal.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

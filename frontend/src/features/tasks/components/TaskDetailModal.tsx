import type { LocalGoal } from '../../../services/db';
import { TaskModalShell } from './TaskModalShell';
import { formatDisplayDate } from '../../../components/ui/DatePickerField/dateUtils';

export type TaskDetailSource = {
  id: string;
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  goal_id?: string | null;
  is_completed?: boolean;
};

interface TaskDetailModalProps {
  task: TaskDetailSource;
  goals: LocalGoal[];
  onClose: () => void;
  onEdit: () => void;
}

type GoalChain = {
  long?: LocalGoal;
  mid?: LocalGoal;
  short?: LocalGoal;
};

function resolveGoalChain(goalId: string | null | undefined, goals: LocalGoal[]): GoalChain {
  if (!goalId) return {};
  const byId = new Map(goals.map((g) => [g.id, g]));
  const linked = byId.get(goalId);
  if (!linked) return {};

  const chain: GoalChain = {};
  if (linked.period_type === 'short') chain.short = linked;
  else if (linked.period_type === 'middle') chain.mid = linked;
  else if (linked.period_type === 'long') chain.long = linked;

  let cur: LocalGoal | undefined = linked;
  while (cur?.parent_goal_id) {
    const parent = byId.get(cur.parent_goal_id);
    if (!parent) break;
    if (parent.period_type === 'middle') chain.mid = parent;
    if (parent.period_type === 'long') chain.long = parent;
    cur = parent;
  }

  return chain;
}

function dateLabel(scheduledAt?: string | null): string {
  if (!scheduledAt) return '未設定';
  const ymd = scheduledAt.replace(' ', 'T').split('T')[0] ?? '';
  return formatDisplayDate(ymd) || ymd;
}

export function TaskDetailModal({ task, goals, onClose, onEdit }: TaskDetailModalProps) {
  const chain = resolveGoalChain(task.goal_id, goals);

  return (
    <TaskModalShell title="タスクの詳細" onClose={onClose} resetKey={task.id}>
      <div className="task-detail">
        <div className="task-detail__section">
          <div className="task-detail__label">題名</div>
          <div className="task-detail__title">{task.title}</div>
        </div>

        <div className="task-detail__section">
          <div className="task-detail__label">実行予定日</div>
          <div className="task-detail__value">{dateLabel(task.scheduled_at)}</div>
        </div>

        <div className="task-detail__section">
          <div className="task-detail__label">紐づいている目標</div>
          {!chain.long && !chain.mid && !chain.short ? (
            <div className="task-detail__muted">なし</div>
          ) : (
            <div className="task-detail__tags">
              {chain.long && <span className="tag tag--long">{chain.long.title}</span>}
              {chain.mid && <span className="tag tag--mid">{chain.mid.title}</span>}
              {chain.short && <span className="tag tag--short">{chain.short.title}</span>}
            </div>
          )}
        </div>

        <div className="task-detail__section">
          <div className="task-detail__label">詳細内容</div>
          <div className="task-detail__value task-detail__description">
            {task.description?.trim() ? task.description : '（なし）'}
          </div>
        </div>

        <div className="task-detail__actions">
          <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
            閉じる
          </button>
          <button type="button" className="btn-primary" onClick={onEdit} style={{ flex: 1 }}>
            編集する
          </button>
        </div>
      </div>
    </TaskModalShell>
  );
}

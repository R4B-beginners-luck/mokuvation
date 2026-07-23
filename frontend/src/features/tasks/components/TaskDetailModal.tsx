import type { LocalGoal } from '../../../services/db';
import { TaskModalShell } from './TaskModalShell';
import { formatDisplayDate } from '../../../components/ui/DatePickerField/dateUtils';
import { resolveGoalChain } from '../utils/resolveGoalChain';
import { GoalChainTags } from './GoalChainTags';

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
          <GoalChainTags chain={chain} />
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

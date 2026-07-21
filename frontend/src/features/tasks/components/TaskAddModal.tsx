import { useState, useEffect } from 'react';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { db, type LocalGoal } from '../../../services/db';
import type { Task } from '../types';
import { DatePickerField } from '../../../components/ui/DatePickerField/DatePickerField';
import { getTodayApiDate } from '../../../components/ui/DatePickerField/dateUtils';
import { GoalPicker } from './GoalPicker';
import { TaskModalShell } from './TaskModalShell';

export type TaskFormMode = 'create' | 'edit';

interface TaskAddModalProps {
  mode?: TaskFormMode;
  /** edit 時の初期値（snake_case / カレンダー Task 両対応） */
  task?: Partial<Task> & {
    id: string;
    title: string;
    goalId?: string | null;
    goal_id?: string | null;
    date?: string;
    description?: string | null;
    scheduled_at?: string | null;
  };
  goalId?: string | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess: (task: Task) => void;
}

function extractDatePrefix(value?: string | null): string {
  if (!value) return '';
  return value.replace(' ', 'T').split('T')[0] ?? '';
}

export function TaskAddModal({
  mode = 'create',
  task,
  goalId = null,
  initialDate,
  onClose,
  onSuccess,
}: TaskAddModalProps) {
  const isEdit = mode === 'edit';
  const { addTask, updateTask, isLoading, error } = useTaskMutations();

  const [title, setTitle] = useState(() => task?.title ?? '');
  const [description, setDescription] = useState(() => task?.description ?? '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (isEdit) {
      return extractDatePrefix(task?.scheduled_at) || task?.date || getTodayApiDate();
    }
    if (initialDate) return initialDate;
    return getTodayApiDate();
  });
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    () => String(task?.goal_id ?? task?.goalId ?? goalId ?? ''),
  );
  const [goals, setGoals] = useState<LocalGoal[]>([]);

  useEffect(() => {
    if (initialDate && !isEdit) {
      setScheduledAt(initialDate);
    }
  }, [initialDate, isEdit]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const localGoals = await db.goals.toArray();
        setGoals(localGoals);
      } catch (err) {
        console.error('目標一覧の取得に失敗しました', err);
      }
    };
    void fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEdit && task?.id) {
      const updated = await updateTask(task.id, {
        title: title.trim(),
        description: description || undefined,
        scheduled_at: scheduledAt || undefined,
      });
      if (updated) {
        onSuccess(updated);
        onClose();
      }
      return;
    }

    const payload = {
      goal_id: selectedGoalId || null,
      title: title.trim(),
      description: description || undefined,
      scheduled_at: scheduledAt || undefined,
    };

    const newTask = await addTask(payload);
    if (newTask) {
      onSuccess(newTask);
      onClose();
    }
  };

  const linkedGoalTitle = (() => {
    if (!selectedGoalId) return null;
    return goals.find((g) => g.id === selectedGoalId)?.title ?? null;
  })();

  return (
    <TaskModalShell
      title={isEdit ? 'タスクの編集' : 'タスクの追加'}
      onClose={onClose}
      resetKey={isEdit && task?.id ? `edit-${task.id}` : `create-${initialDate ?? ''}`}
    >
      <form onSubmit={handleSubmit}>
        {isEdit ? (
          <div className="form-field">
            <label>紐づいている目標</label>
            <div className="task-form__goal-readonly">
              {linkedGoalTitle ?? 'なし'}
              <span className="form-field__optional">（編集では変更できません）</span>
            </div>
          </div>
        ) : (
          <div className="form-field">
            <label>
              紐づける目標
              <span className="form-field__optional">（任意）</span>
            </label>
            <GoalPicker
              goals={goals}
              value={selectedGoalId}
              onChange={setSelectedGoalId}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="form-field">
          <label>
            タイトル
            <span className="form-field__required" aria-hidden>*</span>
          </label>
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            disabled={isLoading}
            aria-required="true"
          />
        </div>

        <div className="form-field">
          <label>
            詳細・備考
            <span className="form-field__optional">（任意）</span>
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-field">
          <label htmlFor="task-scheduled-date">
            実行予定日
            <span className="form-field__optional">（任意）</span>
          </label>
          <DatePickerField
            id="task-scheduled-date"
            value={scheduledAt}
            onChange={setScheduledAt}
            disabled={isLoading}
          />
        </div>

        {error && <p style={{ color: 'var(--accent-coral)', fontSize: '12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '12px', color: 'var(--text-primary)' }}
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ flex: 1, color: 'var(--text-primary)' }}
            disabled={isLoading}
          >
            {isLoading ? (isEdit ? '保存中...' : '追加中...') : isEdit ? '保存する' : '追加する'}
          </button>
        </div>
      </form>
    </TaskModalShell>
  );
}

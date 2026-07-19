import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { parseApiDate } from '../../../components/ui/DatePickerField/dateUtils';
import { TaskAddModal, TaskDeleteConfirm, TaskDetailModal } from '../../tasks';
import type { Task as CreatedTask } from '../../tasks';
import type { Task, Goal } from '../types';
import { db, type LocalGoal } from '../../../services/db';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

interface DayGoalListProps {
  date: string | null;
  tasks: Task[];
  goals: Goal[];
  onTaskAdded?: (task: CreatedTask) => void;
  onTaskUpdated?: (task: CreatedTask) => void;
  onTaskDeleted?: (taskId: string) => void;
  onClose?: () => void;
}

function formatDate(dateStr: string): string {
  const date = parseApiDate(dateStr) ?? new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
}

function extractDateFromScheduled(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;
  const normalized = scheduledAt.replace(' ', 'T');
  return normalized.split('T')[0] ?? null;
}

export function DayGoalList({
  date,
  tasks,
  goals,
  onTaskAdded,
  onTaskUpdated,
  onTaskDeleted,
  onClose,
}: DayGoalListProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [localGoals, setLocalGoals] = useState<LocalGoal[]>([]);

  useEffect(() => {
    void db.goals.toArray().then(setLocalGoals).catch(() => setLocalGoals([]));
  }, [date, detailTaskId, editingTaskId]);

  if (!date) {
    return null;
  }

  const dayTasks = tasks.filter((task) => {
    const taskDate = extractDateFromScheduled(task.scheduled_at);
    return taskDate === date;
  });

  const completedCount = dayTasks.filter((task) => task.is_completed).length;
  const detailTask = detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null;
  const editTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) ?? null : null;

  const getLinkedGoalInfo = (goalId: string | null) => {
    if (!goalId) return { goalTitle: undefined, periodType: undefined };

    const linkedGoal = goals.find((goal) => goal.id === goalId);
    if (!linkedGoal) return { goalTitle: undefined, periodType: undefined };

    return {
      goalTitle: linkedGoal.title,
      periodType: linkedGoal.period_type,
    };
  };

  const goalsForDetail: LocalGoal[] = localGoals.length > 0
    ? localGoals
    : goals.map((g) => ({
        id: g.id,
        user_id: g.user_id ?? '',
        title: g.title,
        description: g.description ?? null,
        parent_goal_id: g.parent_goal_id ?? null,
        period_type: g.period_type,
        due_at: g.due_at ?? null,
        is_completed: g.is_completed,
        color_code: null,
        position_x: null,
        position_y: null,
        created_at: g.created_at ?? '',
        updated_at: g.updated_at ?? '',
      }));

  return (
    <div className={`day-detail${isMobile ? ' day-detail--mobile' : ''}`}>
      <div className="day-detail__header">
        <div>
          <div className="day-detail__date">{formatDate(date)}</div>
          <div className="day-detail__count">
            {dayTasks.length > 0
              ? `${completedCount} / ${dayTasks.length} 件完了`
              : 'この日のタスクなし'}
          </div>
        </div>

        <div className="day-detail__actions">
          {isEditing ? (
            <button
              type="button"
              className="day-detail__delete-button"
              onClick={() => {
                if (selectedTaskIds.length > 0) {
                  setDeleteConfirmTaskId(selectedTaskIds[0]);
                }
              }}
              disabled={selectedTaskIds.length === 0}
              aria-label="選択したタスクを削除"
              title="選択したタスクを削除"
            >
              <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="day-detail__add-button"
              onClick={() => setIsModalOpen(true)}
              aria-label="タスクを追加"
              title="タスクを追加"
            >
              <Plus size={15} strokeWidth={1.75} aria-hidden />
            </button>
          )}

          <button
            type="button"
            className={`day-detail__edit-button${isEditing ? ' is-active' : ''}`}
            onClick={() => {
              setIsEditing((prev) => !prev);
              setSelectedTaskIds([]);
            }}
            aria-label={isEditing ? '編集を終了' : '編集モードにする'}
            title={isEditing ? '編集を終了' : '編集する'}
          >
            <Pencil size={15} strokeWidth={1.75} aria-hidden />
          </button>

          <button
            type="button"
            className="day-detail__close-button"
            onClick={() => {
              onClose?.();
            }}
            aria-label="閉じる"
            title="このパネルを閉じる"
          >
            <ChevronLeft size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="day-detail__hint">
          編集モードではタスクを押すと削除対象として赤く選択されます。通常時はタスクを押すと詳細を表示します。
        </div>
      ) : null}

      {dayTasks.length === 0 ? (
        <div className="day-detail__empty">この日はタスクがありません</div>
      ) : (
        <ul className="day-detail__list">
          {dayTasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            const info = getLinkedGoalInfo(task.goal_id);
            const isLongTermGoal = info.periodType === 'long';
            const goalTagClassName =
              info.periodType === 'short'
                ? 'tag tag--short'
                : info.periodType === 'middle'
                  ? 'tag tag--mid'
                  : 'tag tag--long';

            return (
              <li key={task.id}>
                <div
                  className={`goal-item${task.is_completed ? ' completed' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(212, 122, 106, 0.14)' : undefined,
                    borderColor: isSelected ? 'rgba(212, 122, 106, 0.6)' : undefined,
                    borderRadius: '8px',
                  }}
                  onClick={() => {
                    if (isEditing) {
                      setSelectedTaskIds((prev) => (
                        prev.includes(task.id)
                          ? prev.filter((id) => id !== task.id)
                          : [...prev, task.id]
                      ));
                      return;
                    }
                    setDetailTaskId(task.id);
                  }}
                >
                  <div
                    className={`goal-item__check${task.is_completed ? ' checked' : ''}`}
                    style={{
                      ...(isSelected
                        ? {
                            backgroundColor: 'rgba(212, 122, 106, 0.95)',
                            borderColor: 'rgba(212, 122, 106, 1)',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 700,
                            lineHeight: 1,
                          }
                        : {}),
                    }}
                  >
                    {isSelected ? (
                      <Minus size={14} strokeWidth={1.75} aria-hidden />
                    ) : task.is_completed ? (
                      <Check size={14} strokeWidth={1.75} aria-hidden />
                    ) : null}
                  </div>

                  <div className="goal-item__body">
                    <div className="goal-item__title">{task.title}</div>
                    <div className="goal-item__meta">
                      {info.goalTitle && (
                        <span
                          className={goalTagClassName}
                          style={isLongTermGoal
                            ? {
                                display: 'inline-block',
                                whiteSpace: 'normal',
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                                maxWidth: '100%',
                              }
                            : undefined}
                        >
                          {info.goalTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isModalOpen && (
        <TaskAddModal
          initialDate={date}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(newTask) => {
            onTaskAdded?.(newTask);
            setIsModalOpen(false);
          }}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          goals={goalsForDetail}
          onClose={() => setDetailTaskId(null)}
          onEdit={() => {
            setEditingTaskId(detailTask.id);
            setDetailTaskId(null);
          }}
        />
      )}

      {editTask && (
        <TaskAddModal
          mode="edit"
          task={editTask}
          onClose={() => setEditingTaskId(null)}
          onSuccess={(updated) => {
            onTaskUpdated?.(updated);
            setEditingTaskId(null);
          }}
        />
      )}

      {deleteConfirmTaskId && (
        <TaskDeleteConfirm
          taskId={deleteConfirmTaskId}
          onClose={() => setDeleteConfirmTaskId(null)}
          onSuccess={(taskId) => {
            setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
            setDeleteConfirmTaskId(null);
            onTaskDeleted?.(taskId);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}

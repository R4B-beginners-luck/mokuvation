import { useState } from 'react';
import { TaskAddModal, TaskDeleteConfirm } from '../../tasks';
import type { Task as CreatedTask } from '../../tasks';
import type { Task, Goal } from '../types';

interface DayGoalListProps {
  date: string | null;
  tasks: Task[];
  goals: Goal[];
  onTaskAdded?: (task: CreatedTask) => void;
  onTaskDeleted?: (taskId: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
}

function extractDateFromScheduled(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;
  const normalized = scheduledAt.replace(' ', 'T');
  return normalized.split('T')[0] ?? null;
}

function getTodayLocalDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DayGoalList({ date, tasks, goals, onTaskAdded, onTaskDeleted }: DayGoalListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);

  if (!date) {
    return (
      <div className="day-detail">
        <div className="day-detail__empty">
          📅<br />日付を選択してください
        </div>
      </div>
    );
  }

  const dayTasks = tasks.filter((task) => {
    const taskDate = extractDateFromScheduled(task.scheduled_at);
    return taskDate === date;
  });

  const isPastDate = date < getTodayLocalDateString();
  const canModifyTasks = !isPastDate;
  const isEditingEnabled = isEditing && canModifyTasks;

  const completedCount = dayTasks.filter((task) => task.is_completed).length;

  const getLinkedGoalInfo = (goalId: string | null) => {
    if (!goalId) return { goalTitle: undefined, periodType: undefined };

    const linkedGoal = goals.find((goal) => goal.id === goalId);
    if (!linkedGoal) return { goalTitle: undefined, periodType: undefined };

    return {
      goalTitle: linkedGoal.title,
      periodType: linkedGoal.period_type,
    };
  };

  return (
    <div className="day-detail">
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
          {isEditingEnabled ? (
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
              🗑
            </button>
          ) : (
            <button
              type="button"
              className="day-detail__add-button"
              onClick={() => {
                if (!canModifyTasks) return;
                setIsModalOpen(true);
              }}
              disabled={!canModifyTasks}
              aria-label="タスクを追加"
              title={canModifyTasks ? 'タスクを追加' : '過去の日付にはタスクを追加できません'}
            >
              ＋
            </button>
          )}

          <button
            type="button"
            className={`day-detail__edit-button${isEditingEnabled ? ' is-active' : ''}`}
            onClick={() => {
              if (!canModifyTasks) return;
              setIsEditing((prev) => !prev);
              setSelectedTaskIds([]);
            }}
            disabled={!canModifyTasks}
            aria-label={isEditingEnabled ? '編集を終了' : '編集モードにする'}
            title={canModifyTasks ? (isEditingEnabled ? '編集を終了' : '編集する') : '過去の日付は編集できません'}
          >
            ✎
          </button>
        </div>
      </div>

      {!canModifyTasks ? (
        <div className="day-detail__hint">
          今日より前の日付のタスクは追加も削除もできません。
        </div>
      ) : isEditingEnabled ? (
        <div className="day-detail__hint">
          編集モードではタスクを押すと削除対象として赤く選択されます。
        </div>
      ) : null}

      {dayTasks.length === 0 ? (
        <div className="day-detail__empty">この日は目標が設定されていません</div>
      ) : (
        <ul className="day-detail__list">
          {dayTasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            const info = getLinkedGoalInfo(task.goal_id);
            const isLongTermGoal = info.periodType === 'long';

            return (
              <li key={task.id}>
                <div
                  className={`goal-item${task.is_completed ? ' completed' : ''}`}
                  style={{
                    cursor: isEditingEnabled ? 'pointer' : 'default',
                    backgroundColor: isSelected ? 'rgba(212, 122, 106, 0.14)' : undefined,
                    borderColor: isSelected ? 'rgba(212, 122, 106, 0.6)' : undefined,
                    borderRadius: '8px',
                  }}
                  onClick={() => {
                    if (!isEditingEnabled) return;

                    setSelectedTaskIds((prev) => (
                      prev.includes(task.id)
                        ? prev.filter((id) => id !== task.id)
                        : [...prev, task.id]
                    ));
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
                    {isSelected ? '−' : task.is_completed ? '✓' : ''}
                  </div>

                  <div className="goal-item__body">
                    <div className="goal-item__title">{task.title}</div>
                    <div className="goal-item__meta">
                      {info.goalTitle && (
                        <span
                          className="tag tag--long"
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

      {isModalOpen && canModifyTasks && (
        <div className="calendar-task-add-modal">
          <TaskAddModal
            initialDate={date}
            onClose={() => setIsModalOpen(false)}
            onSuccess={(newTask) => {
              onTaskAdded?.(newTask);
              setIsModalOpen(false);
            }}
          />
        </div>
      )}

      {deleteConfirmTaskId && canModifyTasks && (
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

import { useState } from 'react';
import { TaskAddModal } from '../../tasks';
import type { Task as CreatedTask } from '../../tasks';
import type { Task, Goal } from '../types';

interface DayGoalListProps {
  date: string | null;
  tasks: Task[];
  goals: Goal[];
  onTaskAdded?: (task: CreatedTask) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function extractDateFromScheduled(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;
  const normalized = scheduledAt.replace(' ', 'T');
  return normalized.split('T')[0] ?? null;
}

export function DayGoalList({ date, tasks, goals, onTaskAdded }: DayGoalListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const completed = dayTasks.filter((t) => t.is_completed).length;

  const getLinkedGoalInfo = (goalId: string | null) => {
    if (!goalId) return { goalTitle: undefined, periodType: undefined };

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { goalTitle: undefined, periodType: undefined };

    return { goalTitle: goal.title, periodType: goal.period_type };
  };

  return (
    <div className="day-detail">
      <div className="day-detail__date">{formatDate(date)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div className="day-detail__count">
          {dayTasks.length > 0
            ? `${completed} / ${dayTasks.length} 件完了`
            : 'この日のタスクなし'}
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '6px 10px', fontSize: 12 }}
        >
          タスク追加
        </button>
      </div>

      {dayTasks.length === 0 ? (
        <div className="day-detail__empty">この日は目標が設定されていません</div>
      ) : (
        <ul className="day-detail__list">
          {dayTasks.map((task) => (
            <li key={task.id}>
              <div className={`goal-item${task.is_completed ? ' completed' : ''}`} style={{ cursor: 'default' }}>
                <div className={`goal-item__check${task.is_completed ? ' checked' : ''}`}>
                  {task.is_completed && '✓'}
                </div>
                <div className="goal-item__body">
                  <div className="goal-item__title">{task.title}</div>
                  <div className="goal-item__meta">
                    {(() => {
                      const info = getLinkedGoalInfo(task.goal_id);
                      return (
                        <>
                          {info.goalTitle && (
                            <span className="tag tag--long">{info.goalTitle}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
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

      <style>{`
        .calendar-task-add-modal .form-field:nth-of-type(4) {
          display: none;
        }
      `}</style>
    </div>
  );
}

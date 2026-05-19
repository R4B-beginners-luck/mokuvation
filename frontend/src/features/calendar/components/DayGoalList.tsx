import { useEffect, useMemo, useState } from 'react';
import type { Task, MidTermGoal, LongTermGoal } from '../../../types';

interface DayGoalListProps {
  date: string | null;
  tasks: Task[];
  midTermGoals: MidTermGoal[];
  longTermGoals: LongTermGoal[];
  onOpenTaskAddModal: () => void;
  onDeleteTasks: (taskIds: string[]) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function DayGoalList({ date, tasks, midTermGoals, longTermGoals, onOpenTaskAddModal, onDeleteTasks }: DayGoalListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  if (!date) {
    return (
      <div className="day-detail">
        <div className="day-detail__empty">
          📅<br />日付を選択してください
        </div>
      </div>
    );
  }

  const dayGoals = useMemo(() => tasks.filter((g) => g.date === date), [date, tasks]);
  const completed = dayGoals.filter((g) => g.completed).length;

  useEffect(() => {
    setIsEditing(false);
    setSelectedTaskIds([]);
  }, [date]);

  useEffect(() => {
    setSelectedTaskIds((prev) => prev.filter((taskId) => dayGoals.some((goal) => goal.id === taskId)));
  }, [dayGoals]);

  const getParentTags = (goalId?: string) => {
    if (!goalId) return { mid: undefined, long: undefined };
    
    const mid = midTermGoals.find(m => m.id === goalId);
    if (mid) {
      const long = longTermGoals.find(l => l.id === mid.longTermGoalId);
      return { mid: mid.title, long: long?.title };
    }

    const long = longTermGoals.find(l => l.id === goalId);
    return { mid: undefined, long: long?.title };
  };

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
    setSelectedTaskIds([]);
  };

  const handleOpenTaskAddModal = () => {
    setIsEditing(false);
    setSelectedTaskIds([]);
    onOpenTaskAddModal();
  };

  const toggleTaskSelection = (taskId: string) => {
    if (!isEditing) return;

    setSelectedTaskIds((prev) => (
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    ));
  };

  const handleDeleteSelected = () => {
    if (selectedTaskIds.length === 0) return;

    onDeleteTasks(selectedTaskIds);
    setSelectedTaskIds([]);
  };

  return (
    <div className="day-detail">
      <div className="day-detail__header">
        <div className="day-detail__date">{formatDate(date)}</div>
        <div className="day-detail__actions">
          {isEditing ? (
            <button
              type="button"
              className="day-detail__delete-button"
              onClick={handleDeleteSelected}
              disabled={selectedTaskIds.length === 0}
              aria-label="選択したタスクを削除"
              title="選択したタスクを削除"
            >
              🗑
            </button>
          ) : (
            <button
              type="button"
              className="day-detail__add-trigger"
              onClick={handleOpenTaskAddModal}
            >
              タスク追加
            </button>
          )}
          <button
            type="button"
            className={`day-detail__edit-button${isEditing ? ' is-active' : ''}`}
            aria-label="この日の目標を編集"
            title="この日の目標を編集"
            onClick={toggleEditing}
          >
            ✎
          </button>
        </div>
      </div>
      <div className="day-detail__count">
        {dayGoals.length > 0
          ? `${completed} / ${dayGoals.length} 件完了`
          : 'この日のタスクなし'}
      </div>

      {isEditing && (
        <div className="day-detail__hint day-detail__hint--editing">編集モードではタスクを押すと削除対象として赤く選択されます。</div>
      )}

      {dayGoals.length === 0 ? (
        <div className="day-detail__empty">この日は目標が設定されていません</div>
      ) : (
        <ul className="day-detail__list">
          {dayGoals.map((goal) => (
            <li key={goal.id}>
              <div
                className={[
                  'goal-item',
                  goal.completed ? 'completed' : '',
                  isEditing ? 'is-editing' : '',
                  selectedTaskIds.includes(goal.id) ? 'is-selected-for-delete' : '',
                ].filter(Boolean).join(' ')}
                style={{ cursor: isEditing ? 'pointer' : 'default' }}
                onClick={() => toggleTaskSelection(goal.id)}
              >
                <div
                  className={[
                    'goal-item__check',
                    goal.completed ? 'checked' : '',
                    isEditing && selectedTaskIds.includes(goal.id) ? 'marked-for-delete' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {isEditing && selectedTaskIds.includes(goal.id) ? '−' : goal.completed ? '✓' : ''}
                </div>
                <div className="goal-item__body">
                  <div className="goal-item__title">{goal.title}</div>
                  <div className="goal-item__meta">
                    {(() => {
                      const tags = getParentTags(goal.goalId);
                      return (
                        <>
                          {(tags.long || goal.goalId) && <span className="tag tag--long">{tags.long ?? '長期目標(未設定)'}</span>}
                          {tags.mid && <span className="tag tag--mid">{tags.mid}</span>}
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
    </div>
  );
}

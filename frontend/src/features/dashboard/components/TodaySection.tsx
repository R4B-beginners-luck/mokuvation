import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Task, MidTermGoal, LongTermGoal, ShortTermGoal } from '../../../types';
import { TaskAddModal } from '../../tasks'; 
import { TaskDeleteConfirm } from '../../tasks';
import {
  pickRandomTaskMessage,
  TaskCelebrationBubble,
  TaskCelebrationCheck,
  TASK_CELEBRATION_TIMING,
  useCelebrationPhase,
} from '../../../components/ui/celebration';

interface TodaySectionProps {
  goals: Task[]; // 親から渡される、フィルタ済みの今日のタスク
  midTermGoals: MidTermGoal[];
  longTermGoals: LongTermGoal[];
  shortTermGoals: ShortTermGoal[];
  onToggle: (id: string) => void;
  onOpenModal: () => void;
  onAddTask: (newTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TodaySection({
  goals,
  midTermGoals = [],
  longTermGoals = [],
  shortTermGoals = [],
  onToggle,
  onAddTask,
  onDeleteTask,
}: TodaySectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [taskCelebration, setTaskCelebration] = useState<{
    taskId: string;
    message: string;
    sessionId: number;
  } | null>(null);

  const celebrationSessionKey = taskCelebration
    ? `${taskCelebration.taskId}-${taskCelebration.sessionId}`
    : null;

  const { phase: celebrationPhase, startExit: skipCelebration, handleAnimationEnd } = useCelebrationPhase({
    sessionKey: celebrationSessionKey,
    ...TASK_CELEBRATION_TIMING,
    onDismissed: () => setTaskCelebration(null),
  });

  const handleTaskToggle = (goal: Task) => {
    // クリック時点ではまだ未完了。false→true の瞬間だけ励ましを出す
    if (!goal.completed) {
      setTaskCelebration({
        taskId: goal.id,
        message: pickRandomTaskMessage(),
        sessionId: Date.now(),
      });
    }
    onToggle(goal.id);
  };

  const completed = goals.filter((g) => g.completed).length;

  // goalId が何の目標種別を指しているか判定し、長期・中期の親を遡る
  const resolveLongTermGoalId = (goalId?: string): string | undefined => {
    if (!goalId) return undefined;

    // goalId が long term goal ID か確認
    const longTerm = longTermGoals.find((l) => l.id === goalId);
    if (longTerm) return longTerm.id;

    // goalId が mid term goal ID か確認
    const midTerm = midTermGoals.find((m) => m.id === goalId);
    if (midTerm && midTerm.longTermGoalId) return midTerm.longTermGoalId;

    // goalId が short term goal ID か確認
    const shortTerm = shortTermGoals.find((s) => s.id === goalId);
    if (shortTerm) {
      if (shortTerm.longTermGoalId) return shortTerm.longTermGoalId;
      if (shortTerm.midTermGoalId) {
        const parentMid = midTermGoals.find((m) => m.id === shortTerm.midTermGoalId);
        return parentMid?.longTermGoalId;
      }
    }

    return undefined;
  };

  const resolveMidTermGoalId = (goalId?: string): string | undefined => {
    if (!goalId) return undefined;

    // goalId が mid term goal ID か確認
    const midTerm = midTermGoals.find((m) => m.id === goalId);
    if (midTerm) return midTerm.id;

    // goalId が short term goal ID か確認
    const shortTerm = shortTermGoals.find((s) => s.id === goalId);
    if (shortTerm && shortTerm.midTermGoalId) return shortTerm.midTermGoalId;

    return undefined;
  };

  /** タスクが短期に直接紐づいているときだけ短期タグを出す（中期紐づけ時に配下の短期を勝手に出さない） */
  const resolveShortTermGoalId = (goalId?: string): string | undefined => {
    if (!goalId) return undefined;
    const shortTerm = shortTermGoals.find((s) => s.id === goalId);
    return shortTerm?.id;
  };

  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-gold)' }} />
        今日のタスク
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--accent-gold)' }}>
          {completed} / {goals.length}
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: 'var(--sp-4)' }}>
        <div
          className="progress-bar__fill"
          style={{ width: `${goals.length ? (completed / goals.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="today-goals__list">
        {goals.map((goal) => {
          const isCelebratingRow = taskCelebration?.taskId === goal.id && celebrationPhase !== 'idle';
          const showCheckPop = isCelebratingRow
            && (celebrationPhase === 'entering' || celebrationPhase === 'visible');

          return (
          <li
            key={goal.id}
            className={isCelebratingRow ? 'today-goals__item--celebrating' : undefined}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}
          >
            <div
              className={[
                'goal-item',
                goal.completed ? 'completed' : '',
                isCelebratingRow ? 'goal-item--celebrating' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleTaskToggle(goal)}
              style={{ flex: 1, minWidth: 0 }}
            >
              <div className="task-celebration-wrap">
                <TaskCelebrationCheck
                  completed={goal.completed}
                  showCheckPop={showCheckPop}
                  animationKey={isCelebratingRow ? taskCelebration?.sessionId : undefined}
                />
                {isCelebratingRow && taskCelebration && (
                  <TaskCelebrationBubble
                    message={taskCelebration.message}
                    phase={celebrationPhase}
                    onSkip={skipCelebration}
                    onAnimationEnd={handleAnimationEnd}
                  />
                )}
              </div>
              <div className="goal-item__body">
                <div className="goal-item__title" title={goal.title}>{goal.title}</div>
                <div className="goal-item__meta">
                  {goal.goalId && resolveLongTermGoalId(goal.goalId) && (
                    <span
                      className="tag tag--long"
                      title={longTermGoals.find((l) => l.id === resolveLongTermGoalId(goal.goalId))?.title}
                    >
                      {longTermGoals.find((l) => l.id === resolveLongTermGoalId(goal.goalId))?.title}
                    </span>
                  )}
                  {goal.goalId && resolveMidTermGoalId(goal.goalId) && (
                    <span
                      className="tag tag--mid"
                      style={{ marginLeft: 4 }}
                      title={midTermGoals.find((m) => m.id === resolveMidTermGoalId(goal.goalId))?.title}
                    >
                      {midTermGoals.find((m) => m.id === resolveMidTermGoalId(goal.goalId))?.title}
                    </span>
                  )}

                  {goal.goalId && resolveShortTermGoalId(goal.goalId) && (
                    <span
                      className="tag tag--short"
                      style={{ marginLeft: 4 }}
                      title={shortTermGoals.find((s) => s.id === resolveShortTermGoalId(goal.goalId))?.title}
                    >
                      {shortTermGoals.find((s) => s.id === resolveShortTermGoalId(goal.goalId))?.title}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '8px', color: 'var(--accent-coral)', fontSize: '16px', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation(); 
                setDeletingTaskId(goal.id); 
              }}
              title="タスクを削除"
            >
              <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
          );
        })}
      </ul>

      <button className="today-goals__add-btn" onClick={() => setIsAddModalOpen(true)}>
        <Plus size={15} strokeWidth={1.75} aria-hidden />
        タスクを追加
      </button>

      {/* 新規追加モーダル */}
      {isAddModalOpen && (
        <TaskAddModal 
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newTask: any) => {
            // 🌟 1. 親（TopPage）で使われている「TODAY」と同じ形式の日付を安全に作る
            const jstDate = new Date(Date.now() + ((new Date().getTimezoneOffset() + 540) * 60 * 1000));
            const todayStr = jstDate.getFullYear() + '-' + 
                             String(jstDate.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(jstDate.getDate()).padStart(2, '0');

            // 🌟 2. バックエンドから scheduled_at が来ればそれを使う。
            // なければ（単独タスクなど）、親のフィルターを確実に通過させるために、
            // TopPage が持っている「TODAY」定数、もしくは今日の日付文字列を絶対に入れる。
            let taskDate = todayStr;
            if (newTask.scheduled_at) {
              taskDate = String(newTask.scheduled_at).substring(0, 10);
            }

            const formattedTask: Task = {
              id: String(newTask.id),
              title: newTask.title,
              // goal_id が 0、null、空文字、undefined のどれであっても綺麗に undefined に統一
              goalId: (newTask.goal_id && String(newTask.goal_id) !== '0') ? String(newTask.goal_id) : undefined,
              completed: Boolean(newTask.is_completed ?? newTask.completed),
              date: taskDate, // ➔ これで親の「g.date === TODAY」を確実に突破します！
              createdAt: newTask.created_at ?? newTask.createdAt ?? new Date().toISOString(),
            };

            onAddTask(formattedTask);
          }}
        />
      )}

      {/* 削除確認モーダル */}
      {deletingTaskId && (
        <TaskDeleteConfirm 
          taskId={deletingTaskId}
          onClose={() => setDeletingTaskId(null)}
          onSuccess={(taskId) => {
            onDeleteTask(taskId); // 親のステートから直接削除
          }}
        />
      )}
    </section>
  );
}
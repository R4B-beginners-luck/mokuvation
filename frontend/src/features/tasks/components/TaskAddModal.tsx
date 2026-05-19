import { useState, useEffect } from 'react';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { taskApi } from '../api/taskApi';
import type { Task } from '../types';

interface TaskAddModalProps {
  goalId?: string | null; 
  onClose: () => void;
  onSuccess: (newTask: Task) => void;
}

export function TaskAddModal({ goalId = null, onClose, onSuccess }: TaskAddModalProps) {
  const { addTask, isLoading, error } = useTaskMutations();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  
  // 追加: 目標の選択状態と、APIから取得した目標リストの管理
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || '');
  const [goals, setGoals] = useState<any[]>([]);

  // 追加: モーダルが開かれたときに目標一覧を取得
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await taskApi.getGoals();
        setGoals(data);
      } catch (err) {
        console.error('目標一覧の取得に失敗しました', err);
      }
    };
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      // 修正: プルダウンで選択されたIDを使用（空文字ならnullとして送信）
      goal_id: selectedGoalId || null,
      title,
      description: description || undefined,
      scheduled_at: scheduledAt || undefined,
    };

    const newTask = await addTask(payload);
    if (newTask) {
      onSuccess(newTask);
      onClose();
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div 
        className="card" 
        style={{ width: '100%', maxWidth: '400px', padding: '24px', backgroundColor: 'var(--bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>タスクの追加</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>紐づける目標（任意）</label>
            <select 
              className="form-input" 
              value={selectedGoalId} 
              onChange={(e) => setSelectedGoalId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- 指定なし（単独タスク） --</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>タイトル <span style={{ color: 'red' }}>*</span></label>
            <input 
              className="form-input" type="text" 
              value={title} onChange={(e) => setTitle(e.target.value)}
              required autoFocus disabled={isLoading}
            />
          </div>

          <div className="form-field">
            <label>詳細・備考</label>
            <textarea 
              className="form-input" rows={3}
              value={description} onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-field">
            <label>実行予定日時</label>
            <input 
              className="form-input" type="datetime-local" 
              value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && <p style={{ color: 'var(--accent-coral)', fontSize: '12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px' }} disabled={isLoading}>
              キャンセル
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? '追加中...' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
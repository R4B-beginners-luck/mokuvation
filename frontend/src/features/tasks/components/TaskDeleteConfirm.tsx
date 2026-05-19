import { useTaskMutations } from '../hooks/useTaskMutations';

interface TaskDeleteConfirmProps {
  taskId: string;
  onClose: () => void;
  onSuccess: (taskId: string) => void;
}

export function TaskDeleteConfirm({ taskId, onClose, onSuccess }: TaskDeleteConfirmProps) {
  const { removeTask, isLoading, error } = useTaskMutations();

  const handleDelete = async () => {
    const success = await removeTask(taskId);
    if (success) {
      onSuccess(taskId);
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
        style={{ width: '100%', maxWidth: '320px', padding: '24px', backgroundColor: 'var(--bg-primary)', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--accent-coral)' }}>タスクの削除</h3>
        <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>
          このタスクを完全に削除しますか？<br/>この操作は取り消せません。
        </p>

        {error && <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px' }} disabled={isLoading}>
            キャンセル
          </button>
          <button 
            type="button" onClick={handleDelete} 
            style={{ flex: 1, padding: '10px', backgroundColor: 'var(--accent-coral)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            disabled={isLoading}
          >
            {isLoading ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}
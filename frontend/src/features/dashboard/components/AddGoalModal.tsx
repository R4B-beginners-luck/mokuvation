import { useState } from 'react';
import { Modal } from '../../../components/Modal';
import type { LongTermGoal, MidTermGoal, ShortTermGoal } from '../../../types';
import { TODAY } from '../../../data/dummy';

interface AddGoalModalProps {
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  onAdd: (task: ShortTermGoal) => void;
  onClose: () => void;
}

export function AddGoalModal({ longTermGoals, midTermGoals, onAdd, onClose }: AddGoalModalProps) {
  const [title, setTitle]           = useState('');
  const [dueDate, setDate]             = useState(TODAY);
  const [longTermId, setLongTermId] = useState(longTermGoals[0]?.id ?? '');
  const [midTermId, setMidTermId]   = useState('');
  const [description, setDescription] = useState('');

  const availableMid = midTermGoals.filter((m) => m.longTermGoalId === longTermId);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const newGoal: ShortTermGoal = {
      id: `st_${Date.now()}`,
      type: 'short',
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate,
      completed: false,
      longTermGoalId: longTermId,
      midTermGoalId: midTermId || undefined,
    };
    onAdd(newGoal);
    onClose();
  };

  return (
    <Modal title="短期目標を追加" onClose={onClose}>
      <div className="modal__form">
        <div className="form-field">
          <label htmlFor="goal-title">目標名</label>
          <input
            id="goal-title"
            className="form-input"
            type="text"
            placeholder="例：TypeScriptの型パズルを3問解く"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label htmlFor="goal-date">日付</label>
          <input
            id="goal-date"
            className="form-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="goal-long">親となる長期目標</label>
          <select
            id="goal-long"
            className="form-select"
            value={longTermId}
            onChange={(e) => { setLongTermId(e.target.value); setMidTermId(''); }}
          >
            {longTermGoals.map((lt) => (
              <option key={lt.id} value={lt.id}>{lt.title}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="goal-mid">
            親となる中期目標
            <span className="form-field__optional">（任意）</span>
          </label>
          <select
            id="goal-mid"
            className="form-select"
            value={midTermId}
            onChange={(e) => setMidTermId(e.target.value)}
          >
            <option value="">── 設定しない ──</option>
            {availableMid.map((mt) => (
              <option key={mt.id} value={mt.id}>{mt.title}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="goal-desc">
            説明
            <span className="form-field__optional">（任意）</span>
          </label>
          <textarea
            id="goal-desc"
            className="form-textarea"
            placeholder="具体的な行動内容や達成条件など…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="modal__actions">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{ opacity: title.trim() ? 1 : 0.5, cursor: title.trim() ? 'pointer' : 'default' }}
          >
            追加する
          </button>
        </div>
      </div>
    </Modal>
  );
}

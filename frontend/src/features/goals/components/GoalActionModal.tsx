import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal } from '../../../types';
import { Modal } from '../../../components/Modal';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';
import { DatePickerField } from '../../../components/ui/DatePickerField/DatePickerField';
import { TODAY } from '../../../data/dummy';
import { COLOR_PALETTE, DEFAULT_GOAL_COLOR } from '../../../const/colors';

export type GoalActionMode = 'edit' | 'add-goal' | 'add-long';

export type GoalActionPayload = {
  title: string;
  description: string;
  dueDate?: string;
  completed?: boolean;
  goalType?: Goal['type'];
  longTermGoalId?: string;
  midTermGoalId?: string | null;
  /** number=パレットインデックス(0-11), null=デフォルト色（color_code をクリア） */
  color_code?: number | null;
};

interface GoalActionModalProps {
  mode: GoalActionMode;
  goal: Goal;
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  presetGoalType?: 'mid' | 'short';
  onClose: () => void;
  onSave: (payload: GoalActionPayload) => void;
  onDelete?: () => void;
  isSaving?: boolean;
}

function getActionTitle(mode: GoalActionMode): string {
  if (mode === 'edit') return '目標を編集';
  if (mode === 'add-long') return '長期目標を追加';
  return '目標を追加';
}

function getInitialPaletteIndex(colorCode?: string | number): number | null {
  if (colorCode === undefined || colorCode === null) return null;
  if (typeof colorCode === 'number') {
    return Number.isInteger(colorCode) ? colorCode : null;
  }
  const index = COLOR_PALETTE.indexOf(String(colorCode));
  return index >= 0 ? index : null;
}

export function GoalActionModal({
  mode,
  goal,
  longTermGoals,
  midTermGoals,
  presetGoalType,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
}: GoalActionModalProps) {
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add-goal' || mode === 'add-long';
  const isAddLongMode = mode === 'add-long';
  const isLong = goal.type === 'long';
  const isMid = goal.type === 'mid';
  const isShort = goal.type === 'short';

  const defaultGoalType: Goal['type'] = goal.type === 'long' ? 'mid' : 'short';

  const [title, setTitle] = useState(isEditMode ? goal.title : '');
  const [description, setDescription] = useState(isEditMode ? goal.description : '');
  const [goalType, setGoalType] = useState<Goal['type']>(() => {
    if (isEditMode || isAddLongMode) return goal.type;
    return presetGoalType ?? defaultGoalType;
  });
  const [longTermGoalId, setLongTermGoalId] = useState(
    isLong ? goal.id : isMid ? (goal as MidTermGoal).longTermGoalId : (goal as ShortTermGoal).longTermGoalId
  );
  const [midTermGoalId, setMidTermGoalId] = useState(() => {
    if (isEditMode && isShort) return (goal as ShortTermGoal).midTermGoalId ?? '';
    if (isAddMode && presetGoalType === 'short' && isMid) return goal.id;
    return '';
  });
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(
    isEditMode ? getInitialPaletteIndex(goal.color_code) : null
  );
  const [dueDate, setDueDate] = useState(
    isEditMode && (isMid || isShort) ? (goal as MidTermGoal | ShortTermGoal).dueDate ?? TODAY : TODAY
  );
  const [completed, setCompleted] = useState(isEditMode ? (goal.completed ?? false) : false);

  const showLongTermSelect =
    (!isEditMode && goalType !== 'long') || (isEditMode && (isMid || isShort));
  const showMidTermSelect =
    (!isEditMode && goalType === 'short') || (isEditMode && isShort);

  const availableMid = midTermGoals.filter((m) => m.longTermGoalId === longTermGoalId);

  const canSetDueDate = isEditMode ? goal.type !== 'long' : goalType !== 'long';

  const saveDisabled = Boolean(
    !title.trim()
    || (!isEditMode && !isAddLongMode && goalType !== 'long' && !longTermGoalId)
  );

  const handleLongTermChange = (nextLongTermId: string) => {
    setLongTermGoalId(nextLongTermId);
    if (midTermGoalId && !midTermGoals.some((m) => m.id === midTermGoalId && m.longTermGoalId === nextLongTermId)) {
      setMidTermGoalId('');
    }
  };

  const handleGoalTypeChange = (nextType: Goal['type']) => {
    setGoalType(nextType);
    if (nextType !== 'short') {
      setMidTermGoalId('');
    }
  };

  const resolveColorCode = (): number | null => {
    if (selectedPaletteIndex === null) return null;
    return selectedPaletteIndex;
  };

  const resolveLongTermGoalId = (): string | undefined => {
    if (isEditMode && isLong) return undefined;
    if (isAddLongMode) return undefined;
    if (!isEditMode && goalType === 'long') return undefined;
    return longTermGoalId || undefined;
  };

  const resolveGoalType = (): Goal['type'] | undefined => {
    if (isEditMode) return undefined;
    if (isAddLongMode) return 'long';
    return goalType;
  };

  const resolveMidTermGoalId = (): string | null | undefined => {
    if (!showMidTermSelect) return undefined;
    return midTermGoalId || null;
  };

  return (
    <Modal title={getActionTitle(mode)} onClose={onClose}>
      <div className="modal__form">
        {mode === 'add-goal' && (
          <div className="form-field">
            <label htmlFor="goal-action-type">目標の粒度</label>
            <select
              id="goal-action-type"
              className="form-select"
              value={goalType}
              onChange={(e) => handleGoalTypeChange(e.target.value as Goal['type'])}
            >
              <option value="mid">中期目標</option>
              <option value="short">短期目標</option>
            </select>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="goal-action-title">目標名</label>
          <input
            id="goal-action-title"
            className="form-input"
            type="text"
            placeholder="例：TypeScriptの型パズルを3問解く"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label htmlFor="goal-action-desc">
            説明
            <span className="form-field__optional">（任意）</span>
          </label>
          <textarea
            id="goal-action-desc"
            className="form-textarea"
            placeholder="具体的な行動内容や達成条件など…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {showLongTermSelect && (
          <div className="form-field">
            <label htmlFor="goal-action-long">関連付ける長期目標</label>
            <select
              id="goal-action-long"
              className="form-select"
              value={longTermGoalId}
              onChange={(e) => handleLongTermChange(e.target.value)}
            >
              {longTermGoals.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        )}

        {showMidTermSelect && (
          <div className="form-field">
            <label htmlFor="goal-action-mid">
              関連付ける中期目標
              <span className="form-field__optional">（任意）</span>
            </label>
            <select
              id="goal-action-mid"
              className="form-select"
              value={midTermGoalId}
              onChange={(e) => setMidTermGoalId(e.target.value)}
            >
              <option value="">── 設定しない ──</option>
              {availableMid.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <label>
            ノード色
            <span className="form-field__optional">（任意）</span>
          </label>
          <button
            type="button"
            className={`goal-color-default${selectedPaletteIndex === null ? ' goal-color-default--selected' : ''}`}
            onClick={() => setSelectedPaletteIndex(null)}
            aria-pressed={selectedPaletteIndex === null}
            aria-label="初期色（未設定）"
          >
            <span
              className="goal-color-default__swatch"
              style={{ backgroundColor: DEFAULT_GOAL_COLOR }}
              aria-hidden
            />
            <span className="goal-color-default__label">初期色（未設定）</span>
          </button>
          <div className="goal-color-grid" role="listbox" aria-label="ノード色">
            {COLOR_PALETTE.map((color, idx) => (
              <button
                key={idx}
                type="button"
                className={`goal-color-swatch${selectedPaletteIndex === idx ? ' goal-color-swatch--selected' : ''}`}
                onClick={() => setSelectedPaletteIndex(idx)}
                style={{ backgroundColor: color }}
                aria-label={`ノード色 ${idx + 1}`}
                aria-selected={selectedPaletteIndex === idx}
                title={`ノード色 ${idx + 1}`}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
            未選択時はデフォルト色（グレー）が使われます。選択した色はゴールマップ上のノードと接続線に反映されます。
          </p>
        </div>

        {canSetDueDate && (
          <div className="form-field">
            <label htmlFor="goal-action-date">
              期限
              <span className="form-field__optional">（任意）</span>
            </label>
            <DatePickerField
              id="goal-action-date"
              value={dueDate}
              onChange={setDueDate}
              clearable
              placeholder="未設定"
            />
          </div>
        )}

        <div className="modal__actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={onClose} disabled={isSaving}>キャンセル</button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave({
                title: title.trim(),
                description: description.trim(),
                dueDate: canSetDueDate && dueDate ? dueDate : undefined,
                completed: isEditMode ? completed : undefined,
                goalType: resolveGoalType(),
                longTermGoalId: resolveLongTermGoalId(),
                midTermGoalId: resolveMidTermGoalId(),
                color_code: resolveColorCode(),
              });
            }}
            disabled={saveDisabled || isSaving}
            style={{
              opacity: saveDisabled || isSaving ? 0.5 : 1,
              cursor: saveDisabled || isSaving ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isSaving ? (
              <>
                <ButtonSpinner />
                保存中…
              </>
            ) : isEditMode ? (
              <>
                <Save size={15} strokeWidth={1.75} aria-hidden />
                保存する
              </>
            ) : (
              <>
                <Save size={15} strokeWidth={1.75} aria-hidden />
                追加する
              </>
            )}
          </button>
        </div>
        {isEditMode && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button
              className="btn-danger"
              onClick={onDelete}
              disabled={isSaving}
              aria-label="目標を削除"
              style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
            }}
          >
            <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            <span>この目標を削除</span>
          </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

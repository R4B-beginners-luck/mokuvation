import { useEffect, useState } from 'react';
import {
  Palette,
  HelpCircle,
  FileText,
  Shield,
  User as UserIcon,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
  Save,
} from 'lucide-react';
import { getAppVersionLabel } from '../utils/appVersion';
import { authApi } from '../features/auth/api/authApi';
import { AUTH_FIELD_LIMITS, validateAuthLength } from '../features/auth/authFieldLimits';
import { Modal } from '../components/Modal';
import { ButtonSpinner } from '../components/ui/ButtonSpinner';
// 💡 ConfirmationModal をインポート (パスは環境に合わせて適宜調整してください)
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  applyThemeColorIndex,
  DEFAULT_THEME_COLOR_INDEX,
  getThemeColorIdByIndex,
  getThemeColorIndexById,
  isThemeColorIndex,
  THEME_COLORS,
} from '../utils/theme';
import type { ThemeColorId, ThemeColorIndex } from '../utils/theme';
import type { User } from '../types';

const THEME_STORAGE_KEY = 'settings:themeColor';

function readStoredThemeColorIndex(): ThemeColorIndex {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === null) {
    return DEFAULT_THEME_COLOR_INDEX;
  }

  const parsed = Number(stored);
  if (isThemeColorIndex(parsed)) {
    return parsed;
  }

  if (isThemeColorIndex(getThemeColorIndexById(stored as ThemeColorId))) {
    return getThemeColorIndexById(stored as ThemeColorId);
  }

  return DEFAULT_THEME_COLOR_INDEX;
}

interface SettingsRowProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  showChevron?: boolean;
  expanded?: boolean;
  danger?: boolean;
}

function SettingsRow({ icon: Icon, label, onClick, showChevron = true, expanded, danger }: SettingsRowProps) {
  return (
    <button
      type="button"
      className={`settings-row${danger ? ' settings-row--danger' : ''}${expanded ? ' settings-row--expanded' : ''}`}
      onClick={onClick}
      aria-expanded={expanded}
    >
      <span className="settings-row__icon">
        <Icon size={18} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="settings-row__label">{label}</span>
      {showChevron && (
        <span className="settings-row__chevron">
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
        </span>
      )}
    </button>
  );
}

// ==========================================
// アカウント変更モーダル
// ==========================================

type AccountEditPayload = {
  user_id: string;
  user_name: string;
  currentPassword?: string;
  newPassword?: string;
};

interface AccountEditModalProps {
  user: User;
  onClose: () => void;
  onSave: (payload: AccountEditPayload) => void | Promise<void>;
  isSaving?: boolean;
  errorMessage?: string | null;
}

function AccountEditModal({ user, onClose, onSave, isSaving = false, errorMessage }: AccountEditModalProps) {
  const [userId, setUserId] = useState(user.user_id);
  const [userName, setUserName] = useState(user.user_name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const wantsPasswordChange = Boolean(currentPassword || newPassword || newPasswordConfirm);
  const passwordFieldsComplete = Boolean(currentPassword && newPassword && newPasswordConfirm);
  const passwordsMatch = newPassword === newPasswordConfirm;

  let passwordValidationError: string | null = null;
  if (wantsPasswordChange && !passwordFieldsComplete) {
    passwordValidationError = 'パスワードを変更する場合は3つの項目すべてを入力してください';
  } else if (wantsPasswordChange && !passwordsMatch) {
    passwordValidationError = '新しいパスワードと確認用パスワードが一致しません';
  }

  const saveDisabled = Boolean(
    !userId.trim()
    || !userName.trim()
    || (wantsPasswordChange && !passwordFieldsComplete)
    || (wantsPasswordChange && !passwordsMatch)
    || isSaving
  );

  const handleSave = () => {
    if (saveDisabled) return;

    const lengthError =
      validateAuthLength('userId', userId)
      || validateAuthLength('userName', userName)
      || (wantsPasswordChange ? validateAuthLength('password', newPassword) : null);
    if (lengthError) {
      setLocalError(lengthError);
      return;
    }
    setLocalError(null);

    onSave({
      user_id: userId.trim(),
      user_name: userName.trim(),
      ...(wantsPasswordChange
        ? { currentPassword, newPassword }
        : {}),
    });
  };

  const displayError = passwordValidationError || localError || errorMessage;

  return (
    <Modal title="アカウントを変更" onClose={onClose}>
      <div className="modal__form">
        <div className="form-field">
          <label htmlFor="account-user-id">ユーザーID</label>
          <input
            id="account-user-id"
            className="form-input"
            type="text"
            value={userId}
            onChange={(e) => {
              setLocalError(null);
              setUserId(e.target.value);
            }}
            disabled={isSaving}
            autoFocus
            maxLength={AUTH_FIELD_LIMITS.userId.max}
          />
        </div>

        <div className="form-field">
          <label htmlFor="account-user-name">
            ユーザー名
            <span className="form-field__optional">（10文字以内）</span>
          </label>
          <input
            id="account-user-name"
            className="form-input"
            type="text"
            value={userName}
            onChange={(e) => {
              setLocalError(null);
              setUserName(e.target.value);
            }}
            disabled={isSaving}
            maxLength={AUTH_FIELD_LIMITS.userName.max}
          />
        </div>

        <div className="form-field">
          <label htmlFor="account-current-password">
            現在のパスワード
            <span className="form-field__optional">（パスワードを変更する場合のみ）</span>
          </label>
          <input
            id="account-current-password"
            className="form-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSaving}
            autoComplete="current-password"
          />
        </div>

        <div className="form-field">
          <label htmlFor="account-new-password">
            新しいパスワード
            <span className="form-field__optional">（任意）</span>
          </label>
          <input
            id="account-new-password"
            className="form-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSaving}
            autoComplete="new-password"
            maxLength={AUTH_FIELD_LIMITS.password.max}
          />
        </div>

        <div className="form-field">
          <label htmlFor="account-new-password-confirm">
            新しいパスワード（確認用）
            <span className="form-field__optional">（任意）</span>
          </label>
          <input
            id="account-new-password-confirm"
            className="form-input"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            disabled={isSaving}
            autoComplete="new-password"
            maxLength={AUTH_FIELD_LIMITS.password.max}
          />
        </div>

        {displayError && (
          <p role="alert" style={{ color: 'var(--accent-coral)', fontSize: '13px' }}>
            {displayError}
          </p>
        )}

        <div className="modal__actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={onClose} disabled={isSaving}>キャンセル</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saveDisabled}
            style={{
              opacity: saveDisabled ? 0.5 : 1,
              cursor: saveDisabled ? 'default' : 'pointer',
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
            ) : (
              <>
                <Save size={15} strokeWidth={1.75} aria-hidden />
                保存する
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface SettingsPageProps {
  user: User | null;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
  onDeleteAccount?: () => void | Promise<void>; // 💡 アカウント削除トリガーを追加
  isDeletingAccount?: boolean;                  // 💡 削除API実行中のローディング状態用
  onThemeColorUpdated: (themeColor: ThemeColorIndex) => void;
  onAccountUpdated?: (user: User) => void;
}

export function SettingsPage({
  user,
  onOpenHelp,
  onOpenTerms,
  onOpenPrivacy,
  onLogout,
  onDeleteAccount,
  isDeletingAccount = false,
  onThemeColorUpdated,
  onAccountUpdated,
}: SettingsPageProps) {
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [themeColorIndex, setThemeColorIndex] = useState<ThemeColorIndex>(DEFAULT_THEME_COLOR_INDEX);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // 💡 確認ダイアログの開閉ステートを追加
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const initialIndex = isThemeColorIndex(user?.theme_color)
      ? user.theme_color
      : readStoredThemeColorIndex();
    setThemeColorIndex(initialIndex);
    applyThemeColorIndex(initialIndex);
    localStorage.setItem(THEME_STORAGE_KEY, String(initialIndex));
  }, [user]);

  const handleSelectThemeColor = async (index: ThemeColorIndex) => {
    setThemeColorIndex(index);
    applyThemeColorIndex(index);
    localStorage.setItem(THEME_STORAGE_KEY, String(index));

    try {
      await authApi.updateMe({ theme_color: index });
      onThemeColorUpdated(index);
    } catch (error) {
      console.error('テーマカラーの保存に失敗しました', error);
    }
  };

  const handleUpdateAccount = async (payload: AccountEditPayload) => {
    setAccountError(null);
    setIsSavingAccount(true);
    try {
      const updatedUser = await authApi.updateMe({
        user_id: payload.user_id,
        user_name: payload.user_name,
      });

      if (payload.currentPassword && payload.newPassword) {
        await authApi.changePassword({
          current_password: payload.currentPassword,
          new_password: payload.newPassword,
          new_password_confirmation: payload.newPassword,
        });
      }

      onAccountUpdated?.(updatedUser);
      setIsAccountModalOpen(false);
    } catch (err: any) {
      const errors = err?.data?.errors;
      const firstFieldError =
        errors?.user_name?.[0]
        || errors?.user_id?.[0]
        || errors?.current_password?.[0]
        || errors?.new_password?.[0]
        || errors?.new_password_confirmation?.[0];
      setAccountError(
        firstFieldError
        || err?.data?.message
        || 'アカウント情報の更新に失敗しました。もう一度お試しください。',
      );
    } finally {
      setIsSavingAccount(false);
    }
  };

  /** バージョン連打でのデバッグ起動は廃止（発表中の誤操作防止）。
   * デバッグ自体は ?mapDebug=1（開発）や localStorage `goal-map-debug` で有効化できる。
   */

  return (
    <div className="settings-page">
      <h1 className="settings-page__title">設定</h1>

      {/* ── 外観 ─────────────────────────────────────────── */}
      <section className="settings-page__section">
        <h2 className="settings-page__section-title">外観</h2>
        <div className="settings-page__section-body">
          <SettingsRow
            icon={Palette}
            label="テーマカラー"
            showChevron={false}
            expanded={themeExpanded}
            onClick={() => setThemeExpanded((prev) => !prev)}
          />
          {themeExpanded && (
            <div className="settings-swatch-panel">
              <div className="settings-swatch-grid">
                {THEME_COLORS.map((color, index) => (
                  <button
                    key={color.id}
                    type="button"
                    className="settings-swatch"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleSelectThemeColor(index as ThemeColorIndex)}
                    aria-label={color.label}
                    aria-pressed={themeColorIndex === index}
                    title={color.label}
                  >
                    {themeColorIndex === index && (
                      <Check size={16} strokeWidth={2.5} className="settings-swatch__check" aria-hidden />
                    )}
                  </button>
                ))}
              </div>
              <p className="settings-swatch-panel__hint">
                選択した色はボタン・選択中のナビゲーション・入力欄のフォーカス・タブに反映されます。
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── サポート ─────────────────────────────────────── */}
      <section className="settings-page__section">
        <h2 className="settings-page__section-title">サポート</h2>
        <div className="settings-page__section-body">
          <SettingsRow icon={HelpCircle} label="ヘルプ" onClick={onOpenHelp} />
          <SettingsRow icon={FileText} label="利用規約" onClick={onOpenTerms} />
          <SettingsRow icon={Shield} label="プライバシーポリシー" onClick={onOpenPrivacy} />
        </div>
      </section>

      {/* ── アカウント ───────────────────────────────────── */}
      <section className="settings-page__section">
        <h2 className="settings-page__section-title">アカウント</h2>
        <div className="settings-page__section-body">
          <SettingsRow
            icon={UserIcon}
            label="アカウントを変更"
            onClick={() => {
              setAccountError(null);
              setIsAccountModalOpen(true);
            }}
          />
          {/* 💡 ログアウトボタンは確認ダイアログを開くようトリガーを変更 */}
          <SettingsRow
            icon={LogOut}
            label="ログアウト"
            showChevron={false}
            onClick={() => setIsLogoutConfirmOpen(true)}
          />
        </div>
      </section>

      {/* ── 危険エリア (視覚的・セクション的に完全に切り離し) ── */}
      <section className="settings-page__section settings-page__section--danger" style={{ marginTop: '24px' }}>
        <div className="settings-page__section-body">
          <SettingsRow
            icon={Trash2}
            label="アカウントを削除"
            showChevron={false}
            danger
            onClick={() => setIsDeleteConfirmOpen(true)}
          />
        </div>
      </section>

      <p className="settings-page__version" aria-label={`アプリバージョン ${getAppVersionLabel()}`}>
        {getAppVersionLabel()}
      </p>
      {isAccountModalOpen && user && (
        <AccountEditModal
          user={user}
          onClose={() => setIsAccountModalOpen(false)}
          onSave={handleUpdateAccount}
          isSaving={isSavingAccount}
          errorMessage={accountError}
        />
      )}

      {/* 💡 ログアウト確認ダイアログ */}
      {isLogoutConfirmOpen && (
        <ConfirmationModal
          title="ログアウト"
          description="ログアウトしますか？"
          confirmLabel="はい"
          cancelLabel="キャンセル"
          onConfirm={() => {
            setIsLogoutConfirmOpen(false);
            onLogout();
          }}
          onCancel={() => setIsLogoutConfirmOpen(false)}
        />
      )}

      {/* 💡 アカウント削除確認ダイアログ（危険操作） */}
      {isDeleteConfirmOpen && (
        <ConfirmationModal
          title="アカウントを削除"
          description="アカウントを削除すると、すべての目標・タスクのデータが完全に削除され、元に戻せません。本当に削除しますか？"
          confirmLabel="削除する"
          cancelLabel="キャンセル"
          isLoading={isDeletingAccount}
          onConfirm={async () => {
            if (onDeleteAccount) {
              await onDeleteAccount();
            }
            setIsDeleteConfirmOpen(false);
          }}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}
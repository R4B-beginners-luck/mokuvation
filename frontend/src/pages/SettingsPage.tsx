import { useEffect, useRef, useState } from 'react';
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
import { isMapDebugStorageOn, setMapDebugStorage } from '../utils/debug';
import { authApi } from '../features/auth/api/authApi';
import { Modal } from '../components/Modal';
import { ButtonSpinner } from '../components/ui/ButtonSpinner';
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
    onSave({
      user_id: userId.trim(),
      user_name: userName.trim(),
      ...(wantsPasswordChange
        ? { currentPassword, newPassword }
        : {}),
    });
  };

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
            onChange={(e) => setUserId(e.target.value)}
            disabled={isSaving}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label htmlFor="account-user-name">ユーザー名</label>
          <input
            id="account-user-name"
            className="form-input"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isSaving}
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
          />
        </div>

        {(passwordValidationError || errorMessage) && (
          <p role="alert" style={{ color: 'var(--accent-coral)', fontSize: '13px' }}>
            {passwordValidationError ?? errorMessage}
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

// 💡 App.tsxからモーダル制御用の関数などを受け取れるようにインターフェースを定義
interface SettingsPageProps {
  user: User | null;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
  onThemeColorUpdated: (themeColor: ThemeColorIndex) => void;
  onAccountUpdated?: (user: User) => void;
}

export function SettingsPage({ user, onOpenHelp, onOpenTerms, onOpenPrivacy, onLogout, onThemeColorUpdated, onAccountUpdated }: SettingsPageProps) {
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [themeColorIndex, setThemeColorIndex] = useState<ThemeColorIndex>(DEFAULT_THEME_COLOR_INDEX);
  const [versionHint, setVersionHint] = useState<string | null>(null);
  const versionTapRef = useRef({ count: 0, timer: 0 as number | undefined });
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

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
      setAccountError(err?.data?.message ?? 'アカウント情報の更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsSavingAccount(false);
    }
  };

  /** バージョンを連続タップでマップデバッグをトグル（iPhone 本番/Preview 調査用） */
  const handleVersionTap = () => {
    const state = versionTapRef.current;
    window.clearTimeout(state.timer);
    state.count += 1;
    state.timer = window.setTimeout(() => {
      state.count = 0;
    }, 1500);

    if (state.count < 7) return;
    state.count = 0;
    const next = !isMapDebugStorageOn();
    setMapDebugStorage(next);
    setVersionHint(
      next
        ? 'マップデバッグ ON（目標マップに数値が出ます）'
        : 'マップデバッグ OFF',
    );
  };

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
          {/* 💡 それぞれ onClick イベントにモーダルを開く処理を紐付けました */}
          <SettingsRow icon={HelpCircle} label="ヘルプ機能" onClick={onOpenHelp} />
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
          {/* 💡 ログアウト処理も連動させました */}
          <SettingsRow icon={LogOut} label="ログアウト" showChevron={false} onClick={onLogout} />

          <div className="settings-page__separator" role="separator" />

          <SettingsRow icon={Trash2} label="アカウントを削除" showChevron={false} danger />
        </div>
      </section>

      <button
        type="button"
        className="settings-page__version"
        onClick={handleVersionTap}
        aria-label={`アプリバージョン ${getAppVersionLabel()}`}
      >
        {getAppVersionLabel()}
      </button>
      {versionHint && (
        <p className="settings-page__version-hint" role="status">
          {versionHint}
        </p>
      )}

      {isAccountModalOpen && user && (
        <AccountEditModal
          user={user}
          onClose={() => setIsAccountModalOpen(false)}
          onSave={handleUpdateAccount}
          isSaving={isSavingAccount}
          errorMessage={accountError}
        />
      )}
    </div>
  );
}
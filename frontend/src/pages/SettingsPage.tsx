import { useEffect, useRef, useState } from 'react';
import {
  Palette,
  HelpCircle,
  FileText,
  Shield,
  User,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
} from 'lucide-react';
import { getAppVersionLabel } from '../utils/appVersion';
import { isMapDebugStorageOn, setMapDebugStorage } from '../utils/debug';
import { authApi } from '../features/auth/api/authApi';
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

// 💡 App.tsxからモーダル制御用の関数などを受け取れるようにインターフェースを定義
interface SettingsPageProps {
  user: User | null;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
  onThemeColorUpdated: (themeColor: ThemeColorIndex) => void;
}

export function SettingsPage({ user, onOpenHelp, onOpenTerms, onOpenPrivacy, onLogout, onThemeColorUpdated }: SettingsPageProps) {
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [themeColorIndex, setThemeColorIndex] = useState<ThemeColorIndex>(DEFAULT_THEME_COLOR_INDEX);
  const [versionHint, setVersionHint] = useState<string | null>(null);
  const versionTapRef = useRef({ count: 0, timer: 0 as number | undefined });

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
          <SettingsRow icon={User} label="アカウントを変更" />
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
    </div>
  );
}
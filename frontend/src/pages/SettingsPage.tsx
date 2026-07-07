import { useEffect, useState } from 'react';
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

type ThemeColorId = 'amber' | 'blue' | 'teal' | 'violet' | 'pink';

type ThemeColorOption = {
  id: ThemeColorId;
  label: string;
  hex: string;
  rgb: string;
};

const THEME_COLORS: ThemeColorOption[] = [
  { id: 'amber',  label: 'アンバー',     hex: '#E8A234', rgb: '232, 162, 52' },
  { id: 'blue',   label: 'ブルー',       hex: '#4D8FE8', rgb: '77, 143, 232' },
  { id: 'teal',   label: 'ティール',     hex: '#5AB5A0', rgb: '90, 181, 160' },
  { id: 'violet', label: 'バイオレット', hex: '#9B7FD4', rgb: '155, 127, 212' },
  { id: 'pink',   label: 'ピンク',       hex: '#D47A9B', rgb: '212, 122, 155' },
];

const DEFAULT_THEME_COLOR: ThemeColorId = 'amber';
const THEME_STORAGE_KEY = 'settings:themeColor';

function applyThemeColor(color: ThemeColorOption) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', color.hex);
  root.style.setProperty('--color-primary-rgb', color.rgb);
}

function readStoredThemeColorId(): ThemeColorId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && THEME_COLORS.some((c) => c.id === stored)) {
    return stored as ThemeColorId;
  }
  return DEFAULT_THEME_COLOR;
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
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onLogout: () => void;
}

export function SettingsPage({ onOpenHelp, onOpenTerms, onOpenPrivacy, onLogout }: SettingsPageProps) {
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColorId>(DEFAULT_THEME_COLOR);

  useEffect(() => {
    const storedId = readStoredThemeColorId();
    setThemeColor(storedId);
    const stored = THEME_COLORS.find((c) => c.id === storedId);
    if (stored) applyThemeColor(stored);
  }, []);

  const handleSelectThemeColor = (id: ThemeColorId) => {
    const color = THEME_COLORS.find((c) => c.id === id);
    if (!color) return;
    setThemeColor(id);
    applyThemeColor(color);
    localStorage.setItem(THEME_STORAGE_KEY, id);
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
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className="settings-swatch"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleSelectThemeColor(color.id)}
                    aria-label={color.label}
                    aria-pressed={themeColor === color.id}
                    title={color.label}
                  >
                    {themeColor === color.id && (
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
    </div>
  );
}
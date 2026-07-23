import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** 目アイコンで表示／非表示を切り替えられるパスワード入力 */
export function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  autoComplete = 'current-password',
  maxLength,
  placeholder,
  onKeyDown,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-input-password">
      <input
        id={id}
        className="form-input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="form-input-password__toggle"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff size={16} strokeWidth={1.75} aria-hidden />
        ) : (
          <Eye size={16} strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}

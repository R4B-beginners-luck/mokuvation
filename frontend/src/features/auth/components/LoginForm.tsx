import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AUTH_FIELD_LIMITS, validateAuthLength } from '../authFieldLimits';
import { PasswordInput } from './PasswordInput';

interface LoginFormProps {
  onLogin: () => void | Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { login, isLoading, error: authError } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId.trim() || !password) {
      setValidationError('ユーザーIDとパスワードを入力してください');
      return;
    }

    const idErr = validateAuthLength('userId', userId);
    if (idErr) {
      setValidationError(idErr);
      return;
    }
    const passErr = validateAuthLength('password', password);
    if (passErr) {
      setValidationError(passErr);
      return;
    }

    setValidationError('');

    const result = await login({ user_id: userId, password });

    if (result) {
      try {
        await onLogin();
      } catch {
        setValidationError('ログイン後のユーザー情報取得に失敗しました。もう一度お試しください');
      }
    }
  };

  const displayError = validationError || authError;

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="login-id">ユーザーID</label>
        <input
          id="login-id"
          className="form-input"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={isLoading}
          autoFocus
          autoComplete="username"
          maxLength={AUTH_FIELD_LIMITS.userId.max}
          placeholder="例：mokuvation"
        />
      </div>

      <div className="form-field">
        <label htmlFor="login-pass">パスワード</label>
        <PasswordInput
          id="login-pass"
          value={password}
          onChange={setPassword}
          disabled={isLoading}
          autoComplete="current-password"
          maxLength={AUTH_FIELD_LIMITS.password.max}
          placeholder="例：8文字以上"
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.form?.requestSubmit()}
        />
      </div>

      {displayError && (
        <p
          role="alert"
          style={{
            fontSize: 13,
            color: 'var(--accent-coral)',
            marginTop: -8,
            padding: '8px 10px',
            borderRadius: 'var(--r-sm)',
            background: 'rgba(232, 92, 92, 0.12)',
            border: '1px solid rgba(232, 92, 92, 0.35)',
          }}
        >
          {displayError}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary"
        style={{ width: '100%', padding: 'var(--sp-4)' }}
        disabled={isLoading}
      >
        {isLoading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}

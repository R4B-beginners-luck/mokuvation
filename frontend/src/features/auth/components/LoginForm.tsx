import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onLogin: () => void | Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  // useAuthから必要な機能を取り出す
  const { login, isLoading, error: authError } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 1. フロントエンドでのバリデーション
    if (!userId.trim() || !password.trim()) {
      setValidationError('ユーザーIDとパスワードを入力してください');
      return;
    }
    setValidationError('');

    // Splash で LoginForm を消さない（失敗時のエラー表示を維持するため）
    const result = await login({ user_id: userId, password });

    if (result) {
      try {
        await onLogin();
      } catch {
        setValidationError('ログイン後のユーザー情報取得に失敗しました。もう一度お試しください');
      }
    }
  };

  // エラー表示の優先順位決定
  const displayError = validationError || authError;

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="login-id">ユーザーID</label>
        <input
          id="login-id"
          className="form-input"
          type="text"
          placeholder="user001"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div className="form-field">
        <label htmlFor="login-pass">パスワード</label>
        <input
          id="login-pass"
          className="form-input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          // Enterキーでの送信を可能にする
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
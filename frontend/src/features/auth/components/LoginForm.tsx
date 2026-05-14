import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { login, isLoading, error: authError } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId.trim() || !password.trim()) {
      setValidationError('ユーザーIDとパスワードを入力してください');
      return;
    }
    setValidationError('');

    const success = await login({ user_id: userId, password });
    if (success) {
      onLogin();
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
          placeholder="user001"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          autoFocus
          disabled={isLoading}
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
        />
      </div>

      {displayError && (
        <p style={{ fontSize: 12, color: 'var(--accent-coral)', marginTop: -8 }}>
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
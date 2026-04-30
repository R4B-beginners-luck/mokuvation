import { useState } from 'react';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [id, setId]       = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!id.trim() || !pass.trim()) {
      setError('IDとパスワードを入力してください');
      return;
    }
    setError('');
    onLogin();
  };

  return (
    <div className="login-form">
      <div className="form-field">
        <label htmlFor="login-id">ユーザーID</label>
        <input
          id="login-id"
          className="form-input"
          type="text"
          placeholder="user@example.com"
          value={id}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--accent-coral)', marginTop: -8 }}>{error}</p>
      )}

      <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: 'var(--sp-4)' }}>
        ログイン
      </button>
    </div>
  );
}

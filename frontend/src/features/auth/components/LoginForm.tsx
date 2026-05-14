import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  // LoginPage側での型エラーを避けるため、引数は (data?: any) としておきます
  onLogin: (data?: any) => void;
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

    // 2. useAuthのlogin関数を実行
    // 設計書に合わせて user_id というキーで送るようフックに渡す
    const result = await login({ user_id: userId, password });

    if (result) {
      /**
       * 【整合性のための注記】
       * 本来は useAuth 内部で localStorage.setItem('user_info', ...) を
       * 行うのが理想的です。もしフック側でやっていない場合は、
       * ここで result (APIレスポンス) を使って保存処理を行います。
       */
      
      // 親コンポーネントに通知
      onLogin(result);
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
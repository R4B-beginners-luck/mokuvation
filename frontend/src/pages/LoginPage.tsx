import { useState } from 'react';
import { LoginForm, RegisterForm } from '../features/auth';

interface LoginPageProps {
  // App.tsx の handleLogin (引数なし) と整合性を合わせる
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  // 'login' または 'register' の状態を管理
  const [view, setView] = useState<'login' | 'register'>('login');

  /**
   * 子コンポーネント（LoginForm / RegisterForm）からの成功通知を受け取る
   * 引数にユーザー情報が含まれていても、App.tsx側の引数なし onLogin を
   * 安全に実行できるようにここでラップします。
   */
  const handleAuthSuccess = (_data?: any) => {
    // ユーザー情報の保存などは各Form側で完結している想定
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-page__bg-decoration">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
      </div>

      <div className="login-card">
        <div className="login-card__brand">
          <div className="login-card__logo">M</div>
          <h1 className="login-card__title">
            moku<span>vation</span>
          </h1>
          <p className="login-card__subtitle">
            {view === 'login' ? '目標と行動を、毎日の力に。' : '新しい一歩を、ここから。'}
          </p>
        </div>

        {/* 表示の切り替え */}
        {view === 'login' ? (
          <>
            <LoginForm onLogin={handleAuthSuccess} />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => setView('register')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--accent-blue)', 
                  cursor: 'pointer', 
                  textDecoration: 'underline', 
                  fontSize: '14px' 
                }}
              >
                新規登録はこちら
              </button>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onSuccess={handleAuthSuccess} />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => setView('login')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--accent-blue)', 
                  cursor: 'pointer', 
                  textDecoration: 'underline', 
                  fontSize: '14px' 
                }}
              >
                ログインに戻る
              </button>
            </div>
          </>
        )}

        <p className="login-hint">
          ※ 認証機能テスト中
        </p>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { LoginForm, RegisterForm } from '../features/auth';
import { BrandMark } from '../components/BrandMark/BrandMark';


interface LoginPageProps {
  onLogin: () => void | Promise<void>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  // 'login' または 'register' の状態を管理
  const [view, setView] = useState<'login' | 'register'>('login');
  const [infoMessage, setInfoMessage] = useState('');

  /**
   * 子コンポーネント（LoginForm / RegisterForm）からの成功通知を受け取る
   * 引数にユーザー情報が含まれていても、App.tsx側の引数なし onLogin を
   * 安全に実行できるようにここでラップします。
   */
  const handleAuthSuccess = async () => {
    await onLogin();
  };

  const handleRegisterSuccess = () => {
    setInfoMessage('登録が完了しました。ログインしてください');
    setView('login');
  };

  return (
    <div className="login-page">
      <div className="login-page__bg-decoration">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
      </div>

      <div className="login-card">
        <div className="login-card__brand">
          <div className="login-card__logo">
            <BrandMark size={52} />
          </div>
          <h1 className="login-card__title">
            moku<span>vation</span>
          </h1>
          <p className="login-card__subtitle">
            {view === 'login' ? '目標と行動を、毎日の力に。' : '新しい一歩を、ここから。'}
          </p>
        </div>

        {view === 'login' && infoMessage && (
          <p
            role="status"
            style={{
              color: 'var(--accent-gold)',
              fontSize: '13px',
              marginBottom: '12px',
              padding: '8px 10px',
              borderRadius: 'var(--r-sm)',
              background: 'rgba(232, 162, 52, 0.12)',
              border: '1px solid rgba(232, 162, 52, 0.35)',
              textAlign: 'center',
            }}
          >
            {infoMessage}
          </p>
        )}

        {/* 表示の切り替え */}
        {view === 'login' ? (
          <>
            <LoginForm onLogin={handleAuthSuccess} />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => { setInfoMessage(''); setView('register'); }} 
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
            <RegisterForm onSuccess={handleRegisterSuccess} />
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
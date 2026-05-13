import { LoginForm } from '../features/auth/components/LoginForm';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
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
          <p className="login-card__subtitle">目標と行動を、毎日の力に。</p>
        </div>

        <LoginForm onLogin={onLogin} />

        <p className="login-hint">
          ※ デモ用モック。任意のIDとパスワードでログインできます。
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useRegister } from '../hooks/useRegister';
import { AUTH_FIELD_LIMITS, validateAuthLength } from '../authFieldLimits';
import { PasswordInput } from './PasswordInput';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading, error } = useRegister();
  const [fields, setFields] = useState({ user_id: '', user_name: '', password: '' });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const checks = [
      validateAuthLength('userId', fields.user_id),
      validateAuthLength('userName', fields.user_name),
      validateAuthLength('password', fields.password),
    ];
    const first = checks.find(Boolean);
    if (first) {
      setValidationError(first);
      return;
    }

    if (await register(fields)) {
      onSuccess();
    }
  };

  const displayError = validationError || error;

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="register-id">ユーザーID</label>
        <input
          id="register-id"
          className="form-input"
          type="text"
          value={fields.user_id}
          onChange={(e) => setFields({ ...fields, user_id: e.target.value })}
          required
          disabled={isLoading}
          autoComplete="username"
          maxLength={AUTH_FIELD_LIMITS.userId.max}
          placeholder="例：mokuvation"
        />
      </div>
      <div className="form-field">
        <label htmlFor="register-name">ユーザー名</label>
        <input
          id="register-name"
          className="form-input"
          type="text"
          value={fields.user_name}
          onChange={(e) => setFields({ ...fields, user_name: e.target.value })}
          required
          disabled={isLoading}
          autoComplete="nickname"
          maxLength={AUTH_FIELD_LIMITS.userName.max}
          placeholder="例：もく太郎"
        />
      </div>
      <div className="form-field">
        <label htmlFor="register-pass">パスワード</label>
        <PasswordInput
          id="register-pass"
          value={fields.password}
          onChange={(password) => setFields({ ...fields, password })}
          disabled={isLoading}
          autoComplete="new-password"
          maxLength={AUTH_FIELD_LIMITS.password.max}
          placeholder="例：8文字以上"
        />
      </div>
      {displayError && (
        <p role="alert" style={{ color: 'var(--accent-coral)', fontSize: '13px' }}>
          {displayError}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%' }}>
        {isLoading ? '登録中...' : '新規登録'}
      </button>
    </form>
  );
}

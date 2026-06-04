import { useState } from 'react';
import { useRegister } from '../hooks/useRegister';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading, error } = useRegister();
  const [fields, setFields] = useState({ user_id: '', user_name: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await register(fields)) onSuccess();
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>ユーザーID</label>
        <input 
          className="form-input" 
          type="text" 
          onChange={e => setFields({...fields, user_id: e.target.value})} 
          required 
        />
      </div>
      <div className="form-field">
        <label>ユーザー名</label>
        <input 
          className="form-input" 
          type="text" 
          onChange={e => setFields({...fields, user_name: e.target.value})} 
          required 
        />
      </div>
      <div className="form-field">
        <label>パスワード</label>
        <input 
          className="form-input" 
          type="password" 
          onChange={e => setFields({...fields, password: e.target.value})} 
          required 
        />
      </div>
      {error && <p style={{ color: 'var(--accent-coral)', fontSize: '12px' }}>{error}</p>}
      <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%' }}>
        {isLoading ? '登録中...' : '新規登録'}
      </button>
    </form>
  );
}
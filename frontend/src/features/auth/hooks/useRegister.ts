import { useState } from 'react';
import { authApi } from '../api/authApi';

export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(credentials);
      // 登録後は明示的にログインしてもらうため、トークンは保持しない
      localStorage.removeItem('auth_token');
      return true;
    } catch (err: any) {
      if (err.status === 422) {
        const errors = err.data?.errors;
        const first =
          errors?.user_id?.[0]
          || errors?.user_name?.[0]
          || errors?.password?.[0]
          || err.data?.message;
        setError(first || '入力内容に誤りがあります');
      } else {
        setError(err.data?.message || '登録に失敗しました');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
};
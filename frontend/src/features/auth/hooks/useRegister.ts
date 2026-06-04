import { useState } from 'react';
import { authApi } from '../api/authApi';

export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.register(credentials);
      localStorage.setItem('auth_token', data.token);
      return true;
    } catch (err: any) {
      // setError(err.data?.errors ? Object.values(err.data.errors)[0][0] : '登録に失敗しました');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
};
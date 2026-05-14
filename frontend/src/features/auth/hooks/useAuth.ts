import { useState } from 'react';
import { authApi } from '../api/authApi';
import type { LoginCredentials, User } from '../types';


export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      // fetchWithAuth から投げられたカスタムエラーオブジェクトを判定
      if (err.status === 422) {
        setError(err.data?.errors?.user_id?.[0] || '入力内容に誤りがあります');
      } else {
        setError('通信エラーが発生しました');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  return { user, isLoading, error, login, logout };
};
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
      if (err.status === 401 || err.status === 403) {
        setError(err.data?.message || 'ユーザーIDまたはパスワードが正しくありません');
      } else if (err.status === 422) {
        setError(
          err.data?.errors?.user_id?.[0]
          || err.data?.errors?.password?.[0]
          || err.data?.message
          || '入力内容に誤りがあります'
        );
      } else if (err.status) {
        setError(err.data?.message || `ログインに失敗しました（${err.status}）`);
      } else {
        setError('通信エラーが発生しました。ネットワーク接続を確認してください');
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
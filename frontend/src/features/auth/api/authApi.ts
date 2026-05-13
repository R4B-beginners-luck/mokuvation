import type { AuthResponse, LoginCredentials, User } from '../types/index.ts';

// バックエンドのURLを定数として定義
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * 認証ヘッダーを自動付与し、エラーハンドリングを行うカスタムfetch
 */
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');

  // 標準で必要なヘッダーを定義
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // トークンが存在すれば Authorization ヘッダーに追加
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // fetchは4xxや5xxエラーで例外を投げないため、手動で判定してスローする
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // フック側で処理しやすいように構造化して投げる
    throw { status: response.status, data: errorData };
  }

  // 204 No Content (ログアウト時など) の場合はパースせずにnullを返す
  if (response.status === 204) return null;

  return response.json();
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    await fetchWithAuth('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: async (): Promise<User> => {
    return fetchWithAuth('/users/me', {
      method: 'GET',
    });
  }
};
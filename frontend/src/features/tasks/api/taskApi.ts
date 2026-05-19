import type { Task, CreateTaskPayload } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const getFetchOptions = (method: string, body?: any): RequestInit => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  };
};

export const taskApi = {
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, getFetchOptions('GET'));
    if (!response.ok) throw new Error('ユーザー情報の取得に失敗しました');
    return response.json();
  },

  // 新規追加: 紐づけ用の目標一覧を取得する
  getGoals: async () => {
    const response = await fetch(`${API_BASE_URL}/goals`, getFetchOptions('GET'));
    if (!response.ok) throw new Error('目標の取得に失敗しました');
    return response.json();
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, getFetchOptions('POST', payload));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
    return response.json();
  },

  delete: async (taskId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, getFetchOptions('DELETE'));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
  },
};
import type { Task, CreateTaskPayload } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

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

  getGoals: async () => {
    const response = await fetch(`${API_BASE_URL}/goals`, getFetchOptions('GET'));
    if (!response.ok) throw new Error('目標の取得に失敗しました');
    return response.json();
  },

  getTasks: async (): Promise<Task[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, getFetchOptions('GET'));
    if (!response.ok) {
      throw new Error('タスクの取得に失敗しました');
    }
    const resData = await response.json();
    
    if (resData && typeof resData === 'object' && 'data' in resData && Array.isArray(resData.data)) {
      return resData.data as Task[]; // 🌟型アサーションで確実に Task の配列にする
    }
    return Array.isArray(resData) ? (resData as Task[]) : [];
  },

  // ⭕【修正】Promise<any> から Promise<Task> に変更
  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, getFetchOptions('POST', payload));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
    const resData = await response.json();

    if (resData && typeof resData === 'object' && 'data' in resData) {
      return resData.data as Task; // 🌟単体タスクオブジェクトとして型を効かせる
    }
    return resData as Task;
  },

  delete: async (taskId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, getFetchOptions('DELETE'));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
  },

  update: async (taskId: string, payload: Partial<{ is_completed: boolean }>): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, getFetchOptions('PATCH', payload));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
    return response.json() as Promise<Task>;
  },
};
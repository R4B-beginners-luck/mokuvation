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

export type BackendGoal = {
  id: string;
  title: string;
  description?: string | null;
  parent_goal_id?: string | null;
  period_type: 'short' | 'middle' | 'long';
  due_at?: string | null;
  created_at: string;
  is_completed: boolean;
  // バックエンドではカラーパレットのインデックス(0-11)を返す
  color_code?: number | null;
};

export const goalApi = {
  getAll: async (): Promise<BackendGoal[]> => {
    const response = await fetch(`${API_BASE_URL}/goals`, getFetchOptions('GET'));
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
    return response.json();
  },
};

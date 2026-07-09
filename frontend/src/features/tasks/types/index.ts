export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  id?: string;
  user_id: string;
  goal_id?: string | null;
  title: string;
  description?: string;
  scheduled_at?: string;
}
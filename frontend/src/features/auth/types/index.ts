export interface User {
  user_id: string;
  user_name: string;
}

export interface LoginCredentials {
  user_id: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}
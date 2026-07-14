import type { ThemeColorIndex } from "../../../utils/theme";

export interface User {
  user_id: string;
  user_name: string;
  theme_color?: ThemeColorIndex;
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

export interface RegisterCredentials {
  user_id: string;
  user_name: string;
  password: string;
}
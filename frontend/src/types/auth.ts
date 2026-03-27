export type User = {
  id: number;
  cuit: string;
  full_name: string;
  current_category_id?: number | null;
  current_category_code?: string | null;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

export type LoginPayload = {
  cuit: string;
  password: string;
};

export type RegisterPayload = {
  cuit: string;
  full_name: string;
  password: string;
  current_category_id?: number;
};
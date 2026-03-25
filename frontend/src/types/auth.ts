export type User = {
  id: number;
  cuit: string;
  full_name: string;
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
};
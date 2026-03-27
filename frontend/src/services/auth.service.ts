import { api } from "./api";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types/auth";

type UpdateMePayload = {
  full_name?: string;
  current_category_id?: number | null;
};

type UpdateMeResponse = {
  message: string;
  user: User;
};

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  register: async (payload: RegisterPayload) => {
    const response = await api.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  updateMe: async (payload: UpdateMePayload) => {
    const response = await api.put<UpdateMeResponse>("/auth/me", payload);
    return response.data;
  },
};
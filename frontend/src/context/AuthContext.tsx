import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/auth.service";
import { storage } from "../utils/storage";
import type { LoginPayload, RegisterPayload, User } from "../types/auth";

type UpdateCurrentUserPayload = {
  full_name?: string;
  current_category_id?: number | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (payload: UpdateCurrentUserPayload) => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = storage.getToken();
    const storedUser = storage.getUser();

    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(storedUser);
  }, []);

  const login = async (payload: LoginPayload) => {
    const data = await authService.login(payload);

    setToken(data.token);
    setUser(data.user);

    storage.setToken(data.token);
    storage.setUser(data.user);
  };

  const register = async (payload: RegisterPayload) => {
    const data = await authService.register(payload);

    setToken(data.token);
    setUser(data.user);

    storage.setToken(data.token);
    storage.setUser(data.user);
  };

  const updateCurrentUser = async (payload: UpdateCurrentUserPayload) => {
    const data = await authService.updateMe(payload);

    setUser(data.user);
    storage.setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    storage.clearAuth();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      updateCurrentUser,
      setUser,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
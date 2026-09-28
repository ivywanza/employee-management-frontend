import { createContext, useContext } from "react";

export type Role = "superadmin" | "admin" | "employee";

export interface AuthUser {
  id: string;
  role: Role;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  start_date: string;
  department_name: string | null;
  isHr: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
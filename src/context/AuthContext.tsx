import { useEffect, useState, type ReactNode } from "react";
import api from "../lib/api";
import { AuthContext, type AuthUser, type Profile } from "./auth";

function readUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const existing = readUserFromToken(localStorage.getItem("access_token"));
    if (!existing) localStorage.removeItem("access_token");
    return existing;
  });
  const [profile, setProfile] = useState<Profile | null>(null);

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setProfile(null);
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const token: string = response.data.access_token;
    localStorage.setItem("access_token", token);
    setUser(readUserFromToken(token));
  };

    useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const me = (await api.get("/users/me")).data;
        let departmentName: string | null = null;
        if (me.department_id) {
          const departments = (await api.get("/departments/")).data;
          departmentName =
            departments.find((d: { id: string; name: string }) => d.id === me.department_id)?.name ?? null;
        }
        if (!cancelled) {
          setProfile({
            id: me.id,
            full_name: me.full_name,
            email: me.email,
            role: me.role,
            start_date: me.start_date,
            department_name: departmentName,
            isHr: departmentName?.trim().toLowerCase() === "hr",
          });
        }
      } catch {
        if (!cancelled) logout();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
import { useCallback, useEffect, useState, type ReactNode } from "react";
import api from "../lib/api";
import { AuthContext, type AuthUser, type Profile } from "./auth";

const SKIP_KEY = "wizard_skipped";

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
  const [wizardSkipped, setWizardSkipped] = useState(() => sessionStorage.getItem(SKIP_KEY) === "1");

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem(SKIP_KEY);
    setWizardSkipped(false);
    setUser(null);
    setProfile(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const token: string = response.data.access_token;
    localStorage.setItem("access_token", token);
    sessionStorage.removeItem(SKIP_KEY);
    setWizardSkipped(false);
    setUser(readUserFromToken(token));
  }, []);

  const skipWizard = useCallback(() => {
    sessionStorage.setItem(SKIP_KEY, "1");
    setWizardSkipped(true);
  }, []);

  const fetchProfile = useCallback(async (): Promise<Profile> => {
    const me = (await api.get("/users/me")).data;
    let departmentName: string | null = null;
    if (me.department_id) {
      const departments = (await api.get("/departments/")).data;
      departmentName =
        departments.find((d: { id: string; name: string }) => d.id === me.department_id)?.name ?? null;
    }
    return {
      id: me.id,
      full_name: me.full_name,
      email: me.email,
      role: me.role,
      start_date: me.start_date,
      department_name: departmentName,
      isHr: departmentName?.trim().toLowerCase() === "hr",
      must_change_password: me.must_change_password,
      welcome_shown: me.welcome_shown,
      needs_wizard: me.needs_wizard,
      missing_documents: me.missing_documents,
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfile(await fetchProfile());
  }, [fetchProfile]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [user, fetchProfile, logout]);

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, refreshProfile, wizardSkipped, skipWizard }}>
      {children}
    </AuthContext.Provider>
  );
}
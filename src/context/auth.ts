
import { createContext, useContext } from "react";

/**
 * System roles:
 *
 * superadmin - Full system access.
 * admin      - Administrative access, including requisition approvals.
 * hr         - HR access, except requisition approvals and self-approval of leave.
 * employee   - Standard employee access.
 */
export type Role = "superadmin" | "admin" | "hr" | "employee";

/**
 * Business entities operating within the same system.
 * The organisation determines the employee's dashboard branding and sections.
 */
export type Organisation = "red_ant" | "bella_organics" | "juakali";

/**
 * Basic authenticated user information.
 */
export interface AuthUser {
  id: string;
  role: Role;
}

/**
 * Extended profile returned by the backend.
 * Used to personalise the dashboard and control access to system features.
 */
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  organisation: Organisation;
  start_date: string;
  department_name: string | null;

  // Determines whether the employee has HR access.
  isHr: boolean;

  // First-login and onboarding controls.
  must_change_password: boolean;
  welcome_shown: boolean;
  needs_wizard: boolean;
  missing_documents: string[];
}

/**
 * Authentication context shared across the application.
 */
export interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;

  // Authentication operations.
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;

  // Onboarding wizard controls.
  wizardSkipped: boolean;
  skipWizard: () => void;
}

/**
 * Provides authentication and profile information to the application.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Access authentication context from any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

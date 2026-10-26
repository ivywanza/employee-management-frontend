import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function OnboardingGate() {
  const { profile, wizardSkipped } = useAuth();
  const { pathname } = useLocation();

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }


  const wizardNeeded = profile.needs_wizard && !(wizardSkipped && !profile.must_change_password);
  const target = wizardNeeded ? "/setup" : !profile.welcome_shown ? "/welcome" : null;

  if (target === null) {
    return pathname === "/setup" || pathname === "/welcome" ? <Navigate to="/" replace /> : <Outlet />;
  }
  return pathname === target ? <Outlet /> : <Navigate to={target} replace />;
}
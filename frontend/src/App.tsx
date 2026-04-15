import { LogOut, Sparkles, Target } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { ActivitiesPage } from "./features/activities/ActivitiesPage";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { SkillsPage } from "./features/skills/SkillsPage";
import { useAuth } from "./features/auth/AuthContext";

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 grid place-items-center text-white font-bold">
              SP
            </div>
            <span className="font-semibold text-slate-900">Skills Portfolio</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavTab to="/activities" icon={<Target className="h-4 w-4" />} label="Activités" />
            <NavTab to="/skills" icon={<Sparkles className="h-4 w-4" />} label="Compétences" />
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">
              {user?.first_name || user?.username}
            </span>
            <button onClick={logout} className="btn-ghost" aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

function NavTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return <div className="min-h-screen grid place-items-center text-slate-500">Chargement…</div>;
  }
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function AnonymousOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "authenticated") return <Navigate to="/activities" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AnonymousOnly>
            <LoginPage />
          </AnonymousOnly>
        }
      />
      <Route
        path="/register"
        element={
          <AnonymousOnly>
            <RegisterPage />
          </AnonymousOnly>
        }
      />
      <Route
        path="/activities"
        element={
          <Protected>
            <ActivitiesPage />
          </Protected>
        }
      />
      <Route
        path="/skills"
        element={
          <Protected>
            <SkillsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/activities" replace />} />
    </Routes>
  );
}

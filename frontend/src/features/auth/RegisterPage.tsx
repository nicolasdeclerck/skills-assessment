import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../../lib/api";
import { AuthLayout } from "./LoginPage";
import { useAuth } from "./AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate("/activities");
    } catch (err) {
      if (err instanceof ApiError && typeof err.data === "object" && err.data) {
        const first = Object.values(err.data as Record<string, string[] | string>).flat()[0];
        setError(String(first ?? "Inscription impossible."));
      } else {
        setError("Inscription impossible, réessayez.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Créer un compte" subtitle="Commencez à documenter vos compétences">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="first_name">Prénom</label>
            <input id="first_name" className="input" value={form.first_name} onChange={update("first_name")} />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Nom</label>
            <input id="last_name" className="input" value={form.last_name} onChange={update("last_name")} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="username">Nom d'utilisateur</label>
          <input id="username" required className="input" value={form.username} onChange={update("username")} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={form.email} onChange={update("email")} />
        </div>
        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className="input"
            value={form.password}
            onChange={update("password")}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà inscrit ?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import type { Activity, ActivityInput } from "../../lib/types";
import { useCreateActivity, useDeleteActivity } from "./queries";

interface Props {
  activities: Activity[];
  onEdit: (id: number) => void;
}

const emptyDraft = (): ActivityInput => ({
  title: "",
  description: "",
  organization: "",
  skills: [],
});

export function ActivitiesTable({ activities, onEdit }: Props) {
  const create = useCreateActivity();
  const del = useDeleteActivity();

  const [draft, setDraft] = useState<ActivityInput>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDraft(emptyDraft());
    setError(null);
  };

  const canSubmit = draft.title.trim().length > 0;

  const handleAdd = async () => {
    setError(null);
    if (!canSubmit) {
      setError("Le titre est obligatoire.");
      return;
    }
    try {
      await create.mutateAsync({
        title: draft.title.trim(),
        organization: draft.organization.trim(),
        description: "",
        skills: [],
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAdd();
    }
  };

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Titre</th>
            <th className="px-3 py-2 font-medium">Organisation</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr className="bg-brand-50/40 align-middle">
            <td className="px-3 py-2">
              <input
                className="input"
                placeholder="Titre *"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onKeyDown={handleKey}
              />
            </td>
            <td className="px-3 py-2">
              <input
                className="input"
                placeholder="Organisation"
                value={draft.organization}
                onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
                onKeyDown={handleKey}
              />
            </td>
            <td className="px-3 py-2">
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={reset}
                  aria-label="Réinitialiser la ligne"
                  disabled={create.isPending}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAdd}
                  disabled={!canSubmit || create.isPending}
                >
                  <Plus className="h-4 w-4" />
                  {create.isPending ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </td>
          </tr>
          {error && (
            <tr>
              <td colSpan={3} className="px-3 py-2 bg-red-50 text-sm text-red-600">
                {error}
              </td>
            </tr>
          )}
          {activities.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                Aucune activité. Utilisez la ligne ci-dessus pour en créer une.
              </td>
            </tr>
          ) : (
            activities.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 align-middle">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{a.title}</div>
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {a.organization || <span className="text-slate-400">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="btn-ghost"
                      onClick={() => onEdit(a.id)}
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="btn-ghost text-red-600"
                      onClick={async () => {
                        if (window.confirm(`Supprimer « ${a.title} » ?`)) {
                          await del.mutateAsync(a.id);
                        }
                      }}
                      aria-label="Supprimer"
                      disabled={del.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

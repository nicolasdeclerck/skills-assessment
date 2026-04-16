import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import type { Activity, ActivityInput, MasteryLevel, Skill } from "../../lib/types";
import { SkillLevelBadge } from "./SkillLevelBadge";
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

function parseSkills(text: string): { skills: Skill[]; error: string | null } {
  if (!text.trim()) return { skills: [], error: null };
  const skills: Skill[] = [];
  for (const raw of text.split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const [rawName, rawLevel] = trimmed.split(":").map((s) => (s ?? "").trim());
    const name = rawName;
    if (!name) continue;
    const level = Number(rawLevel === undefined || rawLevel === "" ? "3" : rawLevel);
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      return { skills: [], error: `Niveau invalide pour « ${name} » (attendu 1–5).` };
    }
    skills.push({ name, level: level as MasteryLevel });
  }
  const names = skills.map((s) => s.name.toLowerCase());
  if (new Set(names).size !== names.length) {
    return { skills: [], error: "Deux compétences portent le même nom." };
  }
  return { skills, error: null };
}

export function ActivitiesTable({ activities, onEdit }: Props) {
  const create = useCreateActivity();
  const del = useDeleteActivity();

  const [draft, setDraft] = useState<ActivityInput>(emptyDraft);
  const [skillsText, setSkillsText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDraft(emptyDraft());
    setSkillsText("");
    setError(null);
  };

  const canSubmit = draft.title.trim().length > 0;

  const handleAdd = async () => {
    setError(null);
    if (!canSubmit) {
      setError("Le titre est obligatoire.");
      return;
    }
    const { skills, error: skillErr } = parseSkills(skillsText);
    if (skillErr) {
      setError(skillErr);
      return;
    }
    try {
      await create.mutateAsync({
        title: draft.title.trim(),
        organization: draft.organization.trim(),
        description: draft.description.trim(),
        skills,
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
            <th className="px-3 py-2 font-medium">Description</th>
            <th className="px-3 py-2 font-medium">Compétences</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr className="bg-brand-50/40 align-top">
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
              <input
                className="input"
                placeholder="Description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                onKeyDown={handleKey}
              />
            </td>
            <td className="px-3 py-2">
              <input
                className="input"
                placeholder="React:5, TypeScript:4"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
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
              <td colSpan={5} className="px-3 py-2 bg-red-50 text-sm text-red-600">
                {error}
              </td>
            </tr>
          )}
          {activities.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                Aucune activité. Utilisez la ligne ci-dessus pour en créer une.
              </td>
            </tr>
          ) : (
            activities.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 align-top">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{a.title}</div>
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {a.organization || <span className="text-slate-400">—</span>}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {a.description ? (
                    <span className="line-clamp-2">{a.description}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {a.skills.length === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {a.skills.map((s) => (
                        <span key={s.id ?? s.name} className="inline-flex items-center gap-1">
                          <span className="text-xs text-slate-800 font-medium">{s.name}</span>
                          <SkillLevelBadge level={s.level} />
                        </span>
                      ))}
                    </div>
                  )}
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

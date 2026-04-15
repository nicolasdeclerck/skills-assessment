import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import { MASTERY_LABELS, type Activity, type ActivityInput, type MasteryLevel, type Skill } from "../../lib/types";

interface Props {
  initialValue?: Activity;
  onCancel: () => void;
  onSubmit: (value: ActivityInput) => Promise<void>;
}

const emptyValue: ActivityInput = {
  title: "",
  description: "",
  organization: "",
  start_date: "",
  end_date: null,
  skills: [],
};

function toInput(activity?: Activity): ActivityInput {
  if (!activity) return { ...emptyValue };
  return {
    title: activity.title,
    description: activity.description,
    organization: activity.organization,
    start_date: activity.start_date,
    end_date: activity.end_date,
    skills: activity.skills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
  };
}

export function ActivityForm({ initialValue, onCancel, onSubmit }: Props) {
  const [value, setValue] = useState<ActivityInput>(() => toInput(initialValue));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ActivityInput>(key: K, next: ActivityInput[K]) =>
    setValue((prev) => ({ ...prev, [key]: next }));

  const updateSkill = (index: number, patch: Partial<Skill>) =>
    setValue((prev) => ({
      ...prev,
      skills: prev.skills.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const removeSkill = (index: number) =>
    setValue((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));

  const addSkill = () =>
    setValue((prev) => ({ ...prev, skills: [...prev.skills, { name: "", level: 3 }] }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Basic client-side validation
    const skills = value.skills.filter((s) => s.name.trim() !== "");
    const names = skills.map((s) => s.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      setError("Deux compétences portent le même nom.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...value,
        skills: skills.map((s) => ({ ...s, name: s.name.trim() })),
        end_date: value.end_date || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label" htmlFor="title">Titre</label>
        <input
          id="title"
          required
          className="input"
          placeholder="Ex. Lead dev sur le projet Atlas"
          value={value.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="organization">Organisation</label>
        <input
          id="organization"
          className="input"
          placeholder="Ex. Acme Corp"
          value={value.organization}
          onChange={(e) => update("organization", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="start_date">Début</label>
          <input
            id="start_date"
            type="date"
            required
            className="input"
            value={value.start_date}
            onChange={(e) => update("start_date", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="end_date">Fin (vide si en cours)</label>
          <input
            id="end_date"
            type="date"
            className="input"
            value={value.end_date ?? ""}
            onChange={(e) => update("end_date", e.target.value || null)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          className="input"
          placeholder="Contexte, rôle, livrables…"
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label mb-0">Compétences exercées</span>
          <button type="button" className="btn-ghost text-sm" onClick={addSkill}>
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        {value.skills.length === 0 && (
          <p className="text-sm text-slate-500">
            Ajoutez au moins une compétence pour décrire ce que vous avez pratiqué.
          </p>
        )}
        <ul className="space-y-2">
          {value.skills.map((skill, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Nom de la compétence"
                value={skill.name}
                onChange={(e) => updateSkill(index, { name: e.target.value })}
              />
              <select
                className="input w-40"
                value={skill.level}
                onChange={(e) =>
                  updateSkill(index, { level: Number(e.target.value) as MasteryLevel })
                }
              >
                {([1, 2, 3, 4, 5] as MasteryLevel[]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl} — {MASTERY_LABELS[lvl]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-ghost text-red-600"
                onClick={() => removeSkill(index)}
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

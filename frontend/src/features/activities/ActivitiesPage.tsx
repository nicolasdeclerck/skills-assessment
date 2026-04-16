import { useState } from "react";
import { Briefcase, LayoutGrid, Pencil, Plus, Table as TableIcon, Trash2 } from "lucide-react";
import clsx from "clsx";

import type { Activity, ActivityInput } from "../../lib/types";
import { ActivitiesTable } from "./ActivitiesTable";
import { ActivityForm } from "./ActivityForm";
import { SkillLevelBadge } from "./SkillLevelBadge";
import {
  useActivities,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
} from "./queries";

type ViewMode = "cards" | "table";

export function ActivitiesPage() {
  const { data, isLoading, isError } = useActivities();
  const createMutation = useCreateActivity();
  const [mode, setMode] = useState<"idle" | "create" | { type: "edit"; id: number }>("idle");
  const [view, setView] = useState<ViewMode>("cards");

  if (isLoading) return <div className="py-10 text-center text-slate-500">Chargement…</div>;
  if (isError) return <div className="py-10 text-center text-red-600">Erreur de chargement.</div>;

  const activities = data?.results ?? [];

  if (mode === "create") {
    return (
      <div className="card p-6 max-w-3xl">
        <h2 className="text-lg font-semibold mb-4">Nouvelle activité</h2>
        <ActivityForm
          onCancel={() => setMode("idle")}
          onSubmit={async (input: ActivityInput) => {
            await createMutation.mutateAsync(input);
            setMode("idle");
          }}
        />
      </div>
    );
  }

  if (typeof mode === "object" && mode.type === "edit") {
    const activity = activities.find((a) => a.id === mode.id);
    if (activity) {
      return <EditActivity activity={activity} onDone={() => setMode("idle")} />;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mes activités</h2>
          <p className="text-sm text-slate-500">
            Documentez vos missions et les compétences que vous y avez exercées.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          {view === "cards" && (
            <button className="btn-primary" onClick={() => setMode("create")}>
              <Plus className="h-4 w-4" /> Nouvelle activité
            </button>
          )}
        </div>
      </div>

      {view === "table" ? (
        <ActivitiesTable
          activities={activities}
          onEdit={(id) => setMode({ type: "edit", id })}
        />
      ) : activities.length === 0 ? (
        <EmptyState onCreate={() => setMode("create")} />
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={() => setMode({ type: "edit", id: activity.id })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const baseClass =
    "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition";
  return (
    <div
      role="tablist"
      aria-label="Mode d'affichage"
      className="inline-flex rounded-md border border-slate-300 bg-white overflow-hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "cards"}
        className={clsx(
          baseClass,
          value === "cards" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
        )}
        onClick={() => onChange("cards")}
      >
        <LayoutGrid className="h-4 w-4" /> Cartes
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "table"}
        className={clsx(
          baseClass,
          "border-l border-slate-300",
          value === "table" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
        )}
        onClick={() => onChange("table")}
      >
        <TableIcon className="h-4 w-4" /> Tableau
      </button>
    </div>
  );
}

function EditActivity({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const update = useUpdateActivity(activity.id);
  return (
    <div className="card p-6 max-w-3xl">
      <h2 className="text-lg font-semibold mb-4">Modifier l'activité</h2>
      <ActivityForm
        initialValue={activity}
        onCancel={onDone}
        onSubmit={async (input) => {
          await update.mutateAsync(input);
          onDone();
        }}
      />
    </div>
  );
}

function ActivityCard({ activity, onEdit }: { activity: Activity; onEdit: () => void }) {
  const deleteMutation = useDeleteActivity();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(activity.id);
    setConfirming(false);
  };

  return (
    <li className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{activity.title}</h3>
          {activity.organization && (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> {activity.organization}
              </span>
            </div>
          )}
          {activity.description && (
            <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{activity.description}</p>
          )}
          {activity.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activity.skills.map((skill) => (
                <div key={skill.id ?? skill.name} className="inline-flex items-center gap-2">
                  <span className="text-sm text-slate-800 font-medium">{skill.name}</span>
                  <SkillLevelBadge level={skill.level} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="btn-ghost" onClick={onEdit} aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="btn-ghost text-red-600"
            onClick={() => setConfirming(true)}
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {confirming && (
        <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between text-sm">
          <span>Supprimer définitivement cette activité ?</span>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setConfirming(false)}>Annuler</button>
            <button className="btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-10 text-center">
      <h3 className="text-lg font-semibold text-slate-900">Aucune activité pour l'instant</h3>
      <p className="mt-2 text-sm text-slate-500">
        Ajoutez votre première activité pour commencer à bâtir votre portefeuille de compétences.
      </p>
      <button className="btn-primary mt-4" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Créer une activité
      </button>
    </div>
  );
}

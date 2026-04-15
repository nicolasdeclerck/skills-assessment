import { Sparkles } from "lucide-react";

import { SkillLevelBadge } from "../activities/SkillLevelBadge";
import { useSkillsSummary } from "../activities/queries";

export function SkillsPage() {
  const { data, isLoading, isError } = useSkillsSummary();

  if (isLoading) return <div className="py-10 text-center text-slate-500">Chargement…</div>;
  if (isError) return <div className="py-10 text-center text-red-600">Erreur de chargement.</div>;

  const summary = data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Synthèse de mes compétences</h2>
        <p className="text-sm text-slate-500">
          Agrégation de toutes vos activités : niveau maximal atteint et nombre d'activités où
          chaque compétence a été exercée.
        </p>
      </div>

      {summary.length === 0 ? (
        <div className="card p-10 text-center">
          <Sparkles className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">
            Aucune compétence encore. Commencez par ajouter des activités.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-200">
          {summary.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between px-5 py-3 gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-slate-900 truncate">{skill.name}</span>
                <span className="text-xs text-slate-500">
                  · {skill.activity_count} activité{skill.activity_count > 1 ? "s" : ""}
                </span>
              </div>
              <SkillLevelBadge level={skill.max_level} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import clsx from "clsx";

import { MASTERY_LABELS, type MasteryLevel } from "../../lib/types";

const COLORS: Record<MasteryLevel, string> = {
  1: "bg-slate-100 text-slate-700 ring-slate-200",
  2: "bg-sky-50 text-sky-700 ring-sky-200",
  3: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  4: "bg-violet-50 text-violet-700 ring-violet-200",
  5: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function SkillLevelBadge({ level }: { level: MasteryLevel }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        COLORS[level],
      )}
    >
      <span className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={clsx(
              "h-1.5 w-1.5 rounded-full mx-px",
              i < level ? "bg-current opacity-80" : "bg-current opacity-20",
            )}
          />
        ))}
      </span>
      {MASTERY_LABELS[level]}
    </span>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../lib/api";
import type { Activity, ActivityInput, Paginated, SkillSummary } from "../../lib/types";

const keys = {
  all: ["activities"] as const,
  list: () => [...keys.all, "list"] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
  skillsSummary: ["skills-summary"] as const,
};

export function useActivities() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: () => apiFetch<Paginated<Activity>>("/activities/"),
  });
}

export function useSkillsSummary() {
  return useQuery({
    queryKey: keys.skillsSummary,
    queryFn: () => apiFetch<SkillSummary[]>("/activities/skills-summary/"),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivityInput) =>
      apiFetch<Activity>("/activities/", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: keys.skillsSummary });
    },
  });
}

export function useUpdateActivity(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivityInput) =>
      apiFetch<Activity>(`/activities/${id}/`, { method: "PUT", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: keys.skillsSummary });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/activities/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: keys.skillsSummary });
    },
  });
}

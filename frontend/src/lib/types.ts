export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  1: "Novice",
  2: "Débutant",
  3: "Intermédiaire",
  4: "Avancé",
  5: "Expert",
};

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Skill {
  id?: number;
  name: string;
  level: MasteryLevel;
  created_at?: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  organization: string;
  start_date: string;
  end_date: string | null;
  skills: Skill[];
  created_at: string;
  updated_at: string;
}

export type ActivityInput = Omit<Activity, "id" | "created_at" | "updated_at" | "skills"> & {
  skills: Skill[];
};

export interface SkillSummary {
  name: string;
  max_level: MasteryLevel;
  activity_count: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SkillLevel {
  label: string;
  color: string;
  pct: number;
}

export function skillLevel(score: number): SkillLevel {
  if (score >= 500) return { label: "C2 – Mastery",      color: "text-emerald-400",       pct: 100 };
  if (score >= 300) return { label: "C1 – Advanced",     color: "text-teal-400",           pct: 85  };
  if (score >= 150) return { label: "B2 – Upper-Inter",  color: "text-sky-400",            pct: 70  };
  if (score >= 60)  return { label: "B1 – Intermediate", color: "text-blue-400",           pct: 55  };
  if (score >= 20)  return { label: "A2 – Elementary",   color: "text-violet-400",         pct: 35  };
  if (score > 0)    return { label: "A1 – Beginner",     color: "text-purple-400",         pct: 15  };
  return                   { label: "Chưa bắt đầu",      color: "text-muted-foreground",   pct: 0   };
}

// Deterministic hash-based heuristics for consistent, reproducible outputs

export function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function seededRandom(seed: string, index = 0): number {
  const h = hash(`${seed}:${index}`);
  return (h % 10000) / 10000;
}

export function pick<T>(arr: T[], seed: string, index = 0): T {
  return arr[hash(`${seed}:${index}`) % arr.length];
}

export function pickN<T>(arr: T[], n: number, seed: string): T[] {
  const shuffled = [...arr].sort((a, b) => hash(`${seed}:${String(a)}`) - hash(`${seed}:${String(b)}`));
  return shuffled.slice(0, n);
}

export function rangeInt(min: number, max: number, seed: string, index = 0): number {
  return min + (hash(`${seed}:${index}`) % (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index = 0): number {
  return min + seededRandom(seed, index) * (max - min);
}

export const FOOTER = `\n---\n💪 Want an AI personal trainer? mama.oliwoods.com/beta`;

// ── Fitness Domain Data ──

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Obliques",
  "Traps",
  "Lats",
  "Rear Delts",
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export interface Exercise {
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  type: "compound" | "isolation";
}

export const EXERCISE_DB: Exercise[] = [
  // Chest
  { name: "Barbell Bench Press", muscle_group: "Chest", equipment: "barbell", difficulty: "intermediate", type: "compound" },
  { name: "Dumbbell Bench Press", muscle_group: "Chest", equipment: "dumbbells", difficulty: "beginner", type: "compound" },
  { name: "Incline Dumbbell Press", muscle_group: "Chest", equipment: "dumbbells", difficulty: "intermediate", type: "compound" },
  { name: "Push-Up", muscle_group: "Chest", equipment: "bodyweight", difficulty: "beginner", type: "compound" },
  { name: "Dumbbell Fly", muscle_group: "Chest", equipment: "dumbbells", difficulty: "intermediate", type: "isolation" },
  { name: "Cable Crossover", muscle_group: "Chest", equipment: "cable", difficulty: "intermediate", type: "isolation" },
  // Back
  { name: "Barbell Row", muscle_group: "Back", equipment: "barbell", difficulty: "intermediate", type: "compound" },
  { name: "Dumbbell Row", muscle_group: "Back", equipment: "dumbbells", difficulty: "beginner", type: "compound" },
  { name: "Pull-Up", muscle_group: "Back", equipment: "bodyweight", difficulty: "intermediate", type: "compound" },
  { name: "Lat Pulldown", muscle_group: "Back", equipment: "cable", difficulty: "beginner", type: "compound" },
  { name: "Seated Cable Row", muscle_group: "Back", equipment: "cable", difficulty: "beginner", type: "compound" },
  { name: "Deadlift", muscle_group: "Back", equipment: "barbell", difficulty: "advanced", type: "compound" },
  // Shoulders
  { name: "Overhead Press", muscle_group: "Shoulders", equipment: "barbell", difficulty: "intermediate", type: "compound" },
  { name: "Dumbbell Shoulder Press", muscle_group: "Shoulders", equipment: "dumbbells", difficulty: "beginner", type: "compound" },
  { name: "Lateral Raise", muscle_group: "Shoulders", equipment: "dumbbells", difficulty: "beginner", type: "isolation" },
  { name: "Face Pull", muscle_group: "Rear Delts", equipment: "cable", difficulty: "beginner", type: "isolation" },
  // Arms
  { name: "Barbell Curl", muscle_group: "Biceps", equipment: "barbell", difficulty: "beginner", type: "isolation" },
  { name: "Dumbbell Curl", muscle_group: "Biceps", equipment: "dumbbells", difficulty: "beginner", type: "isolation" },
  { name: "Hammer Curl", muscle_group: "Biceps", equipment: "dumbbells", difficulty: "beginner", type: "isolation" },
  { name: "Tricep Pushdown", muscle_group: "Triceps", equipment: "cable", difficulty: "beginner", type: "isolation" },
  { name: "Skull Crusher", muscle_group: "Triceps", equipment: "barbell", difficulty: "intermediate", type: "isolation" },
  { name: "Close-Grip Bench Press", muscle_group: "Triceps", equipment: "barbell", difficulty: "intermediate", type: "compound" },
  { name: "Diamond Push-Up", muscle_group: "Triceps", equipment: "bodyweight", difficulty: "intermediate", type: "compound" },
  // Legs
  { name: "Barbell Squat", muscle_group: "Quadriceps", equipment: "barbell", difficulty: "advanced", type: "compound" },
  { name: "Goblet Squat", muscle_group: "Quadriceps", equipment: "dumbbells", difficulty: "beginner", type: "compound" },
  { name: "Bodyweight Squat", muscle_group: "Quadriceps", equipment: "bodyweight", difficulty: "beginner", type: "compound" },
  { name: "Romanian Deadlift", muscle_group: "Hamstrings", equipment: "barbell", difficulty: "intermediate", type: "compound" },
  { name: "Dumbbell Romanian Deadlift", muscle_group: "Hamstrings", equipment: "dumbbells", difficulty: "beginner", type: "compound" },
  { name: "Leg Press", muscle_group: "Quadriceps", equipment: "machine", difficulty: "beginner", type: "compound" },
  { name: "Leg Curl", muscle_group: "Hamstrings", equipment: "machine", difficulty: "beginner", type: "isolation" },
  { name: "Leg Extension", muscle_group: "Quadriceps", equipment: "machine", difficulty: "beginner", type: "isolation" },
  { name: "Hip Thrust", muscle_group: "Glutes", equipment: "barbell", difficulty: "intermediate", type: "compound" },
  { name: "Dumbbell Lunge", muscle_group: "Quadriceps", equipment: "dumbbells", difficulty: "intermediate", type: "compound" },
  { name: "Calf Raise", muscle_group: "Calves", equipment: "bodyweight", difficulty: "beginner", type: "isolation" },
  { name: "Seated Calf Raise", muscle_group: "Calves", equipment: "machine", difficulty: "beginner", type: "isolation" },
  // Core
  { name: "Plank", muscle_group: "Abs", equipment: "bodyweight", difficulty: "beginner", type: "isolation" },
  { name: "Ab Crunch", muscle_group: "Abs", equipment: "bodyweight", difficulty: "beginner", type: "isolation" },
  { name: "Hanging Leg Raise", muscle_group: "Abs", equipment: "bodyweight", difficulty: "intermediate", type: "isolation" },
];

export const WORKOUT_SPLITS: Record<string, string[][]> = {
  PPL: [
    ["Push (Chest, Shoulders, Triceps)"],
    ["Pull (Back, Biceps, Rear Delts)"],
    ["Legs (Quads, Hamstrings, Glutes, Calves)"],
    ["Push (Chest, Shoulders, Triceps)"],
    ["Pull (Back, Biceps, Rear Delts)"],
    ["Legs (Quads, Hamstrings, Glutes, Calves)"],
  ],
  "upper-lower": [
    ["Upper Body (Chest, Back, Shoulders, Arms)"],
    ["Lower Body (Quads, Hamstrings, Glutes, Calves)"],
    ["Upper Body (Chest, Back, Shoulders, Arms)"],
    ["Lower Body (Quads, Hamstrings, Glutes, Calves)"],
  ],
  "full-body": [
    ["Full Body A"],
    ["Full Body B"],
    ["Full Body C"],
  ],
  "bro-split": [
    ["Chest"],
    ["Back"],
    ["Shoulders"],
    ["Arms (Biceps & Triceps)"],
    ["Legs"],
  ],
};

export const MACRO_RATIOS: Record<string, { protein: number; carbs: number; fat: number }> = {
  cut:      { protein: 0.40, carbs: 0.35, fat: 0.25 },
  bulk:     { protein: 0.30, carbs: 0.50, fat: 0.20 },
  maintain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  recomp:   { protein: 0.40, carbs: 0.35, fat: 0.25 },
};

export const EQUIPMENT_TYPES = [
  "full_gym",
  "dumbbells_only",
  "bodyweight",
  "barbell_only",
] as const;

export const PROGRESSION_METHODS = [
  "Linear weight progression (add weight each session)",
  "Double progression (increase reps, then add weight)",
  "Wave loading (heavy/light/medium rotation)",
  "Rep range cycling (low → high reps each week)",
  "Volume accumulation (add sets each week, deload)",
  "Percentage-based progression (% of 1RM increments)",
  "Auto-regulation (RPE-based load selection)",
] as const;

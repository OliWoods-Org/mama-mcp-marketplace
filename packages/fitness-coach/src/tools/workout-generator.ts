import { z } from "zod";
import {
  hash, pick, pickN, rangeInt, seededRandom,
  EXERCISE_DB, WORKOUT_SPLITS, FOOTER,
} from "../heuristics.js";

export const workoutGeneratorSchema = {
  goal: z.enum(["strength", "hypertrophy", "endurance", "fat_loss", "athletic"])
    .describe("Primary training goal"),
  fitness_level: z.enum(["beginner", "intermediate", "advanced"])
    .describe("Current fitness level"),
  days_per_week: z.number().min(2).max(6)
    .describe("Number of training days per week (2-6)"),
  equipment: z.enum(["full_gym", "dumbbells_only", "bodyweight", "barbell_only"])
    .describe("Available equipment"),
  time_per_session_minutes: z.number().optional()
    .describe("Target session length in minutes (optional, default 60)"),
};

// Map goal → rep/set scheme
const GOAL_SCHEMES: Record<string, { sets: [number, number]; reps: [number, number]; rest: string; intensity: string }> = {
  strength:    { sets: [4, 5], reps: [3, 6],   rest: "3-5 min", intensity: "85-95% 1RM" },
  hypertrophy: { sets: [3, 4], reps: [8, 12],  rest: "60-90s",  intensity: "70-80% 1RM" },
  endurance:   { sets: [2, 3], reps: [15, 20], rest: "30-45s",  intensity: "50-65% 1RM" },
  fat_loss:    { sets: [3, 4], reps: [10, 15], rest: "45-60s",  intensity: "65-75% 1RM" },
  athletic:    { sets: [3, 4], reps: [6, 10],  rest: "90-120s", intensity: "75-85% 1RM" },
};

const EQUIPMENT_FILTER: Record<string, string[]> = {
  full_gym:      ["barbell", "dumbbells", "cable", "machine", "bodyweight"],
  dumbbells_only: ["dumbbells", "bodyweight"],
  bodyweight:    ["bodyweight"],
  barbell_only:  ["barbell", "bodyweight"],
};

// Muscle groups addressed per split day label
const DAY_MUSCLE_MAP: Record<string, string[]> = {
  "Push (Chest, Shoulders, Triceps)":      ["Chest", "Shoulders", "Rear Delts", "Triceps"],
  "Pull (Back, Biceps, Rear Delts)":       ["Back", "Lats", "Traps", "Biceps"],
  "Legs (Quads, Hamstrings, Glutes, Calves)": ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
  "Upper Body (Chest, Back, Shoulders, Arms)": ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
  "Lower Body (Quads, Hamstrings, Glutes, Calves)": ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
  "Full Body A": ["Chest", "Back", "Quadriceps"],
  "Full Body B": ["Shoulders", "Hamstrings", "Biceps", "Triceps"],
  "Full Body C": ["Back", "Glutes", "Abs"],
  "Chest":       ["Chest"],
  "Back":        ["Back", "Lats"],
  "Shoulders":   ["Shoulders", "Rear Delts", "Traps"],
  "Arms (Biceps & Triceps)": ["Biceps", "Triceps", "Forearms"],
  "Legs":        ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
};

const COACHING_NOTES: Record<string, string[]> = {
  strength: [
    "Focus on form over weight — every rep should be technically sound.",
    "CNS fatigue accumulates quickly at high intensities. Sleep 8+ hours.",
    "Warm up with 2-3 progressively heavier sets before working sets.",
    "Log every session. You can't manage what you don't measure.",
    "Eat sufficient protein (0.8-1g/lb bodyweight) to support strength gains.",
  ],
  hypertrophy: [
    "Take each set to within 1-2 reps of failure for maximum stimulus.",
    "Mind-muscle connection matters — slow the eccentric (lowering) phase.",
    "Prioritize a caloric surplus of 200-400 calories above maintenance.",
    "Progressive overload is key: add weight or reps each week.",
    "Adequate sleep (7-9 hrs) is when muscle protein synthesis peaks.",
  ],
  endurance: [
    "Keep rest periods short and circuit-style where possible.",
    "Hydration is critical — drink 0.5-1oz of water per lb bodyweight daily.",
    "Prioritize form even when fatigued to prevent injury at high volumes.",
    "Pair with cardio on off-days (20-30 min steady-state or HIIT).",
    "Carbohydrates are your friend — fuel endurance work with complex carbs.",
  ],
  fat_loss: [
    "Superset antagonist muscle groups to save time and boost calorie burn.",
    "A moderate caloric deficit (300-500 cal/day) preserves muscle better than crash dieting.",
    "High protein intake (1g/lb) prevents muscle loss while in a deficit.",
    "NEAT (non-exercise activity) matters — stay active outside the gym.",
    "Track sleep — poor sleep elevates cortisol and impairs fat loss.",
  ],
  athletic: [
    "Include unilateral movements (single-leg, single-arm) for balance.",
    "Power comes from the hips — focus on explosive hip extension.",
    "Mobility work pre-session unlocks better movement patterns.",
    "Sport-specific conditioning should complement this weight program.",
    "Recovery modalities (contrast showers, foam rolling) matter at this intensity.",
  ],
};

interface WorkoutExercise {
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
}

function selectExercisesForDay(
  dayLabel: string,
  equipment: string,
  fitnessLevel: string,
  goal: string,
  seed: string,
  exerciseCount: number
): WorkoutExercise[] {
  const allowedEquipment = EQUIPMENT_FILTER[equipment] || EQUIPMENT_FILTER.full_gym;
  const targetMuscles = DAY_MUSCLE_MAP[dayLabel] || ["Chest", "Back", "Quadriceps"];
  const scheme = GOAL_SCHEMES[goal] || GOAL_SCHEMES.hypertrophy;

  // Filter exercise DB to matching equipment, then prioritize target muscles
  const eligible = EXERCISE_DB.filter((ex) => {
    const eqMatch = allowedEquipment.includes(ex.equipment);
    const levelMatch =
      fitnessLevel === "beginner" ? ex.difficulty === "beginner" :
      fitnessLevel === "intermediate" ? ex.difficulty !== "advanced" :
      true;
    return eqMatch && levelMatch;
  });

  // Prefer exercises that hit target muscles; compound first
  const targeted = eligible
    .filter((ex) => targetMuscles.some((m) => ex.muscle_group.includes(m) || m.includes(ex.muscle_group)))
    .sort((a, b) => (a.type === "compound" ? -1 : 1) - (b.type === "compound" ? -1 : 1));

  // Deterministic selection
  const selected: Exercise[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < exerciseCount * 3 && selected.length < exerciseCount; i++) {
    const candidate = targeted.length > 0
      ? targeted[hash(`${seed}:ex:${i}`) % targeted.length]
      : eligible[hash(`${seed}:ex:${i}`) % eligible.length];
    if (!usedNames.has(candidate.name)) {
      selected.push(candidate);
      usedNames.add(candidate.name);
    }
  }

  // Fill remaining slots if not enough targeted exercises
  for (let i = 0; selected.length < exerciseCount && i < eligible.length * 2; i++) {
    const candidate = eligible[hash(`${seed}:fill:${i}`) % eligible.length];
    if (!usedNames.has(candidate.name)) {
      selected.push(candidate);
      usedNames.add(candidate.name);
    }
  }

  const exerciseNotes: Record<string, string> = {
    compound: "Drive through heels/full foot — brace core throughout the movement.",
    isolation: "Control the eccentric phase (2-3s down). Squeeze the target muscle at peak contraction.",
  };

  return selected.map((ex, i) => {
    const sets = rangeInt(scheme.sets[0], scheme.sets[1], `${seed}:sets:${i}`, 0);
    const repsLow = scheme.reps[0];
    const repsHigh = scheme.reps[1];
    return {
      name: ex.name,
      muscle_group: ex.muscle_group,
      sets,
      reps: goal === "strength" ? `${repsLow}-${repsHigh}` : `${repsLow}-${repsHigh}`,
      rest: scheme.rest,
      notes: exerciseNotes[ex.type],
    };
  });
}

// Needed for type annotation in selectExercisesForDay
type Exercise = typeof EXERCISE_DB[number];

export function workoutGenerator(params: {
  goal: string;
  fitness_level: string;
  days_per_week: number;
  equipment: string;
  time_per_session_minutes?: number;
}): string {
  const { goal, fitness_level, days_per_week, equipment, time_per_session_minutes } = params;
  const sessionTime = time_per_session_minutes ?? 60;
  const seed = `workout:${goal}:${fitness_level}:${days_per_week}:${equipment}`;

  // Pick appropriate split based on days_per_week
  let splitKey: string;
  if (days_per_week <= 3) splitKey = "full-body";
  else if (days_per_week === 4) splitKey = "upper-lower";
  else if (days_per_week === 5) splitKey = "bro-split";
  else splitKey = "PPL";

  const splitDays = WORKOUT_SPLITS[splitKey].slice(0, days_per_week);
  const scheme = GOAL_SCHEMES[goal] || GOAL_SCHEMES.hypertrophy;

  // Estimate exercises per session based on time
  const exercisesPerSession = sessionTime >= 75 ? 6 : sessionTime >= 50 ? 5 : 4;

  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  // Interleave rest days
  const schedule: Array<{ day: string; label: string; isRest: boolean }> = [];
  let workoutIdx = 0;
  for (let i = 0; i < 7 && workoutIdx <= days_per_week; i++) {
    if (workoutIdx < days_per_week) {
      schedule.push({ day: DAY_NAMES[i], label: splitDays[workoutIdx][0], isRest: false });
      workoutIdx++;
      // Insert rest after every 2 training days except on last day
      if (workoutIdx < days_per_week && (workoutIdx % 3 === 0) && i + 1 < 7) {
        i++;
        schedule.push({ day: DAY_NAMES[i], label: "Rest / Active Recovery", isRest: true });
      }
    } else {
      schedule.push({ day: DAY_NAMES[i], label: "Rest / Active Recovery", isRest: true });
      workoutIdx++;
    }
  }

  const goalLabel: Record<string, string> = {
    strength: "Strength",
    hypertrophy: "Hypertrophy / Muscle Building",
    endurance: "Muscular Endurance",
    fat_loss: "Fat Loss & Conditioning",
    athletic: "Athletic Performance",
  };
  const equipmentLabel: Record<string, string> = {
    full_gym: "Full Gym",
    dumbbells_only: "Dumbbells Only",
    bodyweight: "Bodyweight",
    barbell_only: "Barbell Only",
  };

  let out = `## 💪 Weekly Workout Plan\n\n`;
  out += `| Parameter | Value |\n`;
  out += `|-----------|-------|\n`;
  out += `| **Goal** | ${goalLabel[goal] || goal} |\n`;
  out += `| **Level** | ${fitness_level.charAt(0).toUpperCase() + fitness_level.slice(1)} |\n`;
  out += `| **Split** | ${splitKey} |\n`;
  out += `| **Training Days** | ${days_per_week}x/week |\n`;
  out += `| **Equipment** | ${equipmentLabel[equipment] || equipment} |\n`;
  out += `| **Session Length** | ~${sessionTime} min |\n`;
  out += `| **Rep Scheme** | ${scheme.reps[0]}-${scheme.reps[1]} reps @ ${scheme.intensity} |\n\n`;

  out += `---\n\n`;

  // Day-by-day breakdown
  for (const { day, label, isRest } of schedule) {
    out += `### ${day} — ${label}\n\n`;

    if (isRest) {
      out += `**Active recovery options:** 20-30 min walk, light stretching, foam rolling, or yoga. Stay mobile but let your muscles repair.\n\n`;
      continue;
    }

    const daySeed = `${seed}:${day}:${label}`;
    const exercises = selectExercisesForDay(label, equipment, fitness_level, goal, daySeed, exercisesPerSession);

    out += `| Exercise | Muscle | Sets | Reps | Rest |\n`;
    out += `|----------|--------|------|------|------|\n`;
    for (const ex of exercises) {
      out += `| **${ex.name}** | ${ex.muscle_group} | ${ex.sets} | ${ex.reps} | ${ex.rest} |\n`;
    }

    out += `\n**Coaching notes:**\n`;
    for (const ex of exercises) {
      out += `- *${ex.name}:* ${ex.notes}\n`;
    }
    out += `\n`;
  }

  // Warm-up & cool-down
  out += `---\n\n`;
  out += `### Warm-Up Protocol (5-10 min)\n\n`;
  out += `1. **Light cardio** — 3-5 min walk, cycle, or row to elevate heart rate\n`;
  out += `2. **Dynamic stretching** — leg swings, arm circles, hip rotations (5-10 reps each)\n`;
  out += `3. **Activation sets** — 1-2 warm-up sets at 50% of working weight before first exercise\n\n`;

  out += `### Cool-Down Protocol (5-10 min)\n\n`;
  out += `1. **Static stretching** — hold each stretch 20-30s for major muscles worked\n`;
  out += `2. **Breathing** — slow deep breaths to shift from sympathetic to parasympathetic state\n`;
  out += `3. **Hydration** — replenish fluids lost during session\n\n`;

  // Coaching notes
  out += `---\n\n`;
  out += `### Coach's Notes\n\n`;
  const notes = COACHING_NOTES[goal] || COACHING_NOTES.hypertrophy;
  for (const note of notes) {
    out += `- ${note}\n`;
  }

  out += FOOTER;
  return out;
}

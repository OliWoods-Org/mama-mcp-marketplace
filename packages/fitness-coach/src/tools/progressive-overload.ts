import { z } from "zod";
import { hash, pick, PROGRESSION_METHODS, FOOTER } from "../heuristics.js";

export const progressiveOverloadSchema = {
  exercise: z.string()
    .describe("Exercise name (e.g. 'Bench Press', 'Squat', 'Deadlift')"),
  current_weight_lbs: z.number()
    .describe("Current working weight in pounds"),
  current_sets: z.number()
    .describe("Current number of working sets"),
  current_reps: z.number()
    .describe("Current reps per set"),
  goal: z.enum(["strength", "hypertrophy", "endurance"])
    .describe("Training goal determines rep ranges and progression speed"),
  weeks: z.number().min(4).max(16)
    .describe("Number of weeks for the progression plan (4-16)"),
};

// Goal-specific parameters
const GOAL_PARAMS: Record<string, {
  targetRepsMin: number;
  targetRepsMax: number;
  targetSets: number;
  weightIncrement: number;  // lbs to add when progressing
  deloadFrequency: number;  // deload every N weeks
  intensityLabel: string;
  rpeTarget: string;
}> = {
  strength: {
    targetRepsMin: 3,
    targetRepsMax: 6,
    targetSets: 5,
    weightIncrement: 5,
    deloadFrequency: 4,
    intensityLabel: "85-95% 1RM",
    rpeTarget: "RPE 8-9",
  },
  hypertrophy: {
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetSets: 4,
    weightIncrement: 2.5,
    deloadFrequency: 5,
    intensityLabel: "70-80% 1RM",
    rpeTarget: "RPE 7-8",
  },
  endurance: {
    targetRepsMin: 15,
    targetRepsMax: 20,
    targetSets: 3,
    weightIncrement: 2.5,
    deloadFrequency: 6,
    intensityLabel: "50-65% 1RM",
    rpeTarget: "RPE 6-7",
  },
};

// Epley formula: 1RM = weight × (1 + reps/30)
function estimate1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

interface WeekPlan {
  week: number;
  type: "training" | "deload";
  weight: number;
  sets: number;
  reps: string;
  volume: number;   // sets × reps (midpoint) × weight
  notes: string;
  estimated1rm: number;
  progressionMethod: string;
}

export function progressiveOverload(params: {
  exercise: string;
  current_weight_lbs: number;
  current_sets: number;
  current_reps: number;
  goal: string;
  weeks: number;
}): string {
  const { exercise, current_weight_lbs, current_sets, current_reps, goal, weeks } = params;

  const gp = GOAL_PARAMS[goal] ?? GOAL_PARAMS.hypertrophy;
  const seed = `overload:${exercise}:${goal}`;

  // Pick a primary progression method deterministically
  const progressionMethod = pick(PROGRESSION_METHODS as unknown as string[], seed, 0);

  // Determine if we're using double progression or linear
  const useDoubleProgression = progressionMethod.includes("Double progression");
  const useWaveLoading = progressionMethod.includes("Wave loading");
  const useVolumeAccumulation = progressionMethod.includes("Volume accumulation");

  const initial1RM = Math.round(estimate1RM(current_weight_lbs, current_reps));

  // Build week-by-week plan
  const plan: WeekPlan[] = [];

  let currentWeight = current_weight_lbs;
  let currentSets   = current_sets;
  let currentRepsTop = current_reps;

  // Phase parameters
  // We'll use double progression: increase reps until we hit the top of the range, then add weight
  let repsAccumulated = current_reps;

  for (let week = 1; week <= weeks; week++) {
    const isDeload = week % gp.deloadFrequency === 0;

    if (isDeload) {
      const deloadWeight = Math.round(currentWeight * 0.6 / 2.5) * 2.5;
      const deloadSets   = Math.max(currentSets - 1, 2);
      const deloadReps   = gp.targetRepsMax;
      const deloadVolume = deloadSets * deloadReps * deloadWeight;
      const est1rm       = Math.round(estimate1RM(deloadWeight, deloadReps));

      plan.push({
        week,
        type: "deload",
        weight: deloadWeight,
        sets: deloadSets,
        reps: `${deloadReps}`,
        volume: Math.round(deloadVolume),
        notes: "Deload week — reduce load 40%, focus on technique. Neural recovery is essential for continued progress.",
        estimated1rm: est1rm,
        progressionMethod: "Deload",
      });
    } else {
      let weekWeight = currentWeight;
      let weekSets   = currentSets;
      let weekRepsLow: number;
      let weekRepsHigh: number;
      let weekNotes: string;
      let methodUsed: string;

      if (useDoubleProgression) {
        // Double progression: increase reps first, then weight
        if (repsAccumulated < gp.targetRepsMax) {
          repsAccumulated = Math.min(repsAccumulated + 1, gp.targetRepsMax);
          weekNotes = `Add 1 rep per set vs last week. Hold weight at ${weekWeight} lbs until hitting ${gp.targetRepsMax} reps across all sets.`;
          methodUsed = "Double Progression — rep increase";
        } else {
          // Jump weight, reset reps
          currentWeight = Math.round((currentWeight + gp.weightIncrement) / 2.5) * 2.5;
          weekWeight = currentWeight;
          repsAccumulated = gp.targetRepsMin;
          weekNotes = `Weight increase! Reset to ${gp.targetRepsMin} reps at new load ${weekWeight} lbs. Build back up.`;
          methodUsed = "Double Progression — weight increase";
        }
        weekRepsLow  = repsAccumulated;
        weekRepsHigh = repsAccumulated;
      } else if (useWaveLoading) {
        // Wave: heavy/light/medium pattern
        const wavePhase = ((week - 1) % 3);
        const multipliers = [1.0, 0.9, 0.95];
        weekWeight = Math.round(currentWeight * multipliers[wavePhase] / 2.5) * 2.5;
        const repsMultiplier = [1, 1.2, 1.1];
        const baseReps = Math.round(gp.targetRepsMin + (gp.targetRepsMax - gp.targetRepsMin) / 2);
        weekRepsLow  = Math.round(baseReps * repsMultiplier[wavePhase]);
        weekRepsHigh = weekRepsLow + 2;
        const waveLabels = ["Heavy", "Light", "Medium"];
        weekNotes = `${waveLabels[wavePhase]} wave week. Rotate intensity to manage fatigue and drive adaptation.`;
        methodUsed = `Wave Loading — ${waveLabels[wavePhase]}`;
        // Progress base weight after each full wave (every 3 weeks)
        if (wavePhase === 2) {
          currentWeight = Math.round((currentWeight + gp.weightIncrement) / 2.5) * 2.5;
        }
      } else if (useVolumeAccumulation) {
        // Add sets each week, then deload and restart heavier
        const trainingWeekInBlock = (week - Math.floor((week - 1) / gp.deloadFrequency)) - 1;
        weekSets = Math.min(current_sets + Math.floor(trainingWeekInBlock / 2), gp.targetSets + 2);
        weekRepsLow  = gp.targetRepsMin;
        weekRepsHigh = gp.targetRepsMax;
        weekNotes = `Volume block week ${trainingWeekInBlock + 1}. ${weekSets} sets accumulates total volume load for supercompensation.`;
        methodUsed = "Volume Accumulation";
        if (trainingWeekInBlock % 3 === 2) {
          currentWeight = Math.round((currentWeight + gp.weightIncrement) / 2.5) * 2.5;
        }
        weekWeight = currentWeight;
      } else {
        // Linear progression: add weight every week (or every 2 for advanced)
        if ((week - 1) % 2 === 0 && week > 1) {
          currentWeight = Math.round((currentWeight + gp.weightIncrement) / 2.5) * 2.5;
        }
        weekWeight   = currentWeight;
        weekRepsLow  = gp.targetRepsMin;
        weekRepsHigh = gp.targetRepsMax;
        weekNotes    = `Add ${gp.weightIncrement} lbs vs 2 weeks ago if you hit the top of the rep range. Log every set.`;
        methodUsed   = "Linear Progression";
      }

      const repsMidpoint = Math.round((weekRepsLow + weekRepsHigh) / 2);
      const weekVolume   = weekSets * repsMidpoint * weekWeight;
      const est1rm       = Math.round(estimate1RM(weekWeight, weekRepsHigh));
      const repsStr      = weekRepsLow === weekRepsHigh ? `${weekRepsLow}` : `${weekRepsLow}-${weekRepsHigh}`;

      plan.push({
        week,
        type: "training",
        weight: weekWeight,
        sets: weekSets,
        reps: repsStr,
        volume: Math.round(weekVolume),
        notes: weekNotes,
        estimated1rm: est1rm,
        progressionMethod: methodUsed,
      });
    }
  }

  // Calculate final 1RM and progress metrics
  const trainingWeeks = plan.filter((w) => w.type === "training");
  const finalWeek     = trainingWeeks[trainingWeeks.length - 1];
  const final1RM      = finalWeek?.estimated1rm ?? initial1RM;
  const totalVolumeLift = trainingWeeks.reduce((sum, w) => sum + w.volume, 0);
  const pctIncrease   = Math.round(((final1RM - initial1RM) / initial1RM) * 100);

  let out = `## 📈 Progressive Overload Plan\n\n`;

  out += `### Programme Overview\n\n`;
  out += `| Parameter | Value |\n`;
  out += `|-----------|-------|\n`;
  out += `| **Exercise** | ${exercise} |\n`;
  out += `| **Goal** | ${goal.charAt(0).toUpperCase() + goal.slice(1)} |\n`;
  out += `| **Duration** | ${weeks} weeks |\n`;
  out += `| **Progression Method** | ${progressionMethod} |\n`;
  out += `| **Starting Weight** | ${current_weight_lbs} lbs |\n`;
  out += `| **Starting Sets/Reps** | ${current_sets} × ${current_reps} |\n`;
  out += `| **Starting Estimated 1RM** | ~${initial1RM} lbs |\n`;
  out += `| **Target Intensity** | ${gp.intensityLabel} (${gp.rpeTarget}) |\n`;
  out += `| **Deload Frequency** | Every ${gp.deloadFrequency} weeks |\n\n`;

  out += `### Week-by-Week Plan\n\n`;
  out += `| Week | Type | Weight (lbs) | Sets | Reps | Est. 1RM | Volume (lbs) | Method |\n`;
  out += `|------|------|-------------|------|------|----------|-------------|--------|\n`;

  for (const w of plan) {
    const typeLabel = w.type === "deload" ? "🔄 Deload" : "💪 Train";
    out += `| ${w.week} | ${typeLabel} | ${w.weight} | ${w.sets} | ${w.reps} | ~${w.estimated1rm} | ${w.volume.toLocaleString()} | ${w.progressionMethod} |\n`;
  }

  out += `\n### Estimated 1RM Progression\n\n`;
  out += `| Period | Estimated 1RM | Change |\n`;
  out += `|--------|--------------|--------|\n`;
  out += `| **Start** | ${initial1RM} lbs | — |\n`;

  const checkpoints = [4, 8, 12, 16].filter((w) => w <= weeks);
  for (const cp of checkpoints) {
    const cpWeek = plan.find((w) => w.week === cp && w.type === "training");
    if (cpWeek) {
      const change = cpWeek.estimated1rm - initial1RM;
      out += `| **Week ${cp}** | ${cpWeek.estimated1rm} lbs | +${change} lbs |\n`;
    }
  }
  out += `| **End (Week ${weeks})** | ${final1RM} lbs | **+${final1RM - initial1RM} lbs (+${pctIncrease}%)** |\n\n`;

  out += `### Programme Notes\n\n`;

  out += `**When to progress:**\n`;
  out += `- Successfully complete all prescribed sets and reps at the target RPE\n`;
  out += `- Last set should feel like ${gp.rpeTarget} — if it feels easier, add weight\n`;
  out += `- If you miss reps, repeat the same weight next session before progressing\n\n`;

  out += `**When to adjust:**\n`;
  out += `- Stalling for 2+ consecutive weeks → switch to a different progression method\n`;
  out += `- Form breakdown under load → reduce weight 10-15% and rebuild with perfect technique\n`;
  out += `- Persistent joint discomfort → deload immediately and address mobility/technique\n`;
  out += `- Life stress, poor sleep, or illness → consider an extra deload week\n\n`;

  out += `**Deload guidelines:**\n`;
  out += `- Reduce weight by 40%, sets by 1, reps stay the same\n`;
  out += `- Focus on perfect technique and mind-muscle connection\n`;
  out += `- Deloads are not weakness — they are where adaptation consolidates\n\n`;

  out += `**Total Programme Volume:** ~${Math.round(totalVolumeLift / 1000)}k lbs lifted over ${weeks} weeks\n`;

  out += FOOTER;
  return out;
}

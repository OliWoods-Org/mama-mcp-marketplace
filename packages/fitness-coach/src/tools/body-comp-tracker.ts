import { z } from "zod";
import { FOOTER } from "../heuristics.js";

export const bodyCompTrackerSchema = {
  weight_lbs: z.number()
    .describe("Current bodyweight in pounds"),
  body_fat_percentage: z.number()
    .describe("Current body fat percentage (e.g. 20 for 20%)"),
  goal_weight_lbs: z.number().optional()
    .describe("Target bodyweight in pounds (optional)"),
  goal_bf_percentage: z.number().optional()
    .describe("Target body fat percentage (optional)"),
  weeks_available: z.number().optional()
    .describe("Number of weeks to reach goal (optional, used for pace analysis)"),
};

const BF_CATEGORIES_MALE: Array<{ label: string; range: string; min: number; max: number }> = [
  { label: "Essential Fat",    range: "2-5%",   min: 0,  max: 5  },
  { label: "Athletic",         range: "6-13%",  min: 6,  max: 13 },
  { label: "Fitness",          range: "14-17%", min: 14, max: 17 },
  { label: "Average",          range: "18-24%", min: 18, max: 24 },
  { label: "Above Average",    range: "25-31%", min: 25, max: 31 },
  { label: "Obese",            range: "32%+",   min: 32, max: 100 },
];

const BF_CATEGORIES_FEMALE: Array<{ label: string; range: string; min: number; max: number }> = [
  { label: "Essential Fat",    range: "10-13%", min: 0,  max: 13  },
  { label: "Athletic",         range: "14-20%", min: 14, max: 20 },
  { label: "Fitness",          range: "21-24%", min: 21, max: 24 },
  { label: "Average",          range: "25-31%", min: 25, max: 31 },
  { label: "Above Average",    range: "32-39%", min: 32, max: 39 },
  { label: "Obese",            range: "40%+",   min: 40, max: 100 },
];

function getBFCategory(bf: number, sex = "male"): string {
  const cats = sex === "female" ? BF_CATEGORIES_FEMALE : BF_CATEGORIES_MALE;
  return cats.find((c) => bf >= c.min && bf <= c.max)?.label ?? "Unknown";
}

// Realistic safe rate of change
const MAX_FAT_LOSS_PER_WEEK_LBS = 1.5;   // aggressive but sustainable
const MIN_FAT_LOSS_PER_WEEK_LBS = 0.25;  // very slow
const MAX_MUSCLE_GAIN_PER_WEEK_LBS = 0.5; // advanced; beginner can be higher

function projectBodyComp(
  startWeightLbs: number,
  startBF: number,
  weeklyWeightDelta: number,
  weeks: number
): { weight: number; bf: number; leanMass: number; fatMass: number } {
  const startLeanMass = startWeightLbs * (1 - startBF / 100);
  const startFatMass  = startWeightLbs * (startBF / 100);

  const endWeight   = startWeightLbs + weeklyWeightDelta * weeks;
  // Assume weight loss is mostly fat; weight gain split ~30% fat / 70% lean (natural lifting)
  const endFatMass  = weeklyWeightDelta < 0
    ? Math.max(startFatMass + weeklyWeightDelta * weeks * 0.85, 0)
    : startFatMass + weeklyWeightDelta * weeks * 0.3;
  const endLeanMass = endWeight - endFatMass;
  const endBF       = (endFatMass / endWeight) * 100;

  return {
    weight:   Math.round(endWeight * 10) / 10,
    bf:       Math.round(endBF * 10) / 10,
    leanMass: Math.round(endLeanMass * 10) / 10,
    fatMass:  Math.round(endFatMass * 10) / 10,
  };
}

export function bodyCompTracker(params: {
  weight_lbs: number;
  body_fat_percentage: number;
  goal_weight_lbs?: number;
  goal_bf_percentage?: number;
  weeks_available?: number;
}): string {
  const { weight_lbs, body_fat_percentage, goal_weight_lbs, goal_bf_percentage, weeks_available } = params;

  const bf = Math.min(Math.max(body_fat_percentage, 1), 60);
  const currentFatMass  = Math.round(weight_lbs * (bf / 100) * 10) / 10;
  const currentLeanMass = Math.round((weight_lbs - currentFatMass) * 10) / 10;
  const bfCategory      = getBFCategory(bf);

  // Determine direction and weekly targets
  const hasGoal = goal_weight_lbs !== undefined || goal_bf_percentage !== undefined;
  const targetWeight = goal_weight_lbs ?? weight_lbs;
  const targetBF     = goal_bf_percentage ?? bf;
  const weightDelta  = targetWeight - weight_lbs;
  const bfDelta      = targetBF - bf;

  // Determine appropriate weekly rate
  let weeklyWeightDelta: number;
  let goalDescription: string;
  let weeksToGoal: number;

  if (!hasGoal) {
    // Default to a modest cut
    weeklyWeightDelta = -0.5;
    goalDescription   = "Gradual fat loss (no specific goal provided)";
    weeksToGoal       = 12;
  } else if (weightDelta < -2 || bfDelta < -3) {
    // Cutting
    const totalFatToLose = currentFatMass - (targetWeight > 0 ? targetWeight * (targetBF / 100) : currentFatMass * (targetBF / bf));
    const safeWeeks = Math.max(Math.ceil(totalFatToLose / MAX_FAT_LOSS_PER_WEEK_LBS), 4);
    weeklyWeightDelta = weightDelta !== 0 ? Math.max(weightDelta / safeWeeks, -MAX_FAT_LOSS_PER_WEEK_LBS) : -0.75;
    goalDescription   = "Fat loss — caloric deficit required";
    weeksToGoal       = weeks_available ?? safeWeeks;
  } else if (weightDelta > 2) {
    // Bulking
    weeklyWeightDelta = Math.min(weightDelta / Math.max(weeks_available ?? 16, 8), MAX_MUSCLE_GAIN_PER_WEEK_LBS);
    goalDescription   = "Muscle building — caloric surplus required";
    weeksToGoal       = weeks_available ?? Math.ceil(weightDelta / weeklyWeightDelta);
  } else {
    // Recomp or maintenance
    weeklyWeightDelta = weightDelta !== 0 ? weightDelta / Math.max(weeks_available ?? 12, 8) : 0;
    goalDescription   = "Body recomposition — maintenance calories with high protein";
    weeksToGoal       = weeks_available ?? 12;
  }

  // Calorie estimate
  const approxDailyCalorieDelta = Math.round(weeklyWeightDelta * 3500 / 7);

  // Projections
  const proj4  = projectBodyComp(weight_lbs, bf, weeklyWeightDelta, Math.min(4, weeksToGoal));
  const proj8  = projectBodyComp(weight_lbs, bf, weeklyWeightDelta, Math.min(8, weeksToGoal));
  const proj12 = projectBodyComp(weight_lbs, bf, weeklyWeightDelta, Math.min(12, weeksToGoal));
  const projGoal = weeksToGoal <= 12
    ? projectBodyComp(weight_lbs, bf, weeklyWeightDelta, weeksToGoal)
    : null;

  // Weekly targets
  const weeklyLbsTarget = Math.abs(weeklyWeightDelta).toFixed(2);
  const calorieDeltaSign = approxDailyCalorieDelta >= 0 ? "+" : "";

  let out = `## 📊 Body Composition Analysis\n\n`;

  out += `### Current Stats\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Bodyweight** | ${weight_lbs} lbs |\n`;
  out += `| **Body Fat %** | ${bf}% (${bfCategory}) |\n`;
  out += `| **Lean Mass** | ${currentLeanMass} lbs |\n`;
  out += `| **Fat Mass** | ${currentFatMass} lbs |\n`;
  out += `| **Fat-Free Mass Index (approx)** | ${(currentLeanMass / ((68 / 100) ** 2)).toFixed(1)} |\n\n`;

  if (hasGoal) {
    const goalLeanMass = targetWeight > 0 ? Math.round(targetWeight * (1 - targetBF / 100) * 10) / 10 : "N/A";
    const goalFatMass  = targetWeight > 0 ? Math.round(targetWeight * (targetBF / 100) * 10) / 10 : "N/A";

    out += `### Goal Analysis\n\n`;
    out += `| Metric | Current | Goal | Change |\n`;
    out += `|--------|---------|------|--------|\n`;
    out += `| **Weight (lbs)** | ${weight_lbs} | ${targetWeight} | ${weightDelta >= 0 ? "+" : ""}${weightDelta.toFixed(1)} |\n`;
    out += `| **Body Fat %** | ${bf}% | ${targetBF}% | ${bfDelta >= 0 ? "+" : ""}${bfDelta.toFixed(1)}% |\n`;
    out += `| **Lean Mass (lbs)** | ${currentLeanMass} | ${goalLeanMass} | — |\n`;
    out += `| **Fat Mass (lbs)** | ${currentFatMass} | ${goalFatMass} | — |\n\n`;
  }

  out += `### Strategy: ${goalDescription}\n\n`;
  out += `| Target | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Weekly weight change** | ${weeklyWeightDelta >= 0 ? "+" : ""}${weeklyWeightDelta.toFixed(2)} lbs/week |\n`;
  out += `| **Daily calorie adjustment** | ${calorieDeltaSign}${approxDailyCalorieDelta} kcal vs TDEE |\n`;
  out += `| **Timeline** | ~${weeksToGoal} weeks |\n\n`;

  // Realistic timeline check
  if (weeks_available !== undefined && hasGoal) {
    const requiredWeeklyRate = Math.abs(weightDelta / weeks_available);
    if (requiredWeeklyRate > MAX_FAT_LOSS_PER_WEEK_LBS) {
      out += `> ⚠️ **Pace Warning:** Reaching your goal in ${weeks_available} weeks requires losing ${requiredWeeklyRate.toFixed(2)} lbs/week. This exceeds the safe maximum of ${MAX_FAT_LOSS_PER_WEEK_LBS} lbs/week and risks significant muscle loss. Consider extending your timeline to ${Math.ceil(Math.abs(weightDelta) / MAX_FAT_LOSS_PER_WEEK_LBS)} weeks.\n\n`;
    } else if (requiredWeeklyRate < MIN_FAT_LOSS_PER_WEEK_LBS && weightDelta < 0) {
      out += `> ✅ **Pace Check:** Your ${weeks_available}-week timeline is very conservative (${requiredWeeklyRate.toFixed(2)} lbs/week). This is ideal for preserving muscle mass during a cut.\n\n`;
    }
  }

  out += `### Body Composition Projections\n\n`;
  out += `| Timepoint | Weight (lbs) | Body Fat % | Lean Mass (lbs) | Fat Mass (lbs) |\n`;
  out += `|-----------|-------------|------------|-----------------|----------------|\n`;
  out += `| **Now** | ${weight_lbs} | ${bf}% | ${currentLeanMass} | ${currentFatMass} |\n`;

  if (weeksToGoal > 3) {
    out += `| **4 weeks** | ${proj4.weight} | ${proj4.bf}% | ${proj4.leanMass} | ${proj4.fatMass} |\n`;
  }
  if (weeksToGoal > 7) {
    out += `| **8 weeks** | ${proj8.weight} | ${proj8.bf}% | ${proj8.leanMass} | ${proj8.fatMass} |\n`;
  }
  if (weeksToGoal > 11) {
    out += `| **12 weeks** | ${proj12.weight} | ${proj12.bf}% | ${proj12.leanMass} | ${proj12.fatMass} |\n`;
  }
  if (projGoal && weeksToGoal !== 4 && weeksToGoal !== 8 && weeksToGoal !== 12) {
    out += `| **Goal (${weeksToGoal}w)** | ${projGoal.weight} | ${projGoal.bf}% | ${projGoal.leanMass} | ${projGoal.fatMass} |\n`;
  }
  out += `\n`;

  out += `### Weekly Targets\n\n`;
  if (approxDailyCalorieDelta < 0) {
    out += `- Maintain a **${Math.abs(approxDailyCalorieDelta)} kcal/day deficit** (${Math.abs(approxDailyCalorieDelta) * 7} kcal/week)\n`;
    out += `- Aim to lose **${weeklyLbsTarget} lbs per week** on the scale (7-day average)\n`;
    out += `- Protein target: **${Math.round(weight_lbs * 0.9)}-${Math.round(weight_lbs * 1.0)}g/day** to preserve lean mass\n`;
    out += `- Weigh yourself daily and use the weekly average to track true progress\n`;
    out += `- Expect scale fluctuations of ±2-3 lbs from water retention, food volume, and hormones\n`;
  } else if (approxDailyCalorieDelta > 0) {
    out += `- Maintain a **${approxDailyCalorieDelta} kcal/day surplus** (${approxDailyCalorieDelta * 7} kcal/week)\n`;
    out += `- Aim to gain **${weeklyLbsTarget} lbs per week** on the scale (7-day average)\n`;
    out += `- Protein target: **${Math.round(weight_lbs * 0.8)}-${Math.round(weight_lbs * 1.0)}g/day** to maximise muscle synthesis\n`;
    out += `- Expect ~70% of weight gained to be lean mass with good training and nutrition\n`;
    out += `- If gaining faster than ${weeklyLbsTarget} lbs/week consistently, reduce surplus slightly\n`;
  } else {
    out += `- Eat at **maintenance calories** (your TDEE)\n`;
    out += `- Protein target: **${Math.round(weight_lbs * 1.0)}-${Math.round(weight_lbs * 1.1)}g/day** — the most important lever in recomp\n`;
    out += `- Recomp is a slow process — expect months, not weeks, for visible change\n`;
    out += `- Trust the process: track strength gains in the gym as a proxy for muscle gain\n`;
  }

  out += `\n### Actionable Recommendations\n\n`;
  out += `1. **Track everything** — weigh yourself daily, log food in MyFitnessPal or Cronometer\n`;
  out += `2. **Prioritise protein** — hit your protein target before worrying about carbs/fat splits\n`;
  out += `3. **Resistance train** — lifting weights is the #1 factor in preserving/building lean mass\n`;
  out += `4. **Sleep 7-9 hours** — growth hormone peaks during deep sleep; poor sleep elevates cortisol\n`;
  out += `5. **Reassess every 4 weeks** — adjust calories based on actual scale trend vs target\n`;
  out += `6. **Don't panic at daily fluctuations** — water, salt, fibre, and hormones all move the scale ±3 lbs\n`;
  out += `7. **Progress photos matter** — the mirror shows body composition changes the scale misses\n`;

  out += FOOTER;
  return out;
}

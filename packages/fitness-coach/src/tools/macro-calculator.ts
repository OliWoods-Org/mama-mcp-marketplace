import { z } from "zod";
import { MACRO_RATIOS, FOOTER } from "../heuristics.js";

export const macroCalculatorSchema = {
  weight_lbs: z.number()
    .describe("Bodyweight in pounds"),
  height_inches: z.number()
    .describe("Height in inches"),
  age: z.number()
    .describe("Age in years"),
  sex: z.enum(["male", "female"])
    .describe("Biological sex (affects BMR formula)"),
  activity_level: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extremely_active",
  ]).describe("Daily activity level"),
  goal: z.enum(["cut", "bulk", "maintain", "recomp"])
    .describe("Body composition goal"),
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:          1.2,
  lightly_active:     1.375,
  moderately_active:  1.55,
  very_active:        1.725,
  extremely_active:   1.9,
};

const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  sedentary:          "Desk job, little to no exercise",
  lightly_active:     "Light exercise 1-3 days/week",
  moderately_active:  "Moderate exercise 3-5 days/week",
  very_active:        "Hard exercise 6-7 days/week",
  extremely_active:   "Very hard exercise + physical job",
};

const GOAL_CALORIE_ADJUSTMENTS: Record<string, number> = {
  cut:      -500,
  bulk:     +300,
  maintain: 0,
  recomp:   -200,
};

const GOAL_LABELS: Record<string, string> = {
  cut:      "Fat Loss (Cut)",
  bulk:     "Muscle Building (Bulk)",
  maintain: "Weight Maintenance",
  recomp:   "Body Recomposition",
};

const MEAL_TIMING_RECS: Record<string, string[]> = {
  cut: [
    "Pre-workout meal 60-90 min before training (protein + moderate carbs)",
    "Post-workout protein within 30-60 min of finishing (fast-digesting protein ideal)",
    "Larger meals earlier in the day — front-load calories to manage hunger",
    "Evening meal: lean protein + vegetables, minimal starchy carbs",
    "Consider 16:8 intermittent fasting to manage hunger in deficit",
  ],
  bulk: [
    "Pre-workout: carb-rich meal 60-90 min before for energy",
    "Post-workout: protein + high-GI carbs within 45 min to maximise MPS and glycogen",
    "Aim for 4-5 meals spread across the day — easier to hit high calorie targets",
    "Bedtime snack: casein protein or cottage cheese for overnight anabolism",
    "Don't skip breakfast — starting protein synthesis early matters",
  ],
  maintain: [
    "3-4 balanced meals per day with protein in every meal",
    "Pre/post workout nutrition still matters for performance and recovery",
    "Listen to hunger cues — at maintenance calories they are a reliable guide",
    "Consistent meal timing helps regulate hunger hormones (leptin, ghrelin)",
  ],
  recomp: [
    "Carb cycling: higher carbs on training days, lower on rest days",
    "Prioritise protein above all else — 1g/lb bodyweight minimum",
    "Training-day pre/post workout nutrition as per bulk protocol",
    "Rest-day calories: protein-focused, reduce carbs by 30-40%",
    "Be patient — recomp is slow. Track weekly averages, not daily weight",
  ],
};

export function macroCalculator(params: {
  weight_lbs: number;
  height_inches: number;
  age: number;
  sex: string;
  activity_level: string;
  goal: string;
}): string {
  const { weight_lbs, height_inches, age, sex, activity_level, goal } = params;

  // Unit conversions
  const weight_kg = weight_lbs * 0.453592;
  const height_cm = height_inches * 2.54;

  // Mifflin-St Jeor BMR
  // Male:   10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5
  // Female: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
  const bmr = sex === "male"
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.55;
  const tdee = bmr * multiplier;

  const adjustment = GOAL_CALORIE_ADJUSTMENTS[goal] ?? 0;
  const targetCalories = Math.round(tdee + adjustment);

  const ratios = MACRO_RATIOS[goal] ?? MACRO_RATIOS.maintain;

  // Macro grams: protein = 4 cal/g, carbs = 4 cal/g, fat = 9 cal/g
  const proteinCal  = targetCalories * ratios.protein;
  const carbsCal    = targetCalories * ratios.carbs;
  const fatCal      = targetCalories * ratios.fat;

  const proteinG = Math.round(proteinCal / 4);
  const carbsG   = Math.round(carbsCal / 4);
  const fatG     = Math.round(fatCal / 9);

  // Per-meal split (assuming 4 meals)
  const meals = 4;
  const proteinPerMeal = Math.round(proteinG / meals);
  const carbsPerMeal   = Math.round(carbsG / meals);
  const fatPerMeal     = Math.round(fatG / meals);
  const calPerMeal     = Math.round(targetCalories / meals);

  const bmi = weight_kg / ((height_cm / 100) ** 2);
  const bmiCategory =
    bmi < 18.5 ? "Underweight" :
    bmi < 25.0 ? "Normal weight" :
    bmi < 30.0 ? "Overweight" : "Obese";

  const mealTimingNotes = MEAL_TIMING_RECS[goal] ?? MEAL_TIMING_RECS.maintain;

  let out = `## 🥗 Macro & Calorie Calculator\n\n`;

  out += `### Body Stats\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| **Weight** | ${weight_lbs} lbs (${weight_kg.toFixed(1)} kg) |\n`;
  out += `| **Height** | ${height_inches}" (${height_cm.toFixed(0)} cm) |\n`;
  out += `| **Age** | ${age} years |\n`;
  out += `| **Sex** | ${sex.charAt(0).toUpperCase() + sex.slice(1)} |\n`;
  out += `| **BMI** | ${bmi.toFixed(1)} — ${bmiCategory} |\n`;
  out += `| **Activity Level** | ${ACTIVITY_DESCRIPTIONS[activity_level]} |\n`;
  out += `| **Goal** | ${GOAL_LABELS[goal]} |\n\n`;

  out += `### Energy Requirements\n\n`;
  out += `| Calculation | Calories |\n`;
  out += `|-------------|----------|\n`;
  out += `| **BMR** (Mifflin-St Jeor) | ${Math.round(bmr)} kcal |\n`;
  out += `| **TDEE** (maintenance) | ${Math.round(tdee)} kcal |\n`;
  out += `| **Goal adjustment** | ${adjustment >= 0 ? "+" : ""}${adjustment} kcal |\n`;
  out += `| **Target Daily Calories** | **${targetCalories} kcal** |\n\n`;

  out += `### Daily Macro Targets\n\n`;
  out += `| Macro | Grams | Calories | % of Total |\n`;
  out += `|-------|-------|----------|------------|\n`;
  out += `| **Protein** | ${proteinG}g | ${Math.round(proteinCal)} kcal | ${Math.round(ratios.protein * 100)}% |\n`;
  out += `| **Carbohydrates** | ${carbsG}g | ${Math.round(carbsCal)} kcal | ${Math.round(ratios.carbs * 100)}% |\n`;
  out += `| **Fat** | ${fatG}g | ${Math.round(fatCal)} kcal | ${Math.round(ratios.fat * 100)}% |\n`;
  out += `| **Total** | — | **${targetCalories} kcal** | 100% |\n\n`;

  out += `### Sample ${meals}-Meal Split\n\n`;
  out += `Each meal targets approximately **${calPerMeal} kcal**:\n\n`;
  out += `| Macro | Per Meal |\n`;
  out += `|-------|----------|\n`;
  out += `| Protein | ${proteinPerMeal}g |\n`;
  out += `| Carbohydrates | ${carbsPerMeal}g |\n`;
  out += `| Fat | ${fatPerMeal}g |\n\n`;

  out += `**Example meal templates:**\n`;
  if (goal === "cut" || goal === "recomp") {
    out += `- **Breakfast:** ${proteinPerMeal}g protein — e.g. egg whites + oats + berries\n`;
    out += `- **Lunch:** ${proteinPerMeal}g protein — e.g. chicken breast + rice + salad\n`;
    out += `- **Pre-workout:** ${proteinPerMeal}g protein — e.g. Greek yoghurt + banana\n`;
    out += `- **Dinner:** ${proteinPerMeal}g protein — e.g. salmon + roasted veg + quinoa\n`;
  } else if (goal === "bulk") {
    out += `- **Breakfast:** ${proteinPerMeal}g protein — e.g. whole eggs + oats + milk + PB\n`;
    out += `- **Lunch:** ${proteinPerMeal}g protein — e.g. beef + pasta + olive oil\n`;
    out += `- **Pre-workout:** ${proteinPerMeal}g protein — e.g. rice cakes + whey shake\n`;
    out += `- **Dinner:** ${proteinPerMeal}g protein — e.g. steak + sweet potato + broccoli\n`;
  } else {
    out += `- **Breakfast:** ${proteinPerMeal}g protein — e.g. eggs + wholegrain toast + avocado\n`;
    out += `- **Lunch:** ${proteinPerMeal}g protein — e.g. tuna wrap + side salad\n`;
    out += `- **Snack:** ${proteinPerMeal}g protein — e.g. cottage cheese + fruit\n`;
    out += `- **Dinner:** ${proteinPerMeal}g protein — e.g. chicken thighs + roasted veg + rice\n`;
  }

  out += `\n### Meal Timing Recommendations\n\n`;
  for (const rec of mealTimingNotes) {
    out += `- ${rec}\n`;
  }

  out += `\n### High-Protein Food Sources\n\n`;
  out += `| Source | Protein per 100g |\n`;
  out += `|--------|------------------|\n`;
  out += `| Chicken breast (cooked) | ~31g |\n`;
  out += `| Tuna (canned) | ~30g |\n`;
  out += `| Lean beef (90%) | ~26g |\n`;
  out += `| Egg whites | ~11g |\n`;
  out += `| Greek yoghurt (0%) | ~10g |\n`;
  out += `| Cottage cheese (low-fat) | ~12g |\n`;
  out += `| Whey protein powder | ~75-80g |\n`;
  out += `| Tofu (firm) | ~17g |\n`;
  out += `| Lentils (cooked) | ~9g |\n\n`;

  out += `> **Note:** These calculations use the Mifflin-St Jeor equation, the most validated BMR formula for the general population. Individual variation exists — adjust by ±100-200 kcal based on 2-week weight trends.\n`;

  out += FOOTER;
  return out;
}

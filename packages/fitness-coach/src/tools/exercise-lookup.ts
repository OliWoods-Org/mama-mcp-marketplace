import { z } from "zod";
import { EXERCISE_DB, FOOTER } from "../heuristics.js";

export const exerciseLookupSchema = {
  exercise_name: z.string()
    .describe("Name of the exercise to look up"),
  detail_level: z.enum(["quick", "full"]).optional()
    .describe("Level of detail: 'quick' for summary, 'full' for complete breakdown (default: full)"),
};

// Extended exercise information beyond the basic DB
interface ExerciseDetail {
  description: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  form_cues: string[];
  common_mistakes: string[];
  variations: string[];
  rep_ranges: Record<string, string>;
  safety_notes: string[];
}

const EXERCISE_DETAILS: Record<string, ExerciseDetail> = {
  "Barbell Bench Press": {
    description: "The barbell bench press is the king of upper-body pressing movements. Performed lying flat on a bench, it develops chest thickness, anterior deltoid strength, and tricep power.",
    primary_muscles: ["Pectoralis Major (Sternal)", "Pectoralis Major (Clavicular)"],
    secondary_muscles: ["Anterior Deltoid", "Triceps Brachii", "Serratus Anterior"],
    form_cues: [
      "Set up with eyes directly under the bar; grip slightly wider than shoulder-width",
      "Plant feet flat on the floor, retract and depress your scapulae into the bench",
      "Unrack with straight arms, lower the bar to mid-chest in a slight arc",
      "Flare elbows ~45-75 degrees — not fully tucked, not fully flared",
      "Touch the bar lightly to the sternum/lower chest, then press back and slightly toward the rack",
      "Maintain the arch in your lower back and keep your glutes on the bench throughout",
    ],
    common_mistakes: [
      "Bouncing the bar off the chest — removes tension and risks injury",
      "Allowing wrists to bend back — keep wrists stacked over the forearms",
      "Excessive elbow flare (90 degrees) — increases shoulder impingement risk",
      "Lifting the hips off the bench — reduces stability and force transfer",
      "Not retracting the scapulae — leads to shoulder pain over time",
    ],
    variations: [
      "Incline Bench Press (clavicular chest emphasis)",
      "Decline Bench Press (lower pec emphasis)",
      "Close-Grip Bench Press (tricep emphasis)",
      "Dumbbell Bench Press (increased range of motion)",
      "Pause Bench Press (removes stretch reflex, builds strength off the chest)",
      "Board Press (partial range, lockout strength)",
    ],
    rep_ranges: {
      strength:    "1-5 reps @ 85-95% 1RM with 3-5 min rest",
      hypertrophy: "6-12 reps @ 70-80% 1RM with 60-90s rest",
      endurance:   "15-20 reps @ 50-60% 1RM with 30-45s rest",
      fat_loss:    "10-15 reps, superset with a pull movement",
    },
    safety_notes: [
      "Always use a spotter or safety bars when training heavy",
      "Warm up with 2-3 progressively heavier sets (50%, 70%, 85% of working weight)",
      "If you experience shoulder pain, check your grip width and elbow angle",
      "Avoid maxing out without a spotter — unilateral failure (one arm gives out) is dangerous",
    ],
  },
  "Barbell Squat": {
    description: "The barbell back squat is the foundational lower-body compound movement. It simultaneously loads the quads, glutes, hamstrings, and spinal erectors, making it the most effective single exercise for lower-body development.",
    primary_muscles: ["Quadriceps", "Gluteus Maximus"],
    secondary_muscles: ["Hamstrings", "Adductors", "Spinal Erectors", "Core"],
    form_cues: [
      "Bar position: high-bar (traps) for Olympic style, low-bar (rear delts) for powerlifting",
      "Stance width slightly wider than hips, toes angled out 15-30 degrees",
      "Unrack, step back with two steps — don't walk out more than necessary",
      "Brace your core hard (360-degree pressure) before initiating the descent",
      "Break at hips and knees simultaneously, sitting 'between' your legs",
      "Descend until hip crease is below the top of the knee (parallel or below)",
      "Drive through the full foot, pushing the floor away — knees track over toes",
    ],
    common_mistakes: [
      "Knee cave (valgus collapse) — cue 'knees out' and strengthen glutes/adductors",
      "Forward lean of the torso — often caused by tight ankles or weak upper back",
      "Butt wink (posterior pelvic tilt at depth) — work on ankle mobility",
      "Half squats — partial depth greatly reduces muscle development",
      "Bar rolling up the neck — tighten upper back and keep elbows pointing down",
    ],
    variations: [
      "Front Squat (quad-dominant, upright torso)",
      "Goblet Squat (beginner-friendly, teaches squat mechanics)",
      "Bulgarian Split Squat (unilateral, great for muscle imbalances)",
      "Box Squat (teaches sitting back, partial ROM strength)",
      "Pause Squat (eliminates stretch reflex, builds bottom strength)",
      "Hack Squat (machine variation, knee-dominant)",
    ],
    rep_ranges: {
      strength:    "1-5 reps @ 85-95% 1RM, 3-5 min rest",
      hypertrophy: "6-12 reps @ 70-80% 1RM, 90-120s rest",
      endurance:   "15-20 reps bodyweight or light load, 30-45s rest",
      fat_loss:    "10-15 reps, circuit with upper-body push/pull",
    },
    safety_notes: [
      "Learn the movement with goblet squats or box squats before loading heavily",
      "Use a power rack with safety bars set just below depth",
      "If your lower back rounds, you're likely squatting beyond your mobility — work on flexibility",
      "Wear flat-soled shoes or weightlifting shoes (raised heel improves depth for most)",
    ],
  },
  "Deadlift": {
    description: "The conventional deadlift is the ultimate posterior chain exercise. It develops absolute strength through the entire back, glutes, hamstrings, and traps. No other single lift loads the body with as much total weight.",
    primary_muscles: ["Spinal Erectors", "Gluteus Maximus", "Hamstrings"],
    secondary_muscles: ["Traps", "Lats", "Quadriceps", "Forearms", "Core"],
    form_cues: [
      "Stand with mid-foot under the bar (about 1 inch from your shins)",
      "Hip-width stance, toes slightly out — grip just outside the legs",
      "Hinge at hips to grip; before lifting, push hips down until shins touch the bar",
      "Take a big breath, brace core hard (like taking a punch) — this is your Valsalva",
      "'Lat spread' — think about protecting your armpits, this stabilises the spine",
      "Initiate by pushing the floor away (leg press), not by pulling up with your back",
      "Bar should drag up your shins and thighs — it should stay as close to your body as possible",
      "Lock out by squeezing glutes hard at the top, don't hyperextend",
    ],
    common_mistakes: [
      "Jerking the bar — results in losing tension and injuring the lower back",
      "Bar drifting away from the body — dramatically increases spinal loading",
      "Rounding the lower back (lumbar flexion under load) — herniation risk",
      "Looking straight up — strains the cervical spine; maintain neutral neck",
      "Hips shooting up first (turning it into a stiff-leg deadlift)",
    ],
    variations: [
      "Romanian Deadlift (hamstring-dominant, hip hinge pattern)",
      "Sumo Deadlift (wider stance, more quad/glute focus)",
      "Trap Bar Deadlift (more upright torso, beginner-friendly)",
      "Stiff-Leg Deadlift (maximum hamstring stretch)",
      "Single-Leg Romanian Deadlift (unilateral balance and stability)",
      "Deficit Deadlift (increased range of motion, builds strength off the floor)",
    ],
    rep_ranges: {
      strength:    "1-5 reps @ 85-95% 1RM, 3-5 min rest",
      hypertrophy: "4-8 reps @ 75-85% 1RM, 2-3 min rest",
      endurance:   "Not recommended at high reps — use Romanian DL instead",
      fat_loss:    "5-8 reps, focus on progressive overload rather than conditioning",
    },
    safety_notes: [
      "Master the hip hinge pattern with a broomstick or Romanian DL before loading",
      "Use a belt at higher percentages (>80% 1RM) to support intra-abdominal pressure",
      "Mixed grip or straps prevent grip being the limiting factor; use chalk if available",
      "If your lower back is fatigued, stop — never train through spinal fatigue",
      "Start light. The deadlift's injury risk comes from ego-loading, not the movement itself",
    ],
  },
  "Pull-Up": {
    description: "The pull-up is the definitive upper-body pulling exercise. Performed with a pronated (overhand) grip, it develops the lats, biceps, rear delts, and scapular stabilisers while also requiring significant core engagement.",
    primary_muscles: ["Latissimus Dorsi", "Teres Major"],
    secondary_muscles: ["Biceps Brachii", "Rear Deltoid", "Rhomboids", "Core"],
    form_cues: [
      "Grip the bar slightly wider than shoulder-width with a pronated (palms-away) grip",
      "Dead hang to start — fully extend arms and let scapulae elevate naturally",
      "Initiate by depressing and retracting the scapulae — 'put your shoulder blades in your back pockets'",
      "Pull your elbows to your sides and down, thinking about driving your elbows toward your hips",
      "Chin clears the bar — full rep means chin is above the bar, not just eyes",
      "Lower under control — 2-3 second descent, return to full dead hang",
    ],
    common_mistakes: [
      "Kipping or swinging — removes lat engagement and increases injury risk",
      "Not reaching full range of motion (half reps) — reduces muscle development",
      "Shrugging (shoulder elevation) instead of depressing the scapulae",
      "Looking straight down — maintain a slight chin tuck for neutral spine",
      "Using too much bicep — focus on driving elbows down, not curling the bar",
    ],
    variations: [
      "Chin-Up (supinated/underhand grip — more bicep involvement)",
      "Neutral-Grip Pull-Up (easiest shoulder position for beginners)",
      "Weighted Pull-Up (add plates/vest for progressive overload)",
      "Assisted Pull-Up (band or machine for developing beginners)",
      "Negative Pull-Up (jump to top position, lower slowly — builds strength)",
      "L-Sit Pull-Up (legs parallel to floor — intense core challenge)",
    ],
    rep_ranges: {
      strength:    "3-6 reps (weighted if needed), 3-4 sets, 3 min rest",
      hypertrophy: "6-12 reps, 3-4 sets, 60-90s rest",
      endurance:   "Max reps AMRAP, multiple sets, 45-60s rest",
      fat_loss:    "AMRAP sets in circuit, paired with pushing movement",
    },
    safety_notes: [
      "Work with a resistance band to build up if you cannot perform bodyweight pull-ups",
      "Avoid kipping until you have solid strength base — it places sudden load on shoulder capsule",
      "If you experience elbow pain, check your grip width and try a neutral grip",
      "Shoulder impingement sufferers should approach with caution and consult a physio",
    ],
  },
  "Overhead Press": {
    description: "The standing barbell overhead press (OHP) is the primary vertical pushing movement. It develops the deltoids, triceps, and upper chest while requiring significant core stability and whole-body tension.",
    primary_muscles: ["Anterior Deltoid", "Medial Deltoid"],
    secondary_muscles: ["Triceps Brachii", "Upper Pectoralis", "Serratus Anterior", "Core", "Traps"],
    form_cues: [
      "Grip slightly wider than shoulder-width; bar rests on the front deltoids/upper chest",
      "Elbows slightly in front of the bar (not directly under), wrists stacked",
      "Take a big breath and brace — tight core is essential to protect the lower back",
      "Press the bar straight up, slightly back — your head moves out of the way briefly then back in",
      "Lock out fully overhead with shrugged traps — don't stop short of full extension",
      "Lower under control to the starting position — don't crash the bar onto your delts",
    ],
    common_mistakes: [
      "Excessive lower back arch (lumbar hyperextension) — brace harder and reduce the weight",
      "Bar path drifting forward — should be straight vertical or very slightly back",
      "Not locking out overhead — partial range limits shoulder strength development",
      "Pressing with the grip too wide — reduces tricep involvement and shoulder stability",
      "Pushing hips forward (hip thrust) to initiate the press — this is the push press, not strict OHP",
    ],
    variations: [
      "Seated Dumbbell Press (reduced core demand, great isolation)",
      "Arnold Press (full rotation — hits all deltoid heads)",
      "Push Press (use leg drive — allows heavier loads)",
      "Landmine Press (shoulder-friendly arc, great for beginners)",
      "Z-Press (seated on floor — eliminates leg drive completely)",
      "Cable Overhead Press (constant tension throughout the movement)",
    ],
    rep_ranges: {
      strength:    "3-6 reps @ 80-90% 1RM, 3-5 min rest",
      hypertrophy: "8-12 reps @ 65-75% 1RM, 60-90s rest",
      endurance:   "15-20 reps light weight, 30-45s rest",
      fat_loss:    "10-15 reps, superset with a row",
    },
    safety_notes: [
      "Start light — the OHP has the steepest learning curve of the main lifts",
      "Avoid behind-the-neck pressing — places the shoulder capsule in a compromised position",
      "If wrists hurt, try a false grip (thumbless) or wrist wraps",
      "Seated variations are safer for individuals with lower-back issues",
    ],
  },
  "Romanian Deadlift": {
    description: "The Romanian deadlift (RDL) is the most effective exercise for hamstring and glute development. It trains the hip hinge movement with emphasis on the eccentric (lengthening) phase of the hamstrings.",
    primary_muscles: ["Hamstrings", "Gluteus Maximus"],
    secondary_muscles: ["Spinal Erectors", "Adductors", "Traps (grip)"],
    form_cues: [
      "Start standing with the bar at hip height (rack or off floor); feet hip-width, slight knee bend",
      "Maintain the slight knee bend throughout — this is NOT a stiff-leg deadlift",
      "Hinge at the hips by pushing them backward — think 'hip hinge, not knee bend'",
      "Bar stays close to the body, dragging down the thighs",
      "Lower until you feel a strong hamstring stretch — typically mid-shin for most people",
      "Squeeze glutes and drive hips forward to return to standing — don't hyperextend",
    ],
    common_mistakes: [
      "Rounding the lower back — keep a neutral spine and stop at your hamstring flexibility limit",
      "Bending the knees too much — turns it into a regular deadlift",
      "Bar drifting away from the body — maintains leverage, reduces hamstring stress",
      "Going too deep and losing spinal neutrality — mobility limits should be respected",
      "Not fully locking out at the top — short-changes glute activation",
    ],
    variations: [
      "Dumbbell Romanian Deadlift (beginner-friendly, allows natural arm path)",
      "Single-Leg Romanian Deadlift (unilateral, challenges balance and core)",
      "Banded Romanian Deadlift (accommodating resistance at the top)",
      "Deficit Romanian Deadlift (standing on a plate, increased range of motion)",
    ],
    rep_ranges: {
      strength:    "4-6 reps heavy, 3 sets, 3 min rest",
      hypertrophy: "8-12 reps, 3-4 sets, 90s rest — focus on the stretch",
      endurance:   "12-15 reps, moderate weight, 45-60s rest",
      fat_loss:    "10-15 reps, pair with leg press or walking lunges",
    },
    safety_notes: [
      "Never sacrifice lower back position for depth — go only as low as your flexibility allows",
      "Warm up the hamstrings with leg swings and light sets before working weight",
      "If you have a herniated disc, consult a physio before performing this movement",
      "Beginners: start with the dumbbell variation to learn the hip hinge pattern",
    ],
  },
};

// Generic detail generator for exercises not in the detailed DB
function generateGenericDetail(name: string, ex: typeof EXERCISE_DB[number] | undefined): ExerciseDetail {
  const muscleGroup = ex?.muscle_group ?? "Multiple muscles";
  const exType = ex?.type ?? "compound";

  return {
    description: `${name} is a ${exType} exercise primarily targeting the ${muscleGroup}. It is a staple movement for developing strength and muscle in the ${muscleGroup.toLowerCase()} region.`,
    primary_muscles: [muscleGroup],
    secondary_muscles: exType === "compound" ? ["Core (stabiliser)", "Synergistic muscle groups"] : ["Stabilising muscles"],
    form_cues: [
      "Set up in a stable, balanced position before initiating the movement",
      "Brace your core throughout the entire range of motion",
      "Control the eccentric (lowering) phase — 2-3 seconds down",
      "Drive through the concentric (lifting) phase with intention",
      "Maintain joint alignment — avoid compensatory movements",
      "Full range of motion unless you have a specific injury restriction",
    ],
    common_mistakes: [
      "Using momentum rather than muscle control",
      "Partial range of motion — reduces muscle development",
      "Holding breath — breathe out on exertion, in on the way back",
      "Ego loading — using too much weight at the expense of form",
    ],
    variations: [
      `Dumbbell variation of ${name}`,
      `Unilateral (single-limb) variation`,
      `Machine-assisted variation for beginners`,
      `Weighted variation for advanced progression`,
    ],
    rep_ranges: {
      strength:    "3-5 reps, heavy weight, 3-5 min rest",
      hypertrophy: "8-12 reps, moderate weight, 60-90s rest",
      endurance:   "15-20 reps, light weight, 30-45s rest",
      fat_loss:    "10-15 reps, circuit-style with minimal rest",
    },
    safety_notes: [
      "Learn the movement with light weight before progressively loading",
      "Stop if you experience sharp or joint pain — distinguish between muscle burn and injury pain",
      "Warm up the target muscle group before working sets",
    ],
  };
}

export function exerciseLookup(params: {
  exercise_name: string;
  detail_level?: string;
}): string {
  const { exercise_name, detail_level = "full" } = params;

  // Find in DB (case-insensitive)
  const dbEntry = EXERCISE_DB.find(
    (ex) => ex.name.toLowerCase() === exercise_name.toLowerCase()
  );

  // Get detailed info or generate generic
  const detail: ExerciseDetail =
    EXERCISE_DETAILS[exercise_name] ??
    (dbEntry ? EXERCISE_DETAILS[dbEntry.name] : undefined) ??
    generateGenericDetail(exercise_name, dbEntry);

  const displayName = dbEntry?.name ?? exercise_name;
  const muscleGroup = dbEntry?.muscle_group ?? "Various";
  const equipment = dbEntry?.equipment ?? "Various";
  const difficulty = dbEntry?.difficulty ?? "intermediate";
  const exType = dbEntry?.type ?? "compound";

  const difficultyStars =
    difficulty === "beginner" ? "⭐" :
    difficulty === "intermediate" ? "⭐⭐" : "⭐⭐⭐";

  let out = `## 🏋️ Exercise: ${displayName}\n\n`;
  out += `| Attribute | Value |\n`;
  out += `|-----------|-------|\n`;
  out += `| **Muscle Group** | ${muscleGroup} |\n`;
  out += `| **Type** | ${exType.charAt(0).toUpperCase() + exType.slice(1)} |\n`;
  out += `| **Equipment** | ${equipment.charAt(0).toUpperCase() + equipment.slice(1)} |\n`;
  out += `| **Difficulty** | ${difficultyStars} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} |\n\n`;

  out += `### Overview\n\n${detail.description}\n\n`;

  out += `### Target Muscles\n\n`;
  out += `**Primary:** ${detail.primary_muscles.join(", ")}\n\n`;
  out += `**Secondary:** ${detail.secondary_muscles.join(", ")}\n\n`;

  if (detail_level === "full") {
    out += `### Proper Form — Step by Step\n\n`;
    detail.form_cues.forEach((cue, i) => {
      out += `${i + 1}. ${cue}\n`;
    });

    out += `\n### Common Mistakes to Avoid\n\n`;
    detail.common_mistakes.forEach((mistake) => {
      out += `- ⚠️ ${mistake}\n`;
    });

    out += `\n### Variations\n\n`;
    detail.variations.forEach((v) => {
      out += `- ${v}\n`;
    });

    out += `\n### Rep Ranges by Goal\n\n`;
    out += `| Goal | Prescription |\n`;
    out += `|------|--------------|\n`;
    out += `| **Strength** | ${detail.rep_ranges.strength} |\n`;
    out += `| **Hypertrophy** | ${detail.rep_ranges.hypertrophy} |\n`;
    out += `| **Endurance** | ${detail.rep_ranges.endurance} |\n`;
    out += `| **Fat Loss** | ${detail.rep_ranges.fat_loss} |\n\n`;

    out += `### Safety Notes\n\n`;
    detail.safety_notes.forEach((note) => {
      out += `- 🛡️ ${note}\n`;
    });
  } else {
    // Quick mode
    out += `### Form Summary\n\n`;
    detail.form_cues.slice(0, 3).forEach((cue, i) => {
      out += `${i + 1}. ${cue}\n`;
    });
    out += `\n**Top Rep Range (hypertrophy):** ${detail.rep_ranges.hypertrophy}\n`;
    out += `\n**Watch out for:** ${detail.common_mistakes[0]}\n`;
  }

  out += FOOTER;
  return out;
}

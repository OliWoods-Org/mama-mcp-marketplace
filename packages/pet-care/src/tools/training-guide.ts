import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const TrainingGuideInput = z.object({
  pet_type: z.enum(["dog", "cat"]).describe("Type of pet"),
  age_years: z.number().min(0).max(20).describe("Pet age in years"),
  behavior_issue: z.enum([
    "leash_pulling",
    "barking",
    "separation_anxiety",
    "potty_training",
    "jumping_on_people",
    "aggression",
    "scratching_furniture",
    "litter_box_avoidance",
  ]).describe("Specific behavior to address"),
});

type Step = { week: string; goal: string; exercises: string[]; duration_per_session: string };

const TRAINING_PLANS: Record<string, Step[]> = {
  leash_pulling: [
    {
      week: "Week 1",
      goal: "Teach 'heel' position and loose-leash awareness",
      exercises: [
        "Stand still the moment pulling starts — forward motion only rewards a loose leash.",
        "Practice 'heel' in low-distraction environment (hallway, backyard) for 5 min.",
        "Reward with high-value treats every 3–5 steps of loose-leash walking.",
      ],
      duration_per_session: "10 minutes, 2× daily",
    },
    {
      week: "Week 2",
      goal: "Reinforce loose-leash on sidewalk with mild distractions",
      exercises: [
        "Add a verbal cue ('let's go') each time you start walking.",
        "Practice direction changes — pivot and go the opposite way when tension builds.",
        "Increase treat distance: reward every 10–15 steps.",
      ],
      duration_per_session: "15 minutes, 2× daily",
    },
    {
      week: "Week 3–4",
      goal: "Generalize to parks and busier streets",
      exercises: [
        "Use a front-clip harness to physically reduce pulling while training progresses.",
        "Practice 'watch me' to redirect attention before reactive triggers.",
        "Gradually fade treat frequency to every 20–30 steps.",
      ],
      duration_per_session: "20 minutes, 1–2× daily",
    },
  ],
  barking: [
    {
      week: "Week 1",
      goal: "Identify triggers and teach 'quiet' cue",
      exercises: [
        "Log what triggers barking — doorbell, strangers, boredom, fear — to target the right approach.",
        "When barking starts, calmly say 'quiet' once; wait for a 2-second pause; reward immediately.",
        "Avoid yelling — this escalates arousal. Stay calm and neutral.",
      ],
      duration_per_session: "Short, event-driven practice",
    },
    {
      week: "Week 2",
      goal: "Desensitize to primary trigger",
      exercises: [
        "Play recordings of trigger sounds at low volume; reward calm behaviour.",
        "Gradually increase volume over several days.",
        "Pair the trigger with something positive (treat scatter, favourite toy).",
      ],
      duration_per_session: "5–10 minutes, 2× daily",
    },
    {
      week: "Week 3–4",
      goal: "Increase quiet duration and reduce treat dependency",
      exercises: [
        "Extend required quiet before rewarding from 2 sec → 5 sec → 10 sec.",
        "Practice in real-life trigger situations (visitor at door, walking past dogs).",
        "Introduce a 'place' or 'mat' cue as an incompatible behaviour during doorbell triggers.",
      ],
      duration_per_session: "10 minutes, 2× daily + real-world practice",
    },
  ],
  separation_anxiety: [
    {
      week: "Week 1",
      goal: "Build tolerance for brief departures (under 30 seconds)",
      exercises: [
        "Practice absences of only 5–10 seconds; return before anxiety peaks.",
        "Keep arrivals and departures completely calm — no emotional hellos/goodbyes.",
        "Establish a pre-departure cue (pick up keys) without leaving — desensitise the ritual.",
      ],
      duration_per_session: "Multiple short sessions daily",
    },
    {
      week: "Week 2",
      goal: "Extend absences to 5 minutes",
      exercises: [
        "Slowly increase duration: 30 sec → 1 min → 2 min → 5 min.",
        "Provide a food puzzle or frozen Kong before leaving.",
        "Set up a video camera to monitor actual anxiety level while away.",
      ],
      duration_per_session: "5–10 minute sessions, 3–4× daily",
    },
    {
      week: "Week 3–6",
      goal: "Build to 30–60 minute absences",
      exercises: [
        "Continue gradual increments; never push past where anxiety appears.",
        "Establish a safe 'den' space (crate or room) with familiar scent items.",
        "Consider DAP/Feliway pheromone diffuser for additional support.",
        "Consult a vet if progress stalls — medication may support behaviour modification.",
      ],
      duration_per_session: "Daily practice; real-world absences as tolerance builds",
    },
  ],
  potty_training: [
    {
      week: "Week 1",
      goal: "Establish consistent outdoor/litter routine",
      exercises: [
        "Take dog outside every 2 hours, after meals, after naps, after play — no exceptions.",
        "Go to the same spot each time — scent markers reinforce the location.",
        "Reward within 3 seconds of toileting in the right place; verbal praise + treat.",
      ],
      duration_per_session: "Continuous supervision + scheduled outings",
    },
    {
      week: "Week 2",
      goal: "Extend accident-free windows",
      exercises: [
        "Use confinement (crate, playpen) when unsupervised — dogs avoid soiling their sleeping area.",
        "Watch for pre-toilet signals (sniffing floor, circling, squatting) and interrupt calmly.",
        "Never punish accidents — clean thoroughly with enzyme cleaner to remove scent.",
      ],
      duration_per_session: "Continuous management",
    },
    {
      week: "Week 3–4",
      goal: "Reduce frequency of scheduled trips; build to pet-initiated signals",
      exercises: [
        "Start introducing a bell by the door — ring it before each outing; eventually pet will ring it.",
        "Gradually extend intervals between trips as reliability improves.",
        "Continue rewarding every successful outdoor toilet until 4 weeks accident-free.",
      ],
      duration_per_session: "Ongoing; gradually less intensive",
    },
  ],
  jumping_on_people: [
    {
      week: "Week 1",
      goal: "Remove reward for jumping; teach 'four paws on floor'",
      exercises: [
        "Turn your back completely when dog jumps — no eye contact, no talking, no touch.",
        "The moment four paws land: immediately turn, kneel, and reward enthusiastically.",
        "Ask all household members and visitors to apply the same rule consistently.",
      ],
      duration_per_session: "Every greeting interaction",
    },
    {
      week: "Week 2–3",
      goal: "Teach an incompatible greeting behaviour (sit)",
      exercises: [
        "Before entering, ask for a 'sit'; only give attention when sitting.",
        "Practice staged entrances — leave and re-enter repeatedly to reinforce the pattern.",
        "Reward lavishly for calm greetings with strangers on walks.",
      ],
      duration_per_session: "Every greeting interaction",
    },
  ],
  aggression: [
    {
      week: "Week 1",
      goal: "Safety management and trigger mapping",
      exercises: [
        "DO NOT attempt to punish or 'dominate' aggressive behaviour — this escalates risk.",
        "Identify the exact trigger: resource guarding, fear, pain, territorial, redirected?",
        "Prevent access to trigger situations while a behaviour modification plan is developed.",
        "Consult a Certified Applied Animal Behaviourist (CAAB) or veterinary behaviourist immediately.",
      ],
      duration_per_session: "Management + professional consultation",
    },
    {
      week: "Week 2–8",
      goal: "Counter-conditioning and desensitisation under professional guidance",
      exercises: [
        "Work below threshold — expose at a distance where no aggression occurs; reward calm.",
        "Gradually decrease distance as dog remains relaxed (systematic desensitisation).",
        "Use basket muzzle training as a safety measure during all exposure work.",
        "Consider veterinary assessment — pain, thyroid, and neurological causes should be ruled out.",
      ],
      duration_per_session: "Short, positive sessions; frequency per behaviourist plan",
    },
  ],
  scratching_furniture: [
    {
      week: "Week 1",
      goal: "Redirect to appropriate scratching surfaces",
      exercises: [
        "Place a tall, stable scratching post directly beside the targeted furniture.",
        "Rub catnip or use a pheromone spray (Feliscratch) on the post to attract interest.",
        "Use double-sided tape on furniture surfaces to deter use temporarily.",
      ],
      duration_per_session: "Environmental management + brief play sessions",
    },
    {
      week: "Week 2–3",
      goal: "Reinforce scratching post use; protect furniture",
      exercises: [
        "Reward with treats and praise any interaction with the scratching post.",
        "Trim nails every 2–3 weeks to reduce damage potential.",
        "Provide both horizontal and vertical scratching surfaces — some cats prefer one type.",
        "Gradually move the post away from furniture once the post is being used reliably.",
      ],
      duration_per_session: "Ongoing environmental management",
    },
  ],
  litter_box_avoidance: [
    {
      week: "Week 1",
      goal: "Rule out medical cause; audit litter box setup",
      exercises: [
        "Vet visit first — UTI, bladder stones, and constipation are common medical causes.",
        "Rule of thumb: one litter box per cat plus one extra (e.g., 2 cats = 3 boxes).",
        "Ensure boxes are in quiet, low-traffic areas away from food and water.",
      ],
      duration_per_session: "Environmental audit + vet consultation",
    },
    {
      week: "Week 2–3",
      goal: "Optimise litter type and box cleanliness",
      exercises: [
        "Scoop at least once daily — cats are highly sensitive to odour.",
        "Test unscented clumping litter if scented or non-clumping is currently in use.",
        "Try an uncovered box if using a hooded one; some cats feel trapped.",
        "Thoroughly clean soiled areas with enzyme cleaner to eliminate residual scent markers.",
      ],
      duration_per_session: "Ongoing management",
    },
  ],
};

const COMMON_MISTAKES: Record<string, string[]> = {
  leash_pulling: [
    "Continuing to walk while the leash is taut — this rewards pulling.",
    "Using retractable leashes during training.",
    "Inconsistent rules between family members.",
  ],
  barking: [
    "Yelling 'quiet' loudly — this sounds like joining in.",
    "Giving attention (even negative) when the dog barks.",
    "Expecting instant results — desensitisation takes weeks.",
  ],
  separation_anxiety: [
    "Increasing absence duration too quickly.",
    "Emotional, drawn-out departures.",
    "Punishing the dog upon return for destructive behaviour.",
  ],
  potty_training: [
    "Punishing accidents after the fact — the dog cannot connect the punishment to the act.",
    "Inconsistent schedule or supervision gaps.",
    "Using ammonia-based cleaners (smells like urine to dogs).",
  ],
  jumping_on_people: [
    "Inconsistency — some people allow jumping and others don't.",
    "Kneeing the dog — this can cause injury and escalate the behaviour.",
    "Saying 'down' (which means lie down) instead of 'off'.",
  ],
  aggression: [
    "Alpha rolling or physical punishment — this significantly increases bite risk.",
    "Flooding (forcing the pet to face the trigger) without counter-conditioning.",
    "Delaying professional help.",
  ],
  scratching_furniture: [
    "Declawing — this is painful and leads to serious behavioural and health issues.",
    "Punishing scratching without providing an alternative.",
    "Placing scratching posts in out-of-the-way rooms instead of near preferred spots.",
  ],
  litter_box_avoidance: [
    "Skipping the vet visit — the majority of cases have a medical component.",
    "Placing boxes next to the food bowl.",
    "Using strongly scented litter or liners (cats dislike both).",
  ],
};

export function trainingGuide(input: z.infer<typeof TrainingGuideInput>): string {
  const key = normKey(input.pet_type + input.behavior_issue);
  const plan = TRAINING_PLANS[input.behavior_issue] ?? TRAINING_PLANS["leash_pulling"];
  const mistakes = COMMON_MISTAKES[input.behavior_issue] ?? [];

  const ageContext =
    input.age_years < 0.5
      ? "Puppy/kitten (under 6 months) — short attention spans; keep sessions under 3 minutes; socialisation window is critical."
      : input.age_years < 2
      ? "Adolescent — high energy, hormone-driven behaviours are common; consistency is essential."
      : input.age_years < 8
      ? "Adult — fully capable of learning new behaviours; may take longer to break existing habits."
      : "Senior — cognitive abilities intact but physical limitations may apply; adjust pace accordingly.";

  const reinforcers = seededPick(key, "reinf", [
    ["small soft treats (chicken, turkey)", "verbal praise + petting", "brief play with favourite toy"],
    ["freeze-dried liver treats", "enthusiastic verbal marker ('yes!')", "tug game as reward"],
    ["kibble from meal allocation", "clicker + treat", "fetch + praise"],
  ]);

  const result = {
    pet_type: input.pet_type,
    age_context: ageContext,
    behavior_issue: input.behavior_issue,
    training_approach: "Positive reinforcement only — punishment-based methods are contraindicated",
    recommended_reinforcers: reinforcers,
    training_plan: plan,
    total_timeline: `${plan.length <= 2 ? "2–3 weeks" : plan.length <= 3 ? "4 weeks" : "6–8 weeks"} (individual results vary)`,
    common_mistakes_to_avoid: mistakes,
    pro_tip: seededPick(key, "tip", [
      "End every session on a success — even if you have to make the last task easy.",
      "Five 3-minute sessions beat one 15-minute session for most pets.",
      "Train before meals when motivation is highest.",
      "Capture — reward behaviours you want more of whenever they happen naturally.",
    ]),
    when_to_seek_help:
      "If the behaviour poses a safety risk, involves aggression, or shows no improvement after 4–6 weeks of consistent effort, consult a Certified Professional Dog Trainer (CPDT-KA) or Certified Applied Animal Behaviourist (CAAB).",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

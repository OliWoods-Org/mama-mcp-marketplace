import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { workoutGeneratorSchema, workoutGenerator } from "./tools/workout-generator.js";
import { macroCalculatorSchema, macroCalculator } from "./tools/macro-calculator.js";
import { exerciseLookupSchema, exerciseLookup } from "./tools/exercise-lookup.js";
import { bodyCompTrackerSchema, bodyCompTracker } from "./tools/body-comp-tracker.js";
import { progressiveOverloadSchema, progressiveOverload } from "./tools/progressive-overload.js";

const server = new McpServer({
  name: "fitness-coach",
  version: "1.0.0",
  description: "AI personal fitness coach — workout generation, macro calculation, exercise library, body composition tracking, and progressive overload planning",
});

// ── Tool: Workout Generator ──────────────────────────────────────────────────

server.tool(
  "workout_generator",
  "Generate a full weekly workout plan with exercises, sets, reps, rest periods, and coaching notes. Tailored by goal, fitness level, days per week, and available equipment.",
  workoutGeneratorSchema,
  async (params) => ({
    content: [{ type: "text", text: workoutGenerator(params) }],
  })
);

// ── Tool: Macro Calculator ───────────────────────────────────────────────────

server.tool(
  "macro_calculator",
  "Calculate personalised daily calorie and macro targets using the Mifflin-St Jeor BMR formula. Includes TDEE, goal-adjusted calories, macro splits in grams and percentages, meal timing recommendations, and a sample per-meal breakdown.",
  macroCalculatorSchema,
  async (params) => ({
    content: [{ type: "text", text: macroCalculator(params) }],
  })
);

// ── Tool: Exercise Lookup ────────────────────────────────────────────────────

server.tool(
  "exercise_lookup",
  "Look up detailed information about any exercise — target muscles (primary/secondary), step-by-step form cues, common mistakes, variations, rep ranges for different goals, and safety notes.",
  exerciseLookupSchema,
  async (params) => ({
    content: [{ type: "text", text: exerciseLookup(params) }],
  })
);

// ── Tool: Body Composition Tracker ──────────────────────────────────────────

server.tool(
  "body_comp_tracker",
  "Analyse current body composition (lean mass vs fat mass), set goals, and get realistic projections at 4, 8, and 12 weeks. Includes weekly targets, caloric adjustments, and actionable recommendations for cutting, bulking, or recomping.",
  bodyCompTrackerSchema,
  async (params) => ({
    content: [{ type: "text", text: bodyCompTracker(params) }],
  })
);

// ── Tool: Progressive Overload ───────────────────────────────────────────────

server.tool(
  "progressive_overload",
  "Generate a week-by-week progressive overload plan for any exercise. Includes weight, sets, and reps for each week, scheduled deload weeks, estimated 1RM progression, and guidance on when to adjust. Formatted as a markdown table.",
  progressiveOverloadSchema,
  async (params) => ({
    content: [{ type: "text", text: progressiveOverload(params) }],
  })
);

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

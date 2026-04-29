#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { SymptomCheckerInput, symptomChecker } from "./tools/symptom-checker.js";
import { BreedInfoInput, breedInfo } from "./tools/breed-info.js";
import { TrainingGuideInput, trainingGuide } from "./tools/training-guide.js";
import { NutritionPlannerInput, nutritionPlanner } from "./tools/nutrition-planner.js";
import { InsuranceCompareInput, insuranceCompare } from "./tools/insurance-compare.js";

const server = new McpServer({
  name: "oliwoods-pet-care",
  version: "1.0.0",
});

// ── 1. symptom_checker ────────────────────────────────────────────────────────
server.tool(
  "symptom_checker",
  "Check your pet's symptoms against possible conditions ranked by likelihood. Returns urgency level (emergency / vet visit / monitor at home), first aid steps, and when to seek emergency care. Supports dogs and cats.",
  SymptomCheckerInput.shape,
  async (args) => ({
    content: [{ type: "text", text: symptomChecker(args as z.infer<typeof SymptomCheckerInput>) }],
  })
);

// ── 2. breed_info ─────────────────────────────────────────────────────────────
server.tool(
  "breed_info",
  "Get a complete breed profile (temperament, exercise needs, grooming, common health issues, lifespan, ideal living situation) for any dog or cat breed. Or search by traits (size, energy level, good with kids) to get breed recommendations.",
  BreedInfoInput.shape,
  async (args) => ({
    content: [{ type: "text", text: breedInfo(args as z.infer<typeof BreedInfoInput>) }],
  })
);

// ── 3. training_guide ─────────────────────────────────────────────────────────
server.tool(
  "training_guide",
  "Get a step-by-step positive reinforcement training plan for specific behaviour issues — leash pulling, barking, separation anxiety, potty training, jumping, aggression, scratching, or litter box avoidance. Includes week-by-week schedule, common mistakes, and when to call a professional.",
  TrainingGuideInput.shape,
  async (args) => ({
    content: [{ type: "text", text: trainingGuide(args as z.infer<typeof TrainingGuideInput>) }],
  })
);

// ── 4. nutrition_planner ──────────────────────────────────────────────────────
server.tool(
  "nutrition_planner",
  "Calculate your pet's daily calorie needs and get a personalised nutrition plan including recommended food types, feeding schedule, macronutrient targets, foods to avoid, and supplement suggestions. Accounts for breed, age, weight, activity level, and allergies.",
  NutritionPlannerInput.shape,
  async (args) => ({
    content: [{ type: "text", text: nutritionPlanner(args as z.infer<typeof NutritionPlannerInput>) }],
  })
);

// ── 5. insurance_compare ──────────────────────────────────────────────────────
server.tool(
  "insurance_compare",
  "Compare pet insurance options for your dog or cat. Returns estimated monthly premiums for accident-only vs comprehensive coverage, common exclusions, pre-existing condition rules, top provider recommendations, and the recommended coverage level for your pet.",
  InsuranceCompareInput.shape,
  async (args) => ({
    content: [{ type: "text", text: insuranceCompare(args as z.infer<typeof InsuranceCompareInput>) }],
  })
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OliWoods Pet Care MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

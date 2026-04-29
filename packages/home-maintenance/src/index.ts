#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { SeasonalChecklistInput, seasonalChecklist } from "./tools/seasonal-checklist.js";
import { RepairEstimatorInput, repairEstimator } from "./tools/repair-estimator.js";
import { EnergyAuditInput, energyAudit } from "./tools/energy-audit.js";
import { ContractorQuestionsInput, contractorQuestions } from "./tools/contractor-questions.js";
import { HomeValueImpactInput, homeValueImpact } from "./tools/home-value-impact.js";

const server = new McpServer({
  name: "oliwoods-home-maintenance",
  version: "1.0.0",
});

// ── 1. seasonal_checklist ─────────────────────────────────────────────────────
server.tool(
  "seasonal_checklist",
  "Get a prioritised home maintenance checklist for any season. Returns tasks with estimated time, cost, and DIY vs. pro recommendations tailored to your home type (house/condo/apartment) and climate zone.",
  SeasonalChecklistInput.shape,
  async (args) => ({
    content: [{ type: "text", text: seasonalChecklist(args as z.infer<typeof SeasonalChecklistInput>) }],
  })
);

// ── 2. repair_estimator ───────────────────────────────────────────────────────
server.tool(
  "repair_estimator",
  "Estimate repair costs for roof, plumbing, HVAC, electrical, foundation, and appliance issues. Returns DIY vs. professional cost ranges, typical timeline, key questions to ask contractors, and red flags to watch for in quotes.",
  RepairEstimatorInput.shape,
  async (args) => ({
    content: [{ type: "text", text: repairEstimator(args as z.infer<typeof RepairEstimatorInput>) }],
  })
);

// ── 3. energy_audit ───────────────────────────────────────────────────────────
server.tool(
  "energy_audit",
  "Perform a home energy efficiency audit. Returns an efficiency score, the top 5 improvements ranked by ROI, estimated annual savings per improvement, and available federal tax credits and utility rebates.",
  EnergyAuditInput.shape,
  async (args) => ({
    content: [{ type: "text", text: energyAudit(args as z.infer<typeof EnergyAuditInput>) }],
  })
);

// ── 4. contractor_questions ───────────────────────────────────────────────────
server.tool(
  "contractor_questions",
  "Get the 10 essential questions to ask before hiring a contractor for any home project. Includes licence and insurance requirements by trade, how to verify credentials, red flags in quotes, and what must be in every contract.",
  ContractorQuestionsInput.shape,
  async (args) => ({
    content: [{ type: "text", text: contractorQuestions(args as z.infer<typeof ContractorQuestionsInput>) }],
  })
);

// ── 5. home_value_impact ──────────────────────────────────────────────────────
server.tool(
  "home_value_impact",
  "Analyse the resale value impact of home improvements including kitchen remodel, bathroom update, new roof, landscaping, pool, deck, finished basement, and more. Returns national average ROI, how appraisers count it, best and worst ROI scenarios, and a splurge-vs-save guide.",
  HomeValueImpactInput.shape,
  async (args) => ({
    content: [{ type: "text", text: homeValueImpact(args as z.infer<typeof HomeValueImpactInput>) }],
  })
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OliWoods Home Maintenance MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { VisaEligibilityInput, visaEligibility } from "./tools/visa-eligibility.js";
import { GreenCardTimelineInput, greenCardTimeline } from "./tools/green-card-timeline.js";
import { DocumentChecklistInput, documentChecklist } from "./tools/document-checklist.js";
import { FeeCalculatorInput, feeCalculator } from "./tools/fee-calculator.js";
import { StatusExplainerInput, statusExplainer } from "./tools/status-explainer.js";

const server = new McpServer({
  name: "oliwoods-immigration-helper",
  version: "1.0.0",
});

// ── 1. visa_eligibility ───────────────────────────────────────────────────────
server.tool(
  "visa_eligibility",
  "Check US visa eligibility based on nationality, purpose (work/study/family/investment), and qualifications. Returns eligible visa types with requirements, processing time, success rate estimates, and a recommended path.",
  VisaEligibilityInput.shape,
  async (args) => ({
    content: [{ type: "text", text: visaEligibility(args as z.infer<typeof VisaEligibilityInput>) }],
  })
);

// ── 2. green_card_timeline ────────────────────────────────────────────────────
server.tool(
  "green_card_timeline",
  "Estimate green card wait time for any employment-based (EB-1 through EB-5) or family-based (F-1 through F-4, IR) category. Returns estimated wait by country of birth, priority date explanation, Visa Bulletin analysis, and expedite options.",
  GreenCardTimelineInput.shape,
  async (args) => ({
    content: [{ type: "text", text: greenCardTimeline(args as z.infer<typeof GreenCardTimelineInput>) }],
  })
);

// ── 3. document_checklist ─────────────────────────────────────────────────────
server.tool(
  "document_checklist",
  "Get a complete document checklist for any USCIS application including H-1B, L-1, O-1, EB-1/2/3, I-485 adjustment, F-1, K-1 fiancé visa, naturalization, DACA, and TPS. Returns the checklist, common denial reasons, and tips for a strong application.",
  DocumentChecklistInput.shape,
  async (args) => ({
    content: [{ type: "text", text: documentChecklist(args as z.infer<typeof DocumentChecklistInput>) }],
  })
);

// ── 4. fee_calculator ─────────────────────────────────────────────────────────
server.tool(
  "fee_calculator",
  "Calculate the total cost of any USCIS immigration application including filing fees, biometrics, surcharges, and optional premium processing. Optionally include costs for additional family members. Returns a full fee breakdown and attorney fee ranges.",
  FeeCalculatorInput.shape,
  async (args) => ({
    content: [{ type: "text", text: feeCalculator(args as z.infer<typeof FeeCalculatorInput>) }],
  })
);

// ── 5. status_explainer ───────────────────────────────────────────────────────
server.tool(
  "status_explainer",
  "Explain any US immigration status in plain English. Input your current status (H-1B, F-1, LPR/Green Card, DACA, TPS, Pending I-485, K-1, O-1, etc.) and get your work authorization, travel rights, public benefits eligibility, restrictions, path to next status, renewal deadlines, and critical warnings.",
  StatusExplainerInput.shape,
  async (args) => ({
    content: [{ type: "text", text: statusExplainer(args as z.infer<typeof StatusExplainerInput>) }],
  })
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OliWoods Immigration Helper MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

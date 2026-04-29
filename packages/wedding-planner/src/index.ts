#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { BudgetCalculatorInput, budgetCalculator } from "./tools/budget-calculator.js";
import { TimelineBuilderInput, timelineBuilder } from "./tools/timeline-builder.js";
import { VendorChecklistInput, vendorChecklist } from "./tools/vendor-checklist.js";
import { SeatingChartInput, seatingChart } from "./tools/seating-chart.js";
import { DayOfTimelineInput, dayOfTimeline } from "./tools/day-of-timeline.js";

const server = new McpServer({
  name: "oliwoods-wedding-planner",
  version: "1.0.0",
});

// ── 1. budget_calculator ──────────────────────────────────────────────────────
server.tool(
  "budget_calculator",
  "Calculate a wedding budget breakdown by category (venue, catering, photography, florals, music, etc.) based on total budget, guest count, city, and style. Returns per-guest cost, where to splurge vs. save, and actionable money-saving tips.",
  BudgetCalculatorInput.shape,
  async (args) => ({
    content: [{ type: "text", text: budgetCalculator(args as z.infer<typeof BudgetCalculatorInput>) }],
  })
);

// ── 2. timeline_builder ───────────────────────────────────────────────────────
server.tool(
  "timeline_builder",
  "Build a month-by-month wedding planning timeline from engagement to wedding day. Returns milestone task lists, vendor booking priority order, key deadlines, and urgency flags based on how much time remains.",
  TimelineBuilderInput.shape,
  async (args) => ({
    content: [{ type: "text", text: timelineBuilder(args as z.infer<typeof TimelineBuilderInput>) }],
  })
);

// ── 3. vendor_checklist ───────────────────────────────────────────────────────
server.tool(
  "vendor_checklist",
  "Get a complete vendor guide for any wedding vendor type — photographer, florist, DJ, caterer, officiant, videographer, hair and makeup, baker, transportation, or wedding planner. Returns questions to ask, contract must-haves, typical pricing, red flags, tipping guide, and booking timeline.",
  VendorChecklistInput.shape,
  async (args) => ({
    content: [{ type: "text", text: vendorChecklist(args as z.infer<typeof VendorChecklistInput>) }],
  })
);

// ── 4. seating_chart ──────────────────────────────────────────────────────────
server.tool(
  "seating_chart",
  "Generate an optimised wedding seating chart from your guest list. Input guests with their relationship groups, table size, VIP designations, and must-separate pairs. Returns table assignments with grouping rationale and day-of seating tips.",
  SeatingChartInput.shape,
  async (args) => ({
    content: [{ type: "text", text: seatingChart(args as z.infer<typeof SeatingChartInput>) }],
  })
);

// ── 5. day_of_timeline ────────────────────────────────────────────────────────
server.tool(
  "day_of_timeline",
  "Build a minute-by-minute wedding day schedule. Input ceremony time, bridal party size, hair and makeup count, first look preference, and reception details. Returns a complete timeline for the couple, vendors, and family — including buffer time, emergency kit checklist, and vendor callsheet reminder.",
  DayOfTimelineInput.shape,
  async (args) => ({
    content: [{ type: "text", text: dayOfTimeline(args as z.infer<typeof DayOfTimelineInput>) }],
  })
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OliWoods Wedding Planner MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

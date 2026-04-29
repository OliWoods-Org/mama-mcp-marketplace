import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const SeasonalChecklistInput = z.object({
  season: z.enum(["spring", "summer", "fall", "winter"]).describe("Current or upcoming season"),
  home_type: z.enum(["house", "condo", "apartment"]).describe("Type of home"),
  climate_zone: z.enum(["cold", "temperate", "hot_humid", "hot_dry", "coastal"]).describe("General climate zone"),
});

type Task = {
  task: string;
  priority: "high" | "medium" | "low";
  estimated_time: string;
  estimated_cost: string;
  diy_vs_pro: "DIY" | "Pro recommended" | "Either";
};

const SEASONAL_TASKS: Record<string, Record<string, Task[]>> = {
  spring: {
    house: [
      { task: "Inspect roof for winter damage — loose shingles, flashing, gutters", priority: "high", estimated_time: "2–3 hrs", estimated_cost: "$0 (DIY inspection) / $150–300 (pro inspection)", diy_vs_pro: "Either" },
      { task: "Clean and test HVAC system; replace air filter; schedule AC tune-up", priority: "high", estimated_time: "1–2 hrs", estimated_cost: "$80–150 (tune-up)", diy_vs_pro: "Pro recommended" },
      { task: "Clear gutters and downspouts of winter debris", priority: "high", estimated_time: "2–4 hrs", estimated_cost: "$0–$150", diy_vs_pro: "Either" },
      { task: "Check exterior caulking around windows and doors; re-caulk as needed", priority: "medium", estimated_time: "2–3 hrs", estimated_cost: "$10–30", diy_vs_pro: "DIY" },
      { task: "Inspect foundation for cracks or water intrusion signs", priority: "high", estimated_time: "1 hr", estimated_cost: "$0 (inspection) / $500+ (repair)", diy_vs_pro: "Pro recommended" },
      { task: "Test smoke and CO detectors; replace batteries", priority: "high", estimated_time: "30 min", estimated_cost: "$5–15", diy_vs_pro: "DIY" },
      { task: "Check and lubricate garage door springs and tracks", priority: "medium", estimated_time: "45 min", estimated_cost: "$10–20", diy_vs_pro: "DIY" },
      { task: "Flush water heater sediment; check anode rod", priority: "medium", estimated_time: "1–2 hrs", estimated_cost: "$0–50", diy_vs_pro: "Either" },
      { task: "Service lawn mower and outdoor equipment before season", priority: "medium", estimated_time: "1–2 hrs", estimated_cost: "$30–80", diy_vs_pro: "Either" },
      { task: "Inspect and clean dryer vent", priority: "high", estimated_time: "1 hr", estimated_cost: "$0–80", diy_vs_pro: "Either" },
    ],
    condo: [
      { task: "Clean and test HVAC unit; replace filters", priority: "high", estimated_time: "1 hr", estimated_cost: "$20–50", diy_vs_pro: "DIY" },
      { task: "Test smoke and CO detectors", priority: "high", estimated_time: "20 min", estimated_cost: "$5–10", diy_vs_pro: "DIY" },
      { task: "Check balcony/patio for winter damage; clean drains", priority: "medium", estimated_time: "1 hr", estimated_cost: "$0–50", diy_vs_pro: "DIY" },
      { task: "Inspect windows and patio doors for seal failures; re-caulk if needed", priority: "medium", estimated_time: "1–2 hrs", estimated_cost: "$10–30", diy_vs_pro: "DIY" },
      { task: "Deep clean appliances; check refrigerator coils", priority: "low", estimated_time: "2 hrs", estimated_cost: "$0", diy_vs_pro: "DIY" },
    ],
    apartment: [
      { task: "Test smoke and CO detectors; notify landlord if replacing is needed", priority: "high", estimated_time: "20 min", estimated_cost: "$0–10", diy_vs_pro: "DIY" },
      { task: "Clean range hood and kitchen exhaust filter", priority: "medium", estimated_time: "30 min", estimated_cost: "$0–15", diy_vs_pro: "DIY" },
      { task: "Check for window condensation or seal failures — report to management", priority: "medium", estimated_time: "30 min", estimated_cost: "$0 (tenant)", diy_vs_pro: "Pro recommended" },
      { task: "Deep clean bathroom caulk and grout; re-caulk around tub/shower if failing", priority: "medium", estimated_time: "2 hrs", estimated_cost: "$10–25", diy_vs_pro: "DIY" },
    ],
  },
  summer: {
    house: [
      { task: "Check AC refrigerant and clean condenser coils", priority: "high", estimated_time: "1 hr", estimated_cost: "$80–200 (pro)", diy_vs_pro: "Pro recommended" },
      { task: "Inspect deck/patio for rot, loose boards, and fasteners", priority: "medium", estimated_time: "2 hrs", estimated_cost: "$0–500 depending on repairs", diy_vs_pro: "Either" },
      { task: "Seal driveway cracks before heat expands them further", priority: "medium", estimated_time: "2–3 hrs", estimated_cost: "$30–80", diy_vs_pro: "DIY" },
      { task: "Trim trees and shrubs away from house and power lines", priority: "high", estimated_time: "2–4 hrs", estimated_cost: "$200–800 (pro for large trees)", diy_vs_pro: "Either" },
      { task: "Inspect and clean window screens", priority: "low", estimated_time: "1–2 hrs", estimated_cost: "$0–50", diy_vs_pro: "DIY" },
      { task: "Check attic insulation and ventilation to prevent heat buildup", priority: "medium", estimated_time: "1 hr", estimated_cost: "$0 (inspection)", diy_vs_pro: "Either" },
      { task: "Test and run irrigation system; check for leaks or broken heads", priority: "medium", estimated_time: "1–2 hrs", estimated_cost: "$0–200", diy_vs_pro: "Either" },
    ],
    condo: [
      { task: "Service AC unit or PTAC; clean filters monthly during season", priority: "high", estimated_time: "30 min", estimated_cost: "$0–80", diy_vs_pro: "Either" },
      { task: "Inspect balcony waterproofing and drain clearance", priority: "medium", estimated_time: "1 hr", estimated_cost: "$0", diy_vs_pro: "DIY" },
      { task: "Check ceiling fans for wobble and clean blades", priority: "low", estimated_time: "45 min", estimated_cost: "$0", diy_vs_pro: "DIY" },
    ],
    apartment: [
      { task: "Clean AC window unit filters and check seal around unit", priority: "high", estimated_time: "30 min", estimated_cost: "$0", diy_vs_pro: "DIY" },
      { task: "Check bathroom exhaust fan — clean cover and motor", priority: "low", estimated_time: "20 min", estimated_cost: "$0", diy_vs_pro: "DIY" },
      { task: "Inspect balcony/patio furniture for sun damage", priority: "low", estimated_time: "30 min", estimated_cost: "$0–50", diy_vs_pro: "DIY" },
    ],
  },
  fall: {
    house: [
      { task: "Schedule furnace inspection and tune-up before heating season", priority: "high", estimated_time: "1–2 hrs", estimated_cost: "$80–150", diy_vs_pro: "Pro recommended" },
      { task: "Clean gutters after leaves fall; install gutter guards", priority: "high", estimated_time: "3–4 hrs", estimated_cost: "$0–150 cleaning / $500+ guards", diy_vs_pro: "Either" },
      { task: "Seal gaps around pipes, windows, and doors to prevent drafts", priority: "high", estimated_time: "2–3 hrs", estimated_cost: "$20–60", diy_vs_pro: "DIY" },
      { task: "Drain and winterise outdoor hose bibs and irrigation system", priority: "high", estimated_time: "1–2 hrs", estimated_cost: "$0–80", diy_vs_pro: "Either" },
      { task: "Check chimney and fireplace; schedule professional cleaning", priority: "high", estimated_time: "1 hr", estimated_cost: "$150–300", diy_vs_pro: "Pro recommended" },
      { task: "Reverse ceiling fans to clockwise for winter heat redistribution", priority: "low", estimated_time: "15 min", estimated_cost: "$0", diy_vs_pro: "DIY" },
      { task: "Stock emergency supplies — generator fuel, flashlights, batteries", priority: "medium", estimated_time: "1 hr", estimated_cost: "$50–200", diy_vs_pro: "DIY" },
    ],
    condo: [
      { task: "Bleed radiators if on hot-water heating system", priority: "high", estimated_time: "30 min", estimated_cost: "$0", diy_vs_pro: "DIY" },
      { task: "Check weatherstripping on entry door and balcony door", priority: "medium", estimated_time: "30 min", estimated_cost: "$10–30", diy_vs_pro: "DIY" },
      { task: "Replace HVAC filters before heating season", priority: "high", estimated_time: "15 min", estimated_cost: "$15–30", diy_vs_pro: "DIY" },
    ],
    apartment: [
      { task: "Notify landlord of any drafts or heating issues before cold season", priority: "high", estimated_time: "15 min", estimated_cost: "$0 (tenant)", diy_vs_pro: "Pro recommended" },
      { task: "Add door draft stoppers and window film insulation", priority: "medium", estimated_time: "1 hr", estimated_cost: "$15–40", diy_vs_pro: "DIY" },
      { task: "Test smoke/CO detectors; change batteries", priority: "high", estimated_time: "20 min", estimated_cost: "$5–10", diy_vs_pro: "DIY" },
    ],
  },
  winter: {
    house: [
      { task: "Insulate exposed pipes in unheated areas to prevent freezing", priority: "high", estimated_time: "2 hrs", estimated_cost: "$20–100", diy_vs_pro: "DIY" },
      { task: "Keep cabinet doors open during cold snaps to warm pipes", priority: "high", estimated_time: "Ongoing", estimated_cost: "$0", diy_vs_pro: "DIY" },
      { task: "Check roof for ice dams after snow; add ice-melt cables if recurring issue", priority: "high", estimated_time: "1–2 hrs", estimated_cost: "$50–500", diy_vs_pro: "Either" },
      { task: "Service generator if applicable; test monthly", priority: "medium", estimated_time: "1 hr", estimated_cost: "$0–150", diy_vs_pro: "Either" },
      { task: "Check sump pump operation before spring thaw", priority: "medium", estimated_time: "30 min", estimated_cost: "$0–150", diy_vs_pro: "Either" },
      { task: "Maintain 55°F minimum interior temperature if leaving for extended period", priority: "high", estimated_time: "Ongoing", estimated_cost: "$30–80/month in heat", diy_vs_pro: "DIY" },
    ],
    condo: [
      { task: "Report any pipe freeze concerns to building management immediately", priority: "high", estimated_time: "15 min", estimated_cost: "$0 (tenant)", diy_vs_pro: "Pro recommended" },
      { task: "Keep heat at minimum 60°F even when away", priority: "high", estimated_time: "Ongoing", estimated_cost: "Utility cost", diy_vs_pro: "DIY" },
      { task: "Clear balcony drain of ice and snow to prevent water backup", priority: "medium", estimated_time: "30 min", estimated_cost: "$0", diy_vs_pro: "DIY" },
    ],
    apartment: [
      { task: "Report any inadequate heat to landlord immediately (legal requirement in most states)", priority: "high", estimated_time: "15 min", estimated_cost: "$0", diy_vs_pro: "Pro recommended" },
      { task: "Add thermal curtains to reduce heat loss through windows", priority: "medium", estimated_time: "1 hr", estimated_cost: "$30–80", diy_vs_pro: "DIY" },
      { task: "Seal window gaps with removable rope caulk (tenant-safe)", priority: "medium", estimated_time: "1 hr", estimated_cost: "$5–15", diy_vs_pro: "DIY" },
    ],
  },
};

const CLIMATE_ADJUSTMENTS: Record<string, string[]> = {
  cold: ["Prioritise freeze prevention; pipe insulation is critical", "Snow load on roof can exceed structural limits — consider professional snow removal for large accumulations"],
  temperate: ["Balanced approach across all categories", "Focus on efficiency upgrades during shoulder seasons"],
  hot_humid: ["HVAC maintenance is the highest ROI task; mould risk is elevated — check bathroom ventilation and attic", "Termite inspections recommended annually"],
  hot_dry: ["Fire clearance around structure is critical — maintain 100-ft defensible space in wildland-urban interface", "Evaporative cooler service replaces AC tune-up in arid climates"],
  coastal: ["Salt air accelerates corrosion — inspect metal components (fasteners, flashing, railings) twice yearly", "Hurricane prep: storm shutters, roof tie-downs, generator by mid-spring"],
};

export function seasonalChecklist(input: z.infer<typeof SeasonalChecklistInput>): string {
  const key = normKey(input.season + input.home_type + input.climate_zone);
  const tasks = SEASONAL_TASKS[input.season]?.[input.home_type] ?? SEASONAL_TASKS[input.season]?.["house"] ?? [];
  const sorted = [...tasks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const totalLow = tasks.filter(t => t.diy_vs_pro === "DIY").reduce((_sum, t) => {
    const m = t.estimated_cost.match(/\$(\d+)/);
    return _sum + (m ? parseInt(m[1], 10) : 0);
  }, 0);

  const climateNotes = CLIMATE_ADJUSTMENTS[input.climate_zone] ?? [];

  const result = {
    season: input.season,
    home_type: input.home_type,
    climate_zone: input.climate_zone,
    task_count: sorted.length,
    estimated_diy_cost_range_usd: `$${totalLow}–${totalLow * 3}`,
    checklist: sorted,
    climate_specific_notes: climateNotes,
    general_tip: seededPick(key, "tip", [
      "Photograph completed repairs for insurance documentation and future reference.",
      "Create a home maintenance binder with appliance manuals, warranty info, and contractor contacts.",
      "Set calendar reminders for each task — deferred maintenance costs 3–5× more when it fails.",
      "Check your homeowner's insurance policy — some tasks are required to maintain coverage.",
    ]),
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

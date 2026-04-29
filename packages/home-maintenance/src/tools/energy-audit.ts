import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const EnergyAuditInput = z.object({
  home_sqft: z.number().min(200).max(15000).describe("Total conditioned square footage"),
  home_age_years: z.number().min(0).max(150).describe("Age of the home in years"),
  heating_cooling_type: z.enum(["gas_forced_air", "electric_heat_pump", "electric_resistance", "oil_boiler", "mini_split", "window_ac_only"]).describe("Primary HVAC system type"),
  insulation_status: z.enum(["poor", "average", "good", "unknown"]).describe("Estimated insulation quality"),
  window_type: z.enum(["single_pane", "double_pane", "double_pane_low_e", "triple_pane"]).describe("Primary window type"),
  monthly_energy_bill_usd: z.number().min(20).max(5000).describe("Average monthly energy bill in dollars"),
});

type Improvement = {
  improvement: string;
  estimated_cost_usd: string;
  annual_savings_usd: number;
  payback_years: number;
  roi_pct: number;
  rebates_available: string;
  priority: "high" | "medium" | "low";
};

function efficiencyScore(input: z.infer<typeof EnergyAuditInput>): number {
  let score = 100;
  if (input.home_age_years > 50) score -= 20;
  else if (input.home_age_years > 30) score -= 10;
  if (input.insulation_status === "poor") score -= 20;
  else if (input.insulation_status === "average") score -= 10;
  if (input.window_type === "single_pane") score -= 15;
  else if (input.window_type === "double_pane") score -= 5;
  if (input.heating_cooling_type === "electric_resistance") score -= 15;
  else if (input.heating_cooling_type === "oil_boiler") score -= 12;
  else if (input.heating_cooling_type === "window_ac_only") score -= 10;
  const billPerSqft = input.monthly_energy_bill_usd / input.home_sqft;
  if (billPerSqft > 0.15) score -= 15;
  else if (billPerSqft > 0.10) score -= 7;
  return Math.max(0, Math.min(100, score));
}

export function energyAudit(input: z.infer<typeof EnergyAuditInput>): string {
  const key = normKey(
    input.heating_cooling_type + input.insulation_status + input.window_type + input.home_age_years
  );

  const score = efficiencyScore(input);
  const scoreLabel =
    score >= 80 ? "Good" : score >= 60 ? "Average" : score >= 40 ? "Below Average" : "Poor";

  const annualBill = input.monthly_energy_bill_usd * 12;

  const improvements: Improvement[] = [];

  if (input.insulation_status === "poor" || input.insulation_status === "average" || input.insulation_status === "unknown") {
    const cost = input.home_sqft * (input.insulation_status === "poor" ? 2.5 : 1.8);
    const savings = Math.round(annualBill * 0.15);
    improvements.push({
      improvement: "Air sealing + attic insulation upgrade",
      estimated_cost_usd: `$${Math.round(cost * 0.7)}–$${Math.round(cost * 1.3)}`,
      annual_savings_usd: savings,
      payback_years: Math.round(cost / savings * 10) / 10,
      roi_pct: Math.round((savings / cost) * 100),
      rebates_available: "Federal 25C tax credit: 30% of cost up to $1,200/year; many utility rebates $200–800",
      priority: "high",
    });
  }

  if (input.heating_cooling_type === "electric_resistance" || input.heating_cooling_type === "gas_forced_air") {
    const cost = input.home_sqft > 2000 ? 7500 : 5500;
    const savingsPct = input.heating_cooling_type === "electric_resistance" ? 0.40 : 0.20;
    const savings = Math.round(annualBill * savingsPct);
    improvements.push({
      improvement: `Upgrade to high-efficiency heat pump (SEER2 18+ / HSPF2 10+)`,
      estimated_cost_usd: `$${cost}–$${Math.round(cost * 1.6)}`,
      annual_savings_usd: savings,
      payback_years: Math.round(cost / savings * 10) / 10,
      roi_pct: Math.round((savings / cost) * 100),
      rebates_available: "Federal 25C tax credit: 30% up to $2,000; IRA heat pump rebate: up to $8,000 (income-qualified); utility rebates vary",
      priority: "high",
    });
  }

  if (input.window_type === "single_pane" || input.window_type === "double_pane") {
    const windowCount = Math.round(input.home_sqft / 80);
    const costPerWindow = input.window_type === "single_pane" ? 600 : 500;
    const totalCost = windowCount * costPerWindow;
    const savings = Math.round(annualBill * (input.window_type === "single_pane" ? 0.12 : 0.07));
    improvements.push({
      improvement: `Replace ${input.window_type === "single_pane" ? "single" : "double"}-pane windows with double-pane Low-E`,
      estimated_cost_usd: `$${Math.round(totalCost * 0.8)}–$${Math.round(totalCost * 1.2)} (~${windowCount} windows estimated)`,
      annual_savings_usd: savings,
      payback_years: Math.round(totalCost / savings * 10) / 10,
      roi_pct: Math.round((savings / totalCost) * 100),
      rebates_available: "Federal 25C tax credit: 30% up to $600/year for windows; some utility rebates",
      priority: input.window_type === "single_pane" ? "high" : "medium",
    });
  }

  // Smart thermostat always applicable
  improvements.push({
    improvement: "Install smart programmable thermostat (Nest, Ecobee)",
    estimated_cost_usd: "$150–350 installed",
    annual_savings_usd: Math.round(annualBill * 0.08),
    payback_years: Math.round(250 / (annualBill * 0.08) * 10) / 10,
    roi_pct: Math.round((annualBill * 0.08 / 250) * 100),
    rebates_available: "Many utilities offer $50–150 rebates; check utility website",
    priority: "high",
  });

  // Water heater if older home
  if (input.home_age_years > 15) {
    const savings = Math.round(annualBill * 0.10);
    improvements.push({
      improvement: "Replace tank water heater with heat pump water heater (HPWH)",
      estimated_cost_usd: "$1,200–2,400 installed",
      annual_savings_usd: savings,
      payback_years: Math.round(1800 / savings * 10) / 10,
      roi_pct: Math.round((savings / 1800) * 100),
      rebates_available: "Federal 25C tax credit: 30% up to $2,000; utility rebates $300–700 common",
      priority: "medium",
    });
  }

  // Sort by ROI descending
  const sorted = improvements.sort((a, b) => b.roi_pct - a.roi_pct).slice(0, 5);

  const totalPotentialSavings = sorted.reduce((s, i) => s + i.annual_savings_usd, 0);

  const result = {
    home_sqft: input.home_sqft,
    home_age_years: input.home_age_years,
    efficiency_score: score,
    efficiency_rating: scoreLabel,
    current_annual_bill_usd: annualBill,
    benchmark_for_similar_homes_usd: Math.round(input.home_sqft * 1.35),
    top_5_improvements_by_roi: sorted,
    total_potential_annual_savings_usd: totalPotentialSavings,
    key_resources: [
      "EnergyStar.gov — rebate finder by ZIP code",
      "IRS Form 5695 — claim residential energy credits",
      "DSIRE.org — Database of State Incentives for Renewables & Efficiency",
      "energystar.gov/rebate-finder — utility rebate lookup",
    ],
    next_step: seededPick(key, "next", [
      "Schedule a professional energy audit (blower door test + thermal imaging) — cost $200–500, often subsidised by utilities.",
      "Start with smart thermostat and air sealing — highest immediate ROI with lowest upfront cost.",
      "Contact your utility company — many offer free or low-cost professional energy audits.",
    ]),
    disclaimer: "Savings estimates are based on national averages and standard assumptions. Actual results vary by climate, occupancy, and utility rates.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

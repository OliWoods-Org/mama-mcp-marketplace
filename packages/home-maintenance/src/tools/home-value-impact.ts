import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const HomeValueImpactInput = z.object({
  improvement_type: z.enum([
    "kitchen_remodel",
    "bathroom_update",
    "new_roof",
    "landscaping",
    "pool",
    "deck_patio",
    "finished_basement",
    "garage_addition",
    "hvac_replacement",
    "windows_doors",
    "exterior_paint",
    "solar_panels",
  ]).describe("Type of home improvement"),
  home_value_usd: z.number().min(50000).max(5000000).optional().describe("Current estimated home value (optional, improves estimates)"),
  home_size_sqft: z.number().min(500).max(10000).optional().describe("Home size in square footage (optional)"),
});

type ImprovementProfile = {
  typical_cost_range: string;
  value_increase_range: string;
  national_avg_roi_pct: number;
  appraiser_impact: "high" | "medium" | "low";
  appraiser_notes: string;
  best_roi_scenarios: string[];
  worst_roi_scenarios: string[];
  splurge_vs_save: string;
  time_to_complete: string;
};

const IMPROVEMENT_DATA: Record<string, ImprovementProfile> = {
  kitchen_remodel: {
    typical_cost_range: "$15,000–75,000 (minor to major)",
    value_increase_range: "$10,000–55,000",
    national_avg_roi_pct: 72,
    appraiser_impact: "high",
    appraiser_notes: "Kitchen and baths are the two highest-impact rooms. Appraisers look for functional updates, quality of finishes, and alignment with neighbourhood comparable sales. Over-improving beyond neighbourhood comps yields diminishing returns.",
    best_roi_scenarios: [
      "Mid-range refresh in a mid-market neighbourhood — new countertops, cabinet refacing, updated appliances",
      "Adding a functional island in an open-plan kitchen",
      "Updating to neutral, broad-appeal finishes (quartz, white/grey cabinets)",
    ],
    worst_roi_scenarios: [
      "Custom, ultra-high-end finishes in a mid-market home",
      "Removing the kitchen eating area in favour of a butler's pantry (non-universal appeal)",
      "Trendy colours or materials that date quickly",
    ],
    splurge_vs_save: "Splurge on: countertops, appliances, and cabinet hardware. Save on: inside cabinet interiors, cabinet box structure (re-facing vs. replacing), lighting fixtures.",
    time_to_complete: "3–8 weeks for minor; 6–16 weeks for major",
  },
  bathroom_update: {
    typical_cost_range: "$5,000–35,000",
    value_increase_range: "$4,000–25,000",
    national_avg_roi_pct: 71,
    appraiser_impact: "high",
    appraiser_notes: "Primary bathroom upgrades have the strongest impact. Adding a bathroom to a home with only one is one of the highest-ROI projects possible. Quality of waterproofing and tilework matters to appraisers and inspectors.",
    best_roi_scenarios: [
      "Adding a second bathroom to a one-bath home (can return 100%+)",
      "Updating primary bath fixtures, vanity, and tilework in a dated home",
      "Converting a tub/shower combo to a walk-in shower in a primary suite",
    ],
    worst_roi_scenarios: [
      "Heated floors and elaborate steam showers in a starter home",
      "Removing all tubs from a home with families as primary buyers",
      "High-end fixtures in a low-price-point market",
    ],
    splurge_vs_save: "Splurge on: tile quality and pattern, the vanity, and proper waterproofing. Save on: toilet brand, basic light fixtures, medicine cabinet.",
    time_to_complete: "1–3 weeks",
  },
  new_roof: {
    typical_cost_range: "$8,000–25,000",
    value_increase_range: "$7,000–20,000",
    national_avg_roi_pct: 68,
    appraiser_impact: "high",
    appraiser_notes: "A new roof is a major positive adjustment in any appraisal. An aged or failing roof is an equally major negative. Most buyers make roof age a contingency item; a new roof eliminates negotiation leverage for buyers.",
    best_roi_scenarios: [
      "Replacing a visibly aged or damage-documented roof before listing",
      "Upgrading from 3-tab to architectural shingles in a move-up neighbourhood",
    ],
    worst_roi_scenarios: [
      "Installing a premium metal roof in a neighbourhood of standard shingle homes",
      "Replacing a roof with 5+ years of remaining life",
    ],
    splurge_vs_save: "Splurge on: shingle quality (30-year architectural vs 20-year), ice-and-water shield underlayment. Save on: skylights and complex add-ons unless functional.",
    time_to_complete: "1–3 days",
  },
  landscaping: {
    typical_cost_range: "$3,000–20,000",
    value_increase_range: "$3,000–15,000",
    national_avg_roi_pct: 100,
    appraiser_impact: "medium",
    appraiser_notes: "Landscaping improves curb appeal and can influence buyer first impressions dramatically, but it's harder for appraisers to quantify directly. Well-maintained landscaping is 'table stakes'; exceptional landscaping rarely adds proportional value.",
    best_roi_scenarios: [
      "Front yard curb appeal refresh (mulch, low-maintenance plantings, trimmed trees)",
      "Adding a defined outdoor entertaining area (patio + minimal hardscape)",
      "Irrigation system in drought-prone regions",
    ],
    worst_roi_scenarios: [
      "Elaborate water features or specialty gardens with high maintenance requirements",
      "Landscape design heavily personalised to current owner's taste",
    ],
    splurge_vs_save: "Splurge on: hardscape quality (durable pavers vs concrete), mature trees (instant visual impact). Save on: annuals and seasonal colour (perishable).",
    time_to_complete: "1–4 weeks",
  },
  pool: {
    typical_cost_range: "$35,000–90,000",
    value_increase_range: "$7,000–25,000",
    national_avg_roi_pct: 30,
    appraiser_impact: "low",
    appraiser_notes: "Pools have highly variable ROI depending on climate and buyer demographics. In Phoenix or Miami, a pool is expected and adds value. In Minnesota, it can be a deterrent. Ongoing maintenance cost (~$1,500–3,000/year) is a negative for some buyers. Appraisers typically apply a modest positive adjustment in pool-prevalent markets.",
    best_roi_scenarios: [
      "Hot, sunny climates where pools are expected (AZ, FL, CA, TX)",
      "Luxury price tier where pool is an expectation in the price range",
    ],
    worst_roi_scenarios: [
      "Northern climates with short swimming seasons",
      "Family-dense neighbourhoods where pool is a safety/insurance concern",
      "Any market where buyers are predominantly downsizers",
    ],
    splurge_vs_save: "Splurge on: automation systems (remote control), quality decking. Save on: elaborate water features with high maintenance.",
    time_to_complete: "8–14 weeks",
  },
  deck_patio: {
    typical_cost_range: "$6,000–30,000",
    value_increase_range: "$5,000–20,000",
    national_avg_roi_pct: 70,
    appraiser_impact: "medium",
    appraiser_notes: "Outdoor living space has gained significant value post-pandemic. Composite decking ROI has improved as material costs align with wood. Appraisers value functional, well-constructed outdoor spaces — especially in connected living markets.",
    best_roi_scenarios: [
      "Homes without any existing outdoor living space in a temperate climate",
      "Composite material — low maintenance, durable",
      "Connection to indoor living area (walkout or direct kitchen access)",
    ],
    worst_roi_scenarios: [
      "Very large deck far exceeding neighbourhood norms",
      "Wood decking requiring immediate staining/sealing on sale",
    ],
    splurge_vs_save: "Splurge on: composite decking material, structural footings. Save on: built-in furniture (buyers prefer flexibility).",
    time_to_complete: "2–4 weeks",
  },
  finished_basement: {
    typical_cost_range: "$20,000–75,000",
    value_increase_range: "$15,000–50,000",
    national_avg_roi_pct: 70,
    appraiser_impact: "high",
    appraiser_notes: "Finished basement adds functional square footage but is typically valued at 50–60% of above-grade space. Must have egress windows for legal bedroom count. Proper moisture control is critical — appraisers flag any dampness.",
    best_roi_scenarios: [
      "Adding a legal bedroom and bathroom for ADU income potential",
      "Open, flexible rec room/media space with wet bar",
      "Markets where finished basements are the norm",
    ],
    worst_roi_scenarios: [
      "Highly customised layouts (single-purpose home theatre, elaborate bars)",
      "Basement with moisture history that hasn't been fully remediated",
    ],
    splurge_vs_save: "Splurge on: moisture control systems, egress windows, HVAC. Save on: premium flooring (LVP is excellent here) and cabinetry.",
    time_to_complete: "4–10 weeks",
  },
  garage_addition: {
    typical_cost_range: "$20,000–45,000",
    value_increase_range: "$15,000–35,000",
    national_avg_roi_pct: 80,
    appraiser_impact: "high",
    appraiser_notes: "Adding a garage where one is expected by the market is one of the highest-ROI structural additions. Number of garage bays is a standard appraisal data point. In markets where garages are standard, a home without one is at a significant competitive disadvantage.",
    best_roi_scenarios: [
      "Adding an attached garage to a home in a neighbourhood where garages are standard",
      "Converting detached garage to ADU (income-producing)",
    ],
    worst_roi_scenarios: [
      "Third or fourth car garage in a market where 2-car is standard",
      "Detached garage without connection to main living space in cold climates",
    ],
    splurge_vs_save: "Splurge on: insulation and heating if in cold climate, quality door and opener. Save on: interior finishes if purely functional.",
    time_to_complete: "4–8 weeks",
  },
  hvac_replacement: {
    typical_cost_range: "$6,000–15,000",
    value_increase_range: "$3,000–8,000",
    national_avg_roi_pct: 55,
    appraiser_impact: "medium",
    appraiser_notes: "Buyers and appraisers both value a new, efficient HVAC system — primarily as a risk-reduction, not a value-add. A new system eliminates a buyer negotiation point. Older systems (12+ years) are a negative adjustment in most appraisals.",
    best_roi_scenarios: [
      "Replacing a 15+ year old system before listing",
      "Upgrading to heat pump in a market with high energy costs",
    ],
    worst_roi_scenarios: [
      "Replacing a newer system that is still performing well",
      "Over-specifying system size for the home",
    ],
    splurge_vs_save: "Splurge on: efficiency rating (pays back in utility bills). Save on: zoning systems unless necessary.",
    time_to_complete: "1–2 days",
  },
  windows_doors: {
    typical_cost_range: "$8,000–25,000",
    value_increase_range: "$5,000–15,000",
    national_avg_roi_pct: 65,
    appraiser_impact: "medium",
    appraiser_notes: "Updated windows and doors improve curb appeal and energy efficiency, both of which appraisers note. However, the direct value add is often less than the cost, especially for premium windows. Front door replacement has among the highest ROI of any single improvement.",
    best_roi_scenarios: [
      "Front door replacement ($500–2,000 with 90%+ ROI)",
      "Replacing clearly failing or single-pane windows",
      "New garage door ($800–2,500 with 85–100% ROI)",
    ],
    worst_roi_scenarios: [
      "Premium triple-pane windows in a mild climate",
      "Full window replacement when existing windows are performing adequately",
    ],
    splurge_vs_save: "Splurge on: front entry door, Low-E glass coating. Save on: number of windows replaced (do worst first).",
    time_to_complete: "1–3 days per area",
  },
  exterior_paint: {
    typical_cost_range: "$2,500–8,000",
    value_increase_range: "$3,000–10,000",
    national_avg_roi_pct: 110,
    appraiser_impact: "medium",
    appraiser_notes: "Exterior paint is among the highest-ROI improvements due to the relatively low cost and dramatic curb appeal impact. Neutral, current colours are important — trendy or hyper-personalised colours can narrow buyer pool.",
    best_roi_scenarios: [
      "Faded or peeling exterior in a strong seller's market",
      "Updating a dated colour scheme to contemporary neutral palette",
    ],
    worst_roi_scenarios: [
      "Bold or unusual colour choices",
      "Painting over surfaces that need repair or rot replacement",
    ],
    splurge_vs_save: "Splurge on: quality exterior paint (Sherwin-Williams Emerald, Benjamin Moore Aura). Save on: skipping accent colours beyond two tones.",
    time_to_complete: "3–7 days",
  },
  solar_panels: {
    typical_cost_range: "$15,000–30,000 (before incentives)",
    value_increase_range: "$10,000–20,000",
    national_avg_roi_pct: 75,
    appraiser_impact: "medium",
    appraiser_notes: "Appraiser treatment of solar is inconsistent market-to-market. Owned (not leased) systems add value. Zillow studies show 4% average value premium for solar homes. Leased systems can complicate sales — buyers must assume the lease.",
    best_roi_scenarios: [
      "Owned (not leased) system in a high-electricity-cost market (CA, NY, HI)",
      "System properly sized for the home's consumption",
    ],
    worst_roi_scenarios: [
      "Leased system — complicates sale and may not add appraisal value",
      "Markets with very low electricity rates or poor solar irradiance",
    ],
    splurge_vs_save: "Splurge on: battery storage if grid reliability is a local concern. Save on: panel brand — tier-2 panels often have comparable performance.",
    time_to_complete: "1–3 days installation; 4–12 weeks for utility interconnection",
  },
};

export function homeValueImpact(input: z.infer<typeof HomeValueImpactInput>): string {
  const key = normKey(input.improvement_type + (input.home_value_usd ?? 0));
  const profile = IMPROVEMENT_DATA[input.improvement_type];

  let scaledCostNote = null;
  if (input.home_value_usd) {
    const roiValue = Math.round(input.home_value_usd * (profile.national_avg_roi_pct / 100) * 0.1);
    scaledCostNote = `For a home valued at $${input.home_value_usd.toLocaleString()}, expect typical value increase around $${roiValue.toLocaleString()}–$${Math.round(roiValue * 1.6).toLocaleString()} depending on market conditions.`;
  }

  const result = {
    improvement_type: input.improvement_type,
    ...(input.home_value_usd ? { home_value_usd: input.home_value_usd } : {}),
    typical_cost_range: profile.typical_cost_range,
    expected_value_increase: profile.value_increase_range,
    national_average_roi_pct: profile.national_avg_roi_pct,
    roi_note: profile.national_avg_roi_pct >= 100
      ? "This improvement typically returns its full cost or more at resale."
      : profile.national_avg_roi_pct >= 70
      ? "Strong ROI — typically recoups most of the investment at resale."
      : "Moderate ROI — value is more in enjoyment than pure financial return.",
    ...(scaledCostNote ? { home_specific_estimate_note: scaledCostNote } : {}),
    appraiser_impact_level: profile.appraiser_impact,
    how_appraisers_value_this: profile.appraiser_notes,
    best_roi_scenarios: profile.best_roi_scenarios,
    worst_roi_scenarios: profile.worst_roi_scenarios,
    splurge_vs_save_guide: profile.splurge_vs_save,
    typical_time_to_complete: profile.time_to_complete,
    general_advice: seededPick(key, "advice", [
      "Get improvements done 3–6 months before listing — rushed work shows.",
      "Neutral, broadly appealing finishes consistently outperform personalised choices in ROI.",
      "Focus on functional improvements over purely cosmetic ones for best appraiser response.",
      "Document all improvements with receipts — disclose to appraiser and buyer.",
    ]),
    disclaimer:
      "ROI figures are national averages from Remodeling Magazine's Cost vs. Value report. Local market conditions significantly affect outcomes. Consult a local real estate agent before major pre-sale improvements.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

import { z } from "zod";
import { seeded, seededInt, seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const BudgetCalculatorInput = z.object({
  total_budget_usd: z.number().min(1000).max(1000000).describe("Total wedding budget in US dollars"),
  guest_count: z.number().min(1).max(1000).describe("Expected number of guests"),
  city_or_region: z.string().min(2).describe("Wedding city or region, e.g. 'New York City', 'rural Texas'"),
  style: z.enum(["intimate", "classic", "luxury"]).describe("Wedding style: intimate (casual/bohemian), classic (traditional), luxury (black tie/upscale)"),
});

const COST_OF_LIVING_FACTOR: Record<string, number> = {
  "new york": 1.45,
  "los angeles": 1.40,
  "san francisco": 1.50,
  "miami": 1.25,
  "chicago": 1.20,
  "boston": 1.35,
  "washington": 1.30,
  "seattle": 1.30,
  "denver": 1.15,
  "austin": 1.15,
  "nashville": 1.10,
  "dallas": 1.05,
  "phoenix": 1.05,
  "rural": 0.80,
  "midwest": 0.90,
  "south": 0.90,
  "southwest": 0.95,
};

function cityFactor(city: string): number {
  const lower = city.toLowerCase();
  for (const [k, v] of Object.entries(COST_OF_LIVING_FACTOR)) {
    if (lower.includes(k)) return v;
  }
  return 1.0;
}

type StyleAllocations = {
  venue_pct: number;
  catering_pct: number;
  photography_video_pct: number;
  flowers_decor_pct: number;
  music_entertainment_pct: number;
  attire_pct: number;
  hair_makeup_pct: number;
  stationery_pct: number;
  transportation_pct: number;
  favors_gifts_pct: number;
  officiant_pct: number;
  honeymoon_fund_pct: number;
  contingency_pct: number;
};

const ALLOCATIONS: Record<string, StyleAllocations> = {
  intimate: {
    venue_pct: 30, catering_pct: 25, photography_video_pct: 12,
    flowers_decor_pct: 8, music_entertainment_pct: 5, attire_pct: 6,
    hair_makeup_pct: 3, stationery_pct: 1, transportation_pct: 2,
    favors_gifts_pct: 1, officiant_pct: 2, honeymoon_fund_pct: 0,
    contingency_pct: 5,
  },
  classic: {
    venue_pct: 35, catering_pct: 28, photography_video_pct: 12,
    flowers_decor_pct: 8, music_entertainment_pct: 6, attire_pct: 4,
    hair_makeup_pct: 2, stationery_pct: 1, transportation_pct: 1,
    favors_gifts_pct: 1, officiant_pct: 1, honeymoon_fund_pct: 0,
    contingency_pct: 5,
  },
  luxury: {
    venue_pct: 38, catering_pct: 27, photography_video_pct: 10,
    flowers_decor_pct: 10, music_entertainment_pct: 6, attire_pct: 4,
    hair_makeup_pct: 2, stationery_pct: 1, transportation_pct: 2,
    favors_gifts_pct: 2, officiant_pct: 1, honeymoon_fund_pct: 0,
    contingency_pct: 5,
  },
};

const SPLURGE_VS_SAVE: Record<string, { splurge: string; save: string }[]> = {
  intimate: [
    { splurge: "Photography — images last forever; don't cut here", save: "Florals — use greenery, candles, and simple arrangements" },
    { splurge: "Food quality — guests remember the meal", save: "Venue — consider non-traditional spaces (parks, restaurants, family property)" },
    { splurge: "Couple's attire — personal and meaningful", save: "Stationery — digital invitations are fully accepted" },
  ],
  classic: [
    { splurge: "Venue — atmosphere sets the entire tone", save: "Wedding favors — most guests leave them behind" },
    { splurge: "Photography + Videography — the lasting record", save: "Elaborate centrepieces — candles + greenery over expensive florals" },
    { splurge: "Band or DJ — music drives the reception energy", save: "Transportation — Uber/Lyft for guests instead of shuttles" },
  ],
  luxury: [
    { splurge: "Venue — the statement piece of a luxury wedding", save: "Printed programmes — elegant, but most guests discard them" },
    { splurge: "Catering — fine dining quality is expected at this budget level", save: "Elaborate welcome bags — a simple, meaningful item beats volume" },
    { splurge: "Multi-photographer + videographer team", save: "Second venue for cocktail hour if the main venue accommodates it" },
  ],
};

export function budgetCalculator(input: z.infer<typeof BudgetCalculatorInput>): string {
  const key = normKey(input.city_or_region + input.style + input.total_budget_usd);
  const alloc = ALLOCATIONS[input.style];
  const cf = cityFactor(input.city_or_region);
  const perGuest = Math.round((input.total_budget_usd / input.guest_count) * 100) / 100;

  const breakdown = Object.entries(alloc).map(([category, pct]) => {
    const amount = Math.round(input.total_budget_usd * (pct / 100));
    return {
      category: category.replace(/_pct$/, "").replace(/_/g, " "),
      percentage: pct,
      amount_usd: amount,
      city_adjusted_usd: Math.round(amount * cf),
    };
  });

  const nationalAvgForStyle = input.style === "luxury" ? 36000 : input.style === "classic" ? 29000 : 18000;
  const nationalAvgPerGuest = Math.round(nationalAvgForStyle / (input.style === "luxury" ? 120 : input.style === "classic" ? 100 : 75));

  const budgetTier =
    perGuest >= 300 ? "luxury" :
    perGuest >= 150 ? "comfortable" :
    perGuest >= 80 ? "moderate" :
    "budget-conscious";

  const splurgeAndSave = SPLURGE_VS_SAVE[input.style];

  const result = {
    total_budget_usd: input.total_budget_usd,
    guest_count: input.guest_count,
    per_guest_cost_usd: perGuest,
    city_region: input.city_or_region,
    cost_of_living_factor: cf,
    style: input.style,
    budget_tier: budgetTier,
    national_avg_for_this_style_usd: nationalAvgForStyle,
    national_avg_per_guest_usd: nationalAvgPerGuest,
    budget_breakdown: breakdown,
    where_to_splurge_vs_save: splurgeAndSave,
    realism_check: perGuest < 80
      ? "⚠️  Under $80/person is very tight — consider reducing guest count before cutting vendor quality."
      : perGuest < 120
      ? "Achievable with careful vendor selection; prioritise by most-photographed elements."
      : "Comfortable budget — focus on vendor quality and experience over quantity of extras.",
    quick_wins: [
      "Reduce guest count by 20 — saves more than almost any other single decision",
      "Consider Friday or Sunday wedding — venue costs 20–30% lower than Saturday",
      "Skip wedding favours — virtually no ROI; invest in food and music instead",
      seededPick(key, "win", [
        "Brunch or lunch reception cuts catering costs by 25–40%",
        "Seasonal flowers save 30–50% vs out-of-season requests",
        "Engagement rings and honeymoon are traditionally NOT in the wedding budget",
      ]),
    ],
    disclaimer: "Budget percentages are guidelines, not rules. Actual costs vary by market and vendor. Always get written quotes before finalising allocations.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

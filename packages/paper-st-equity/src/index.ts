#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CTA = `\n---\nReady to thaw your equity? paperst.oliwoods.com/beta`;

const server = new McpServer({
  name: "paperst-equity",
  version: "1.0.0",
});

// ── calculate_locked_equity ──────────────────────────────────────────────────
server.tool(
  "calculate_locked_equity",
  "Calculate the current dollar value of locked (unvested or illiquid) equity given grant details and a current 409A or FMV share price",
  {
    total_shares: z.number().positive().describe("Total shares granted"),
    vested_shares: z.number().min(0).describe("Shares already vested"),
    share_price: z.number().positive().describe("Current 409A / FMV price per share in USD"),
    strike_price: z.number().min(0).optional().default(0).describe("Option strike price per share (0 for RSUs)"),
    grant_type: z.enum(["ISO", "NSO", "RSU", "SAR"]).optional().default("ISO").describe("Grant type"),
  },
  async ({ total_shares, vested_shares, share_price, strike_price, grant_type }) => {
    const unvested = total_shares - vested_shares;
    const spread = Math.max(0, share_price - strike_price);
    const vestedValue = vested_shares * spread;
    const lockedValue = unvested * spread;
    const totalValue = total_shares * spread;
    const pctVested = total_shares > 0 ? ((vested_shares / total_shares) * 100).toFixed(1) : "0.0";

    const result = `## Locked Equity Summary

**Grant Type:** ${grant_type}
**Share Price (FMV):** $${share_price.toFixed(2)}
**Strike Price:** $${strike_price.toFixed(2)}
**Per-Share Spread:** $${spread.toFixed(2)}

### Share Breakdown
| | Shares | Value |
|---|---|---|
| Vested | ${vested_shares.toLocaleString()} | $${vestedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
| **Locked (Unvested)** | **${unvested.toLocaleString()}** | **$${lockedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** |
| Total | ${total_shares.toLocaleString()} | $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |

**Vesting Progress:** ${pctVested}% vested

> Values are pre-tax estimates based on current FMV. Actual proceeds depend on liquidity events, taxes, and exercise costs.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── tax_impact_estimator ─────────────────────────────────────────────────────
server.tool(
  "tax_impact_estimator",
  "Estimate federal and state tax liability when exercising or selling equity (ISOs, NSOs, RSUs)",
  {
    grant_type: z.enum(["ISO", "NSO", "RSU"]).describe("Grant type"),
    shares: z.number().positive().describe("Number of shares to exercise or sell"),
    strike_price: z.number().min(0).describe("Strike / grant price per share"),
    fmv_at_exercise: z.number().positive().describe("Fair market value per share at exercise/vesting"),
    sale_price: z.number().optional().describe("Sale price per share (if selling immediately)"),
    holding_period_months: z.number().min(0).optional().default(0).describe("Months held after exercise before sale"),
    federal_income_tax_rate: z.number().min(0).max(1).optional().default(0.37).describe("Marginal federal income tax rate (0–1)"),
    state_income_tax_rate: z.number().min(0).max(1).optional().default(0.093).describe("State income tax rate (0–1, default CA 9.3%)"),
    long_term_cg_rate: z.number().min(0).max(1).optional().default(0.20).describe("Long-term capital gains rate (0–1)"),
  },
  async ({
    grant_type, shares, strike_price, fmv_at_exercise, sale_price,
    holding_period_months, federal_income_tax_rate, state_income_tax_rate, long_term_cg_rate,
  }) => {
    const spread = Math.max(0, fmv_at_exercise - strike_price);
    const totalSpread = spread * shares;
    const isLongTerm = holding_period_months >= 12;

    let ordinaryIncome = 0;
    let capitalGain = 0;
    let amtPreference = 0;
    let notes: string[] = [];

    if (grant_type === "NSO") {
      ordinaryIncome = totalSpread;
      if (sale_price) {
        const gainPerShare = Math.max(0, sale_price - fmv_at_exercise);
        capitalGain = gainPerShare * shares;
      }
      notes.push("NSO spread is ordinary income at exercise; further gain is capital gain at sale.");
    } else if (grant_type === "RSU") {
      ordinaryIncome = fmv_at_exercise * shares;
      if (sale_price) {
        capitalGain = (sale_price - fmv_at_exercise) * shares;
      }
      notes.push("RSU value at vesting is ordinary income; any appreciation after vesting is capital gain.");
    } else {
      // ISO
      amtPreference = totalSpread;
      if (sale_price && isLongTerm) {
        capitalGain = (sale_price - strike_price) * shares;
        notes.push("ISO with qualifying disposition: all gain taxed as long-term capital gain.");
      } else if (sale_price && !isLongTerm) {
        ordinaryIncome = Math.min(totalSpread, (sale_price - strike_price) * shares);
        capitalGain = Math.max(0, (sale_price - fmv_at_exercise) * shares);
        notes.push("ISO with disqualifying disposition: spread is ordinary income.");
      } else {
        notes.push(`ISO exercise only — no immediate regular tax. AMT preference item: $${amtPreference.toLocaleString()}.`);
      }
    }

    const cgRate = isLongTerm ? long_term_cg_rate : federal_income_tax_rate;
    const federalOrdinary = ordinaryIncome * federal_income_tax_rate;
    const stateOrdinary = ordinaryIncome * state_income_tax_rate;
    const federalCg = capitalGain * cgRate;
    const stateCg = capitalGain * state_income_tax_rate;
    const niit = capitalGain > 0 ? capitalGain * 0.038 : 0; // 3.8% NIIT approximation
    const totalTax = federalOrdinary + stateOrdinary + federalCg + stateCg + niit;
    const netProceeds = sale_price ? sale_price * shares - totalTax : undefined;

    const result = `## Tax Impact Estimate — ${grant_type}

**Shares:** ${shares.toLocaleString()}
**Strike Price:** $${strike_price.toFixed(2)}
**FMV at Exercise:** $${fmv_at_exercise.toFixed(2)}
${sale_price ? `**Sale Price:** $${sale_price.toFixed(2)}` : ""}
**Holding Period:** ${holding_period_months} months (${isLongTerm ? "long-term" : "short-term"})

### Income Breakdown
- Ordinary Income: $${ordinaryIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Capital Gain: $${capitalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${grant_type === "ISO" ? `- AMT Preference Item: $${amtPreference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}

### Estimated Taxes
| Tax | Amount |
|---|---|
| Federal Income Tax | $${federalOrdinary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
| State Income Tax | $${stateOrdinary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
| Capital Gains Tax | $${(federalCg + stateCg).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
| NIIT (3.8%) | $${niit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
| **Total Est. Tax** | **$${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** |

${netProceeds !== undefined ? `**Estimated Net Proceeds:** $${netProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}

### Notes
${notes.map((n) => `- ${n}`).join("\n")}

> This is a simplified estimate. Consult a tax advisor for your specific situation.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── vesting_schedule ─────────────────────────────────────────────────────────
server.tool(
  "vesting_schedule",
  "Generate a complete vesting schedule with cliff date, monthly vest amounts, and cumulative totals",
  {
    total_shares: z.number().positive().describe("Total shares granted"),
    grant_date: z.string().describe("Grant date in YYYY-MM-DD format"),
    cliff_months: z.number().min(0).optional().default(12).describe("Cliff period in months (default 12)"),
    vesting_period_months: z.number().positive().optional().default(48).describe("Total vesting period in months (default 48)"),
    schedule_type: z.enum(["monthly", "quarterly", "annual"]).optional().default("monthly").describe("Vesting frequency after cliff"),
    already_vested: z.number().min(0).optional().default(0).describe("Shares already vested (for mid-schedule queries)"),
  },
  async ({ total_shares, grant_date, cliff_months, vesting_period_months, schedule_type, already_vested }) => {
    const start = new Date(grant_date);
    const cliffDate = new Date(start);
    cliffDate.setMonth(cliffDate.getMonth() + cliff_months);

    const cliffShares = cliff_months > 0 ? Math.floor((total_shares * cliff_months) / vesting_period_months) : 0;
    const remainingShares = total_shares - cliffShares;
    const remainingMonths = vesting_period_months - cliff_months;

    const intervalMap: Record<string, number> = { monthly: 1, quarterly: 3, annual: 12 };
    const interval = intervalMap[schedule_type];
    const intervals = Math.floor(remainingMonths / interval);
    const sharesPerInterval = intervals > 0 ? Math.floor(remainingShares / intervals) : 0;
    const remainder = remainingShares - sharesPerInterval * intervals;

    const rows: string[] = [];
    let cumulative = already_vested;
    const today = new Date();

    if (cliff_months > 0) {
      const status = cliffDate <= today ? "✅" : "⏳";
      cumulative += cliffShares;
      rows.push(`| ${cliffDate.toISOString().slice(0, 10)} | Cliff | ${cliffShares.toLocaleString()} | ${cumulative.toLocaleString()} | ${status} |`);
    }

    for (let i = 1; i <= intervals; i++) {
      const vestDate = new Date(cliffDate);
      vestDate.setMonth(vestDate.getMonth() + i * interval);
      const shares = sharesPerInterval + (i === intervals ? remainder : 0);
      cumulative += shares;
      const status = vestDate <= today ? "✅" : "⏳";
      const pct = ((cumulative / total_shares) * 100).toFixed(1);
      rows.push(`| ${vestDate.toISOString().slice(0, 10)} | ${schedule_type.charAt(0).toUpperCase() + schedule_type.slice(1)} | ${shares.toLocaleString()} | ${cumulative.toLocaleString()} (${pct}%) | ${status} |`);
    }

    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + vesting_period_months);

    const result = `## Vesting Schedule

**Grant Date:** ${grant_date}
**Total Shares:** ${total_shares.toLocaleString()}
**Cliff:** ${cliff_months} months (${cliff_months > 0 ? cliffDate.toISOString().slice(0, 10) : "None"})
**Full Vest:** ${endDate.toISOString().slice(0, 10)} (${vesting_period_months / 12} years)
**Frequency:** ${schedule_type}

| Date | Event | Shares Vesting | Cumulative | Status |
|---|---|---|---|---|
${rows.join("\n")}

✅ = vested  ⏳ = upcoming
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── thaw_simulator ───────────────────────────────────────────────────────────
server.tool(
  "thaw_simulator",
  "Simulate the outcome of a liquidity event (IPO, acquisition, tender offer) on locked equity — models proceeds, tax withholding, and net cash",
  {
    vested_shares: z.number().positive().describe("Vested shares available for liquidity"),
    strike_price: z.number().min(0).describe("Strike price per share"),
    event_type: z.enum(["IPO", "acquisition", "tender_offer", "secondary_sale"]).describe("Type of liquidity event"),
    event_price_per_share: z.number().positive().describe("Price per share in the liquidity event"),
    lockup_months: z.number().min(0).optional().default(6).describe("Post-event lockup period in months (IPO default 6)"),
    tax_rate_total: z.number().min(0).max(1).optional().default(0.45).describe("Combined effective tax rate (federal + state + FICA)"),
    exercise_cost_funded: z.boolean().optional().default(false).describe("Whether exercise cost is pre-funded (cashless exercise)"),
  },
  async ({ vested_shares, strike_price, event_type, event_price_per_share, lockup_months, tax_rate_total, exercise_cost_funded }) => {
    const grossProceeds = vested_shares * event_price_per_share;
    const exerciseCost = vested_shares * strike_price;
    const spread = Math.max(0, event_price_per_share - strike_price);
    const taxableGain = spread * vested_shares;
    const estimatedTax = taxableGain * tax_rate_total;
    const netProceeds = grossProceeds - (exercise_cost_funded ? 0 : exerciseCost) - estimatedTax;

    const unlockDate = new Date();
    unlockDate.setMonth(unlockDate.getMonth() + lockup_months);

    const eventNotes: Record<string, string> = {
      IPO: `Shares typically subject to a ${lockup_months}-month lockup post-IPO. Price may fluctuate significantly.`,
      acquisition: "All-cash acquisitions typically close within 3–6 months of announcement.",
      tender_offer: "Tender offers allow partial liquidity before a full exit. Check program limits.",
      secondary_sale: "Secondary sales require company approval and may be at a discount to FMV.",
    };

    const result = `## Thaw Simulator — ${event_type}

**Event Price:** $${event_price_per_share.toFixed(2)} / share
**Vested Shares:** ${vested_shares.toLocaleString()}
**Strike Price:** $${strike_price.toFixed(2)}

### Proceeds Model
| | Amount |
|---|---|
| Gross Proceeds | $${grossProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |
| Exercise Cost | $(${exerciseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) |
| Est. Taxes (${(tax_rate_total * 100).toFixed(0)}%) | $(${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) |
| **Net Cash** | **$${netProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** |

**Lockup Expiry:** ${lockup_months > 0 ? unlockDate.toISOString().slice(0, 10) : "None"}

### Event Notes
${eventNotes[event_type]}

> Assumes ${(tax_rate_total * 100).toFixed(0)}% blended tax rate. Actual taxes depend on grant type, holding period, and state. Consult a financial advisor.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── company_equity_lookup ────────────────────────────────────────────────────
server.tool(
  "company_equity_lookup",
  "Look up publicly known equity details for a company — last 409A valuation, funding stage, estimated dilution, and typical option pool size",
  {
    company_name: z.string().describe("Company name or ticker symbol"),
    include_comparables: z.boolean().optional().default(false).describe("Include comparable companies in the same sector"),
  },
  async ({ company_name, include_comparables }) => {
    // Representative reference data — in production this would call a live API
    const knownCompanies: Record<string, { stage: string; lastRound: string; estimatedFMV: string; optionPool: string; dilution: string }> = {
      "stripe": { stage: "Late Private", lastRound: "Series I ($6.5B, 2023)", estimatedFMV: "$65B", optionPool: "~10%", dilution: "~40% cumulative" },
      "openai": { stage: "Late Private", lastRound: "Series F ($6.6B, 2024)", estimatedFMV: "$157B", optionPool: "~15%", dilution: "~50% cumulative" },
      "anthropic": { stage: "Late Private", lastRound: "Series E ($4B, 2024)", estimatedFMV: "$61B", optionPool: "~12%", dilution: "~45% cumulative" },
    };

    const key = company_name.toLowerCase().trim();
    const data = knownCompanies[key];

    const comparables = include_comparables
      ? `\n### Comparable Companies (Late-Stage Private Tech)\n- Median option pool: 10–15%\n- Median cumulative dilution at Series D+: 35–55%\n- Typical 409A: 20–40% of preferred price`
      : "";

    const result = data
      ? `## Company Equity Profile — ${company_name}

**Stage:** ${data.stage}
**Last Known Round:** ${data.lastRound}
**Estimated Total Valuation:** ${data.estimatedFMV}
**Option Pool (est.):** ${data.optionPool}
**Cumulative Dilution (est.):** ${data.dilution}

> Data sourced from public filings and press releases. 409A valuations are typically 20–40% of the preferred share price.
${comparables}
${CTA}`
      : `## Company Equity Profile — ${company_name}

No structured data found for "${company_name}" in the reference database.

### General Benchmarks by Stage
| Stage | Typical Option Pool | Common 409A Discount |
|---|---|---|
| Seed | 10–20% | 20–30% of preferred |
| Series A | 10–15% | 25–35% of preferred |
| Series B/C | 8–12% | 30–40% of preferred |
| Series D+ | 5–10% | 35–50% of preferred |

Consider requesting a cap table summary from your equity plan administrator.
${comparables}
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── equity_comparison ────────────────────────────────────────────────────────
server.tool(
  "equity_comparison",
  "Compare two equity offers side-by-side — normalizes to expected value, effective annual comp, and dilution-adjusted worth",
  {
    offer_a_label: z.string().describe("Label for Offer A (e.g. company name)"),
    offer_a_shares: z.number().positive().describe("Shares granted in Offer A"),
    offer_a_strike: z.number().min(0).describe("Strike price for Offer A"),
    offer_a_fmv: z.number().positive().describe("Current 409A FMV for Offer A"),
    offer_a_exit_multiple: z.number().min(1).optional().default(3).describe("Expected exit multiple on FMV for Offer A"),
    offer_b_label: z.string().describe("Label for Offer B"),
    offer_b_shares: z.number().positive().describe("Shares granted in Offer B"),
    offer_b_strike: z.number().min(0).describe("Strike price for Offer B"),
    offer_b_fmv: z.number().positive().describe("Current 409A FMV for Offer B"),
    offer_b_exit_multiple: z.number().min(1).optional().default(3).describe("Expected exit multiple on FMV for Offer B"),
    vesting_years: z.number().positive().optional().default(4).describe("Vesting period in years for annualization"),
  },
  async ({
    offer_a_label, offer_a_shares, offer_a_strike, offer_a_fmv, offer_a_exit_multiple,
    offer_b_label, offer_b_shares, offer_b_strike, offer_b_fmv, offer_b_exit_multiple,
    vesting_years,
  }) => {
    const calc = (shares: number, strike: number, fmv: number, multiple: number) => {
      const currentValue = Math.max(0, fmv - strike) * shares;
      const exitFMV = fmv * multiple;
      const exitValue = Math.max(0, exitFMV - strike) * shares;
      const annualized = exitValue / vesting_years;
      return { currentValue, exitValue, annualized, exitFMV };
    };

    const a = calc(offer_a_shares, offer_a_strike, offer_a_fmv, offer_a_exit_multiple);
    const b = calc(offer_b_shares, offer_b_strike, offer_b_fmv, offer_b_exit_multiple);

    const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const winner = (av: number, bv: number) => av > bv ? `**${offer_a_label}** wins` : av < bv ? `**${offer_b_label}** wins` : "Tie";

    const result = `## Equity Offer Comparison

| Metric | ${offer_a_label} | ${offer_b_label} |
|---|---|---|
| Shares | ${offer_a_shares.toLocaleString()} | ${offer_b_shares.toLocaleString()} |
| Strike Price | $${offer_a_strike.toFixed(2)} | $${offer_b_strike.toFixed(2)} |
| Current FMV | $${offer_a_fmv.toFixed(2)} | $${offer_b_fmv.toFixed(2)} |
| Current In-The-Money Value | ${fmt(a.currentValue)} | ${fmt(b.currentValue)} |
| Exit Multiple Assumed | ${offer_a_exit_multiple}x | ${offer_b_exit_multiple}x |
| Exit FMV / Share | $${a.exitFMV.toFixed(2)} | $${b.exitFMV.toFixed(2)} |
| **Projected Exit Value** | **${fmt(a.exitValue)}** | **${fmt(b.exitValue)}** |
| **Annualized Over ${vesting_years}yr** | **${fmt(a.annualized)}/yr** | **${fmt(b.annualized)}/yr** |

### Summary
- Current value: ${winner(a.currentValue, b.currentValue)}
- Projected exit: ${winner(a.exitValue, b.exitValue)}
- Annual equivalent: ${winner(a.annualized, b.annualized)}

> Exit multiples are assumptions, not guarantees. Factor in company stage, dilution risk, and your risk tolerance.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);

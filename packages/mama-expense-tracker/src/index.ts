#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MAMA_CTA = `\n---\n💡 Want this automated 24/7? Join MAMA private beta → mama.oliwoods.com/beta\n📱 Already in? /mama in Slack to activate this agent`;

const server = new McpServer({
  name: "mama-expense-tracker",
  version: "1.0.0",
});

const TransactionSchema = z.object({
  vendor: z.string().describe("Vendor or merchant name"),
  amount: z.number().describe("Transaction amount in USD"),
  date: z.string().optional().describe("Transaction date"),
  description: z.string().optional().describe("Additional description"),
});

// ── categorize_transaction ────────────────────────────────────────────────────
server.tool(
  "categorize_transaction",
  "Categorize a transaction and flag whether it is likely tax-deductible for a business",
  {
    vendor: z.string().describe("Vendor or merchant name"),
    amount: z.number().describe("Transaction amount in USD"),
    description: z.string().optional().describe("Transaction description or memo"),
    business_type: z.string().optional().describe("Your business type for context (e.g. 'freelance consultant', 'e-commerce')"),
  },
  async ({ vendor, amount, description, business_type }) => {
    const vendorLower = (vendor + " " + (description ?? "")).toLowerCase();

    type CategoryInfo = {
      category: string;
      subcategory: string;
      deductible: boolean;
      deductible_pct: number;
      notes: string;
      irs_schedule: string;
    };

    const categoryRules: { pattern: RegExp; info: CategoryInfo }[] = [
      { pattern: /amazon|shopify|alibaba|costco|staples|office depot|walmart/i, info: { category: "Office Supplies", subcategory: "Business Supplies", deductible: true, deductible_pct: 100, notes: "Keep receipt; must be used exclusively for business", irs_schedule: "Schedule C, Line 22" } },
      { pattern: /adobe|slack|notion|figma|github|aws|google cloud|azure|zoom|asana|hubspot|salesforce|quickbooks|docusign|dropbox|1password/i, info: { category: "Software & SaaS", subcategory: "Business Tools", deductible: true, deductible_pct: 100, notes: "100% deductible if used for business", irs_schedule: "Schedule C, Line 18" } },
      { pattern: /delta|united|american airlines|southwest|jetblue|spirit|alaska air|lufthansa|british airways/i, info: { category: "Travel", subcategory: "Airfare", deductible: true, deductible_pct: 100, notes: "Must be for business travel; document business purpose", irs_schedule: "Schedule C, Line 24a" } },
      { pattern: /marriott|hilton|hyatt|airbnb|vrbo|holiday inn|sheraton|westin/i, info: { category: "Travel", subcategory: "Lodging", deductible: true, deductible_pct: 100, notes: "Business travel lodging; personal travel not deductible", irs_schedule: "Schedule C, Line 24a" } },
      { pattern: /uber|lyft|taxi|grab|bolt|car rental|enterprise|hertz|avis|national car/i, info: { category: "Travel", subcategory: "Ground Transportation", deductible: true, deductible_pct: 100, notes: "Business travel only; commuting is not deductible", irs_schedule: "Schedule C, Line 24a" } },
      { pattern: /starbucks|coffee|dunkin|panera|chipotle|mcdonalds|restaurant|cafe|diner|bistro|grill|steakhouse|sushi|pizza|burger|taco/i, info: { category: "Meals", subcategory: "Business Meals", deductible: true, deductible_pct: 50, notes: "50% deductible; must have business purpose and document attendees", irs_schedule: "Schedule C, Line 24b" } },
      { pattern: /at&t|verizon|t-mobile|sprint|comcast|xfinity|spectrum|cox|landline|phone plan/i, info: { category: "Utilities", subcategory: "Phone & Internet", deductible: true, deductible_pct: 50, notes: "Deduct business-use percentage; estimate if used for both personal and business", irs_schedule: "Schedule C, Line 25" } },
      { pattern: /google ads|meta ads|facebook ads|instagram ads|linkedin ads|twitter ads|tiktok ads|youtube ads|bing ads/i, info: { category: "Advertising", subcategory: "Digital Advertising", deductible: true, deductible_pct: 100, notes: "100% deductible for business advertising", irs_schedule: "Schedule C, Line 8" } },
      { pattern: /fedex|ups|usps|dhl|postage|shipping/i, info: { category: "Shipping & Postage", subcategory: "Shipping", deductible: true, deductible_pct: 100, notes: "Business shipping is 100% deductible", irs_schedule: "Schedule C, Line 21" } },
      { pattern: /bank|wire transfer fee|overdraft|monthly fee|paypal|stripe|square|venmo business/i, info: { category: "Bank & Payment Fees", subcategory: "Financial Fees", deductible: true, deductible_pct: 100, notes: "Business bank fees and payment processing fees are deductible", irs_schedule: "Schedule C, Line 27a" } },
      { pattern: /coursera|udemy|linkedin learning|skillshare|pluralsight|masterclass|bootcamp|conference|seminar|training|workshop/i, info: { category: "Education & Training", subcategory: "Professional Development", deductible: true, deductible_pct: 100, notes: "Must maintain/improve skills in current job; not deductible for new career", irs_schedule: "Schedule C, Line 27a" } },
      { pattern: /health insurance|medical|dental|vision|pharmacy|cvs|walgreens|hospital|doctor|copay/i, info: { category: "Health Insurance", subcategory: "Medical", deductible: true, deductible_pct: 100, notes: "Self-employed health insurance premiums are 100% deductible (above the line)", irs_schedule: "Schedule 1, Line 17" } },
      { pattern: /netflix|spotify|hulu|disney|apple tv|hbo|entertainment|concert|game|steam|playstation|xbox/i, info: { category: "Entertainment", subcategory: "Personal Entertainment", deductible: false, deductible_pct: 0, notes: "Personal entertainment is not deductible unless it directly promotes your business", irs_schedule: "N/A — personal expense" } },
      { pattern: /grocery|trader joe|whole foods|kroger|safeway|publix|target grocery|costco food/i, info: { category: "Groceries", subcategory: "Personal Food", deductible: false, deductible_pct: 0, notes: "Personal groceries are not deductible", irs_schedule: "N/A — personal expense" } },
      { pattern: /mortgage|rent|lease|property|hoa/i, info: { category: "Rent / Mortgage", subcategory: "Housing", deductible: false, deductible_pct: 0, notes: "Personal housing not deductible; home office deduction applies to business-use portion only", irs_schedule: "Schedule C, Line 30 (home office only)" } },
    ];

    let matched: CategoryInfo | null = null;
    for (const rule of categoryRules) {
      if (rule.pattern.test(vendorLower)) {
        matched = rule.info;
        break;
      }
    }

    if (!matched) {
      matched = {
        category: "Uncategorized",
        subcategory: "Review Required",
        deductible: false,
        deductible_pct: 0,
        notes: "Could not auto-categorize. Review manually to determine if business-related.",
        irs_schedule: "Review with accountant",
      };
    }

    const deductibleAmount = amount * (matched.deductible_pct / 100);

    const result = `## 🏷️ Transaction Categorized

| Field | Value |
|-------|-------|
| **Vendor** | ${vendor} |
| **Amount** | $${amount.toFixed(2)} |
| **Category** | ${matched.category} |
| **Subcategory** | ${matched.subcategory} |
| **Tax Deductible** | ${matched.deductible ? `✅ Yes (${matched.deductible_pct}%)` : "❌ No"} |
| **Deductible Amount** | ${matched.deductible ? `$${deductibleAmount.toFixed(2)}` : "$0.00"} |
| **IRS Schedule** | ${matched.irs_schedule} |
${business_type ? `| **Business Type** | ${business_type} |` : ""}

### Deductibility Note
${matched.notes}

### Record-Keeping Reminder
${matched.deductible ? `- Save the receipt or statement for this transaction\n- Note the business purpose: "[describe why this was a business expense]"\n- Amounts over $250 require written documentation for IRS purposes` : `- This appears to be a personal expense and is not deductible\n- If there is a legitimate business purpose, document it and consult a CPA`}
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── budget_check ──────────────────────────────────────────────────────────────
server.tool(
  "budget_check",
  "Compare actual spending to budget by category and surface over/under budget alerts",
  {
    spending: z.array(z.object({
      category: z.string(),
      actual: z.number(),
    })).describe("Actual spending by category"),
    budget: z.array(z.object({
      category: z.string(),
      budgeted: z.number(),
    })).describe("Budgeted amounts by category"),
    period: z.string().optional().default("This Month").describe("Time period for the budget (e.g. 'Q1 2024', 'March 2024')"),
    currency: z.string().optional().default("USD").describe("Currency code"),
  },
  async ({ spending, budget, period, currency }) => {
    const sym = currency === "USD" ? "$" : currency;

    // Merge spending and budget
    const budgetMap = Object.fromEntries(budget.map((b) => [b.category, b.budgeted]));
    const spendMap = Object.fromEntries(spending.map((s) => [s.category, s.actual]));

    const allCategories = [...new Set([...Object.keys(budgetMap), ...Object.keys(spendMap)])];

    const rows = allCategories.map((cat) => {
      const actual = spendMap[cat] ?? 0;
      const budgeted = budgetMap[cat] ?? 0;
      const variance = budgeted - actual;
      const pct = budgeted > 0 ? (actual / budgeted) * 100 : null;

      let status = "⬜ No Budget";
      if (budgeted > 0) {
        status = pct! > 100 ? "🔴 Over" : pct! > 85 ? "🟡 Warning" : "🟢 On Track";
      }

      return { cat, actual, budgeted, variance, pct, status };
    });

    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const totalBudget = rows.reduce((s, r) => s + r.budgeted, 0);
    const totalVariance = totalBudget - totalActual;
    const overCategories = rows.filter((r) => r.status === "🔴 Over");
    const warningCategories = rows.filter((r) => r.status === "🟡 Warning");

    const result = `## 📊 Budget Check: ${period}

### Summary
| Metric | Amount |
|--------|--------|
| Total Budget | ${sym}${totalBudget.toFixed(2)} |
| Total Actual | ${sym}${totalActual.toFixed(2)} |
| Variance | ${totalVariance >= 0 ? "+" : ""}${sym}${Math.abs(totalVariance).toFixed(2)} ${totalVariance >= 0 ? "✅ Under Budget" : "⚠️ Over Budget"} |

### Category Breakdown
| Category | Budget | Actual | Variance | % Used | Status |
|----------|--------|--------|----------|--------|--------|
${rows.map((r) => `| ${r.cat} | ${sym}${r.budgeted.toFixed(2)} | ${sym}${r.actual.toFixed(2)} | ${r.variance >= 0 ? "+" : ""}${sym}${Math.abs(r.variance).toFixed(2)} | ${r.pct !== null ? r.pct.toFixed(0) + "%" : "—"} | ${r.status} |`).join("\n")}
| **TOTAL** | **${sym}${totalBudget.toFixed(2)}** | **${sym}${totalActual.toFixed(2)}** | **${totalVariance >= 0 ? "+" : ""}${sym}${Math.abs(totalVariance).toFixed(2)}** | **${totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(0) + "%" : "—"}** | |

${overCategories.length > 0 ? `### 🔴 Over Budget (Action Required)\n${overCategories.map((r) => `- **${r.cat}**: ${sym}${r.actual.toFixed(2)} spent vs. ${sym}${r.budgeted.toFixed(2)} budget (${((r.actual / r.budgeted) * 100).toFixed(0)}%)`).join("\n")}\n` : ""}

${warningCategories.length > 0 ? `### 🟡 Warning (Approaching Limit)\n${warningCategories.map((r) => `- **${r.cat}**: ${r.pct?.toFixed(0)}% used — ${sym}${Math.abs(r.variance).toFixed(2)} remaining`).join("\n")}\n` : ""}

### Recommendations
${overCategories.length > 0 ? `- Review ${overCategories[0].cat} spending to identify savings\n- Consider adjusting budget or reducing discretionary spend in over-budget categories` : "- Spending is within budget — great discipline!"}
- ${totalVariance > 0 ? `${sym}${totalVariance.toFixed(2)} of budget remains — consider reallocating to investment or savings` : `Consider reducing spending in over-budget categories next ${period.includes("Month") ? "month" : "period"}`}
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── spending_report ───────────────────────────────────────────────────────────
server.tool(
  "spending_report",
  "Generate a spending summary with category breakdown and chart-ready data from a list of transactions",
  {
    transactions: z.array(TransactionSchema).describe("List of transactions with vendor, amount, and optionally date and description"),
    period: z.string().optional().default("Current Period").describe("Reporting period label"),
    currency: z.string().optional().default("USD"),
    group_by: z.enum(["category", "vendor", "week"]).optional().default("category").describe("How to group the summary"),
  },
  async ({ transactions, period, currency, group_by }) => {
    const sym = currency === "USD" ? "$" : currency;

    // Auto-categorize using simple vendor keyword matching
    const categorize = (vendor: string): string => {
      const v = vendor.toLowerCase();
      if (/amazon|costco|staples|office/.test(v)) return "Office Supplies";
      if (/adobe|slack|notion|github|aws|zoom|google|microsoft|saas|software/.test(v)) return "Software & SaaS";
      if (/airline|hotel|airbnb|uber|lyft|taxi|rental|marriott|hilton/.test(v)) return "Travel";
      if (/restaurant|cafe|coffee|starbucks|doordash|grubhub|uber eats|food/.test(v)) return "Meals";
      if (/google ads|meta ads|facebook ads|advertising|marketing/.test(v)) return "Advertising";
      if (/bank|fee|stripe|paypal|square|processing/.test(v)) return "Fees";
      if (/phone|internet|at&t|verizon|comcast|utility/.test(v)) return "Utilities";
      if (/health|medical|dental|insurance|pharmacy/.test(v)) return "Health";
      return "Other";
    };

    const tagged = transactions.map((t) => ({ ...t, category: categorize(t.vendor) }));
    const total = transactions.reduce((s, t) => s + t.amount, 0);

    if (group_by === "category") {
      const byCategory: Record<string, number> = {};
      for (const t of tagged) {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      }

      const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      const chartData = sorted.map(([cat, amt]) => ({
        label: cat, value: parseFloat(amt.toFixed(2)), pct: parseFloat(((amt / total) * 100).toFixed(1)),
      }));

      const result = `## 💰 Spending Report: ${period}

**Total Transactions:** ${transactions.length}
**Total Spend:** ${sym}${total.toFixed(2)}

### By Category
| Category | Amount | % of Total | Bar |
|----------|--------|-----------|-----|
${sorted.map(([cat, amt]) => {
  const pct = (amt / total) * 100;
  const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
  return `| ${cat} | ${sym}${amt.toFixed(2)} | ${pct.toFixed(1)}% | ${bar} |`;
}).join("\n")}

### Chart Data (JSON)
\`\`\`json
${JSON.stringify(chartData, null, 2)}
\`\`\`

### Top Transactions
${transactions.sort((a, b) => b.amount - a.amount).slice(0, 5).map((t, i) => `${i + 1}. **${t.vendor}** — ${sym}${t.amount.toFixed(2)}${t.date ? ` (${t.date})` : ""}`).join("\n")}

### Insights
- Largest category: **${sorted[0]?.[0]}** at ${sym}${sorted[0]?.[1].toFixed(2)} (${((sorted[0]?.[1] ?? 0) / total * 100).toFixed(1)}%)
- Average transaction: ${sym}${(total / transactions.length).toFixed(2)}
- ${sorted.filter(([, amt]) => amt / total > 0.3).map(([cat]) => `${cat} is a high concentration (>30%) — review for savings`).join("; ") || "Spending is diversified across categories"}
${MAMA_CTA}`;

      return { content: [{ type: "text", text: result }] };
    } else if (group_by === "vendor") {
      const byVendor: Record<string, { total: number; count: number }> = {};
      for (const t of tagged) {
        if (!byVendor[t.vendor]) byVendor[t.vendor] = { total: 0, count: 0 };
        byVendor[t.vendor].total += t.amount;
        byVendor[t.vendor].count += 1;
      }
      const sorted = Object.entries(byVendor).sort((a, b) => b[1].total - a[1].total);

      const result = `## 💰 Spending Report by Vendor: ${period}

**Total Spend:** ${sym}${total.toFixed(2)} across ${Object.keys(byVendor).length} vendors

### Top Vendors
| Vendor | Total Spend | Transactions | Avg |
|--------|-------------|-------------|-----|
${sorted.map(([v, d]) => `| ${v} | ${sym}${d.total.toFixed(2)} | ${d.count} | ${sym}${(d.total / d.count).toFixed(2)} |`).join("\n")}

### Chart Data (JSON)
\`\`\`json
${JSON.stringify(sorted.slice(0, 10).map(([label, d]) => ({ label, value: parseFloat(d.total.toFixed(2)) })), null, 2)}
\`\`\`
${MAMA_CTA}`;

      return { content: [{ type: "text", text: result }] };
    } else {
      // group by week
      const byWeek: Record<string, number> = {};
      for (const t of transactions) {
        const week = t.date ? `Week of ${t.date.slice(0, 7)}` : "Undated";
        byWeek[week] = (byWeek[week] ?? 0) + t.amount;
      }

      const result = `## 💰 Spending Report by Week: ${period}

**Total Spend:** ${sym}${total.toFixed(2)}

### Weekly Breakdown
| Week | Amount |
|------|--------|
${Object.entries(byWeek).map(([w, a]) => `| ${w} | ${sym}${a.toFixed(2)} |`).join("\n")}
${MAMA_CTA}`;

      return { content: [{ type: "text", text: result }] };
    }
  }
);

// ── vendor_analysis ───────────────────────────────────────────────────────────
server.tool(
  "vendor_analysis",
  "Analyze transaction history to surface top vendors, spending trends, and savings opportunities",
  {
    transactions: z.array(TransactionSchema).describe("List of transactions"),
    top_n: z.number().optional().default(10).describe("Number of top vendors to surface"),
    flag_recurring: z.boolean().optional().default(true).describe("Flag vendors with recurring-looking charges"),
    currency: z.string().optional().default("USD"),
  },
  async ({ transactions, top_n, flag_recurring, currency }) => {
    const sym = currency === "USD" ? "$" : currency;

    const byVendor: Record<string, { total: number; count: number; amounts: number[]; dates: string[] }> = {};
    for (const t of transactions) {
      const v = t.vendor;
      if (!byVendor[v]) byVendor[v] = { total: 0, count: 0, amounts: [], dates: [] };
      byVendor[v].total += t.amount;
      byVendor[v].count += 1;
      byVendor[v].amounts.push(t.amount);
      if (t.date) byVendor[v].dates.push(t.date);
    }

    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const sorted = Object.entries(byVendor).sort((a, b) => b[1].total - a[1].total).slice(0, top_n);

    const recurring = flag_recurring
      ? sorted.filter(([, d]) => d.count >= 2 || (d.amounts.length > 1 && new Set(d.amounts.map((a) => a.toFixed(2))).size === 1))
      : [];

    const savingsOps: string[] = [];
    for (const [v, d] of sorted) {
      if (d.count > 3 && d.total > 500) savingsOps.push(`Negotiate annual contract or volume discount with **${v}** (${sym}${d.total.toFixed(2)} total, ${d.count} transactions)`);
      if (/subscription|saas|cloud|monthly/i.test(v) && d.count >= 2) savingsOps.push(`Review if **${v}** subscription is actively used — common source of waste`);
    }
    if (savingsOps.length === 0) savingsOps.push("No obvious savings opportunities detected — spending looks lean");

    const result = `## 🔬 Vendor Analysis

**Total Spend Analyzed:** ${sym}${total.toFixed(2)} across ${transactions.length} transactions, ${Object.keys(byVendor).length} unique vendors

### Top ${top_n} Vendors by Spend
| Rank | Vendor | Total | Txns | Avg | % of Total |
|------|--------|-------|------|-----|-----------|
${sorted.map(([v, d], i) => `| ${i + 1} | ${v} | ${sym}${d.total.toFixed(2)} | ${d.count} | ${sym}${(d.total / d.count).toFixed(2)} | ${((d.total / total) * 100).toFixed(1)}% |`).join("\n")}

${recurring.length > 0 ? `### 🔁 Likely Recurring Charges\n${recurring.map(([v, d]) => `- **${v}**: ${d.count}x charges, avg ${sym}${(d.total / d.count).toFixed(2)}/occurrence`).join("\n")}\n` : ""}

### 💡 Savings Opportunities
${savingsOps.map((s) => `- ${s}`).join("\n")}

### Vendor Concentration
- Top vendor accounts for ${sorted[0] ? ((sorted[0][1].total / total) * 100).toFixed(1) : 0}% of total spend
- Top 3 vendors account for ${sorted.slice(0, 3).reduce((s, [, d]) => s + d.total, 0) / total * 100 > 0 ? (sorted.slice(0, 3).reduce((s, [, d]) => s + d.total, 0) / total * 100).toFixed(1) : 0}% of total spend
- ${sorted.length < 5 ? "High vendor concentration — consider diversifying suppliers to reduce risk" : "Healthy vendor diversification"}
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── split_expense ─────────────────────────────────────────────────────────────
server.tool(
  "split_expense",
  "Split a receipt or expense among participants with flexible split options",
  {
    total_amount: z.number().describe("Total receipt amount"),
    participants: z.array(z.object({
      name: z.string().describe("Participant name"),
      items: z.array(z.string()).optional().describe("Items ordered by this person (for itemized split)"),
      custom_pct: z.number().optional().describe("Custom percentage for this person (0–100)"),
    })).describe("List of participants"),
    split_type: z.enum(["equal", "percentage", "itemized"]).optional().default("equal").describe("How to split the bill"),
    tax_pct: z.number().optional().default(0).describe("Tax percentage to add (e.g. 8.5 for 8.5%)"),
    tip_pct: z.number().optional().default(0).describe("Tip percentage to add (e.g. 20 for 20%)"),
    currency: z.string().optional().default("USD"),
  },
  async ({ total_amount, participants, split_type, tax_pct, tip_pct, currency }) => {
    const sym = currency === "USD" ? "$" : currency;
    const subtotal = total_amount;
    const taxAmt = subtotal * (tax_pct / 100);
    const tipAmt = subtotal * (tip_pct / 100);
    const grandTotal = subtotal + taxAmt + tipAmt;

    const splits: { name: string; amount: number; pct: number }[] = [];

    if (split_type === "equal") {
      const perPerson = grandTotal / participants.length;
      for (const p of participants) {
        splits.push({ name: p.name, amount: perPerson, pct: 100 / participants.length });
      }
    } else if (split_type === "percentage") {
      const totalPct = participants.reduce((s, p) => s + (p.custom_pct ?? 0), 0);
      const normalizer = totalPct > 0 ? 100 / totalPct : 1;
      for (const p of participants) {
        const pct = ((p.custom_pct ?? 0) * normalizer);
        splits.push({ name: p.name, amount: grandTotal * (pct / 100), pct });
      }
    } else {
      // itemized — equal split for simplicity when no item prices
      const perPerson = grandTotal / participants.length;
      for (const p of participants) {
        const itemNote = p.items && p.items.length > 0 ? ` (${p.items.join(", ")})` : "";
        splits.push({ name: `${p.name}${itemNote}`, amount: perPerson, pct: 100 / participants.length });
      }
    }

    const paymentLinks = [
      "Venmo: @[username]",
      "Zelle: [phone or email]",
      "Cash App: $[cashtag]",
      "PayPal: [email]",
    ];

    const result = `## 🧾 Expense Split

### Receipt Summary
| | Amount |
|-|--------|
| Subtotal | ${sym}${subtotal.toFixed(2)} |
${tax_pct > 0 ? `| Tax (${tax_pct}%) | ${sym}${taxAmt.toFixed(2)} |` : ""}
${tip_pct > 0 ? `| Tip (${tip_pct}%) | ${sym}${tipAmt.toFixed(2)} |` : ""}
| **Grand Total** | **${sym}${grandTotal.toFixed(2)}** |

### Split: ${split_type} (${participants.length} people)
| Person | Amount | % |
|--------|--------|---|
${splits.map((s) => `| ${s.name} | **${sym}${s.amount.toFixed(2)}** | ${s.pct.toFixed(1)}% |`).join("\n")}

### Payment Request Messages
${splits.map((s) => `📲 **${s.name.split(" ")[0]}** owes **${sym}${s.amount.toFixed(2)}** — [send via Venmo/Zelle/CashApp]`).join("\n")}

### Payment Options
${paymentLinks.map((l) => `- ${l}`).join("\n")}

> 💡 Tip: Apps like Splitwise or Tab automatically track who's paid and send reminders
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MAMA Expense Tracker MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

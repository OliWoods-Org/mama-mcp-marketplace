#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const MAMA_CTA = `\n---\n💡 Want this automated 24/7? Join MAMA private beta → mama.oliwoods.com/beta\n📱 Already in? /mama in Slack to activate this agent`;
const server = new McpServer({
    name: "mama-tax-prep",
    version: "1.0.0",
});
// ── receipt_scanner ──────────────────────────────────────────────────────────
server.tool("receipt_scanner", "Extract structured data from raw receipt text: vendor, date, line items, subtotal, tax, and total", {
    receipt_text: z.string().describe("Raw text content pasted or OCR'd from a receipt"),
    currency: z.string().optional().default("USD").describe("Currency code (default: USD)"),
}, async ({ receipt_text, currency }) => {
    const lines = receipt_text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    // Heuristic extraction helpers
    const findAmount = (text) => {
        const m = text.match(/[\$£€]?\s*(\d{1,6}[.,]\d{2})/);
        return m ? parseFloat(m[1].replace(",", ".")) : null;
    };
    const findDate = (text) => {
        const m = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b/i);
        return m ? m[1] : null;
    };
    const vendor = lines[0] ?? "Unknown Vendor";
    const date = lines.map(findDate).find(Boolean) ?? "Date not found";
    const amountLines = [];
    let subtotal = null;
    let tax = null;
    let total = null;
    for (const line of lines) {
        const lower = line.toLowerCase();
        const amount = findAmount(line);
        if (amount === null)
            continue;
        if (/subtotal|sub-total/.test(lower)) {
            subtotal = amount;
            continue;
        }
        if (/\btax\b|gst|vat|hst/.test(lower)) {
            tax = amount;
            continue;
        }
        if (/total|amount due|balance/.test(lower)) {
            total = amount;
            continue;
        }
        if (amount > 0)
            amountLines.push({ description: line.replace(/[\$£€]?\s*\d{1,6}[.,]\d{2}/, "").trim(), amount });
    }
    const computedSubtotal = subtotal ?? amountLines.reduce((s, i) => s + i.amount, 0);
    const computedTotal = total ?? (computedSubtotal + (tax ?? 0));
    const result = `## 🧾 Receipt Scan Results

**Vendor:** ${vendor}
**Date:** ${date}
**Currency:** ${currency}

### Line Items
${amountLines.length > 0
        ? amountLines.map((i) => `- ${i.description || "Item"}: ${currency} ${i.amount.toFixed(2)}`).join("\n")
        : "- No individual line items detected"}

### Totals
- **Subtotal:** ${currency} ${computedSubtotal.toFixed(2)}
- **Tax:** ${currency} ${(tax ?? 0).toFixed(2)}
- **Total:** ${currency} ${computedTotal.toFixed(2)}

### Business Use Tips
- Save this receipt with your accounting records
- Note the business purpose on the receipt
- Receipts under $75 may not require documentation for IRS purposes (but keep them anyway)
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── deduction_finder ─────────────────────────────────────────────────────────
server.tool("deduction_finder", "Find applicable tax deductions based on profession or business type", {
    profession: z.string().describe("Profession or business type (e.g. 'freelance designer', 'real estate agent', 'software consultant')"),
    annual_revenue: z.number().optional().describe("Approximate annual revenue in USD for context"),
    work_from_home: z.boolean().optional().default(false).describe("Whether you work from home"),
}, async ({ profession, annual_revenue, work_from_home }) => {
    const prof = profession.toLowerCase();
    const universalDeductions = [
        { name: "Health Insurance Premiums", notes: "Self-employed can deduct 100% of premiums" },
        { name: "Self-Employment Tax Deduction", notes: "Deduct 50% of SE tax from gross income" },
        { name: "Retirement Contributions (SEP-IRA / Solo 401k)", notes: `Up to $66,000/yr or 25% of net earnings` },
        { name: "Professional Development & Education", notes: "Courses, books, subscriptions related to your field" },
        { name: "Business Phone & Internet", notes: "Deduct the business-use percentage" },
        { name: "Professional Memberships & Dues", notes: "Industry associations, licensing fees" },
        { name: "Business Bank Fees", notes: "Monthly fees, wire transfers for business accounts" },
        { name: "Accounting & Legal Fees", notes: "Tax preparation, business attorney fees" },
    ];
    const homeOfficeDeductions = work_from_home
        ? [
            { name: "Home Office Deduction", notes: "Simplified: $5/sq ft up to 300 sq ft. Regular method: % of actual home expenses" },
            { name: "Home Office Utilities", notes: "Proportional electricity, heat, internet" },
            { name: "Home Office Depreciation", notes: "Applies if using regular method" },
        ]
        : [];
    const professionDeductions = [];
    if (/design|creative|artist|photographer|videograph/.test(prof)) {
        professionDeductions.push({ name: "Adobe Creative Cloud / Design Software", notes: "100% deductible subscription" }, { name: "Camera, Lighting, Studio Equipment", notes: "Section 179 or depreciation" }, { name: "Stock Assets & Fonts", notes: "Purchased assets for client work" }, { name: "Portfolio Website & Hosting", notes: "Domain, hosting, website builder" });
    }
    if (/software|developer|engineer|tech|programmer/.test(prof)) {
        professionDeductions.push({ name: "Computer Hardware & Monitors", notes: "Section 179 expensing up to $1.16M" }, { name: "SaaS Tools & Developer Subscriptions", notes: "GitHub, AWS, JetBrains, etc." }, { name: "Cloud Services & Hosting", notes: "Production infrastructure costs" }, { name: "Technical Books & Online Courses", notes: "Udemy, Coursera, O'Reilly, etc." });
    }
    if (/real estate|realtor|broker/.test(prof)) {
        professionDeductions.push({ name: "MLS & Board Dues", notes: "National, state, and local association fees" }, { name: "Vehicle Use for Showings", notes: "Mileage at $0.67/mile (2024 rate)" }, { name: "Marketing & Advertising", notes: "Zillow, Realtor.com, yard signs, print" }, { name: "E&O Insurance", notes: "Errors & omissions professional liability" });
    }
    if (/consultant|advisor|coach|trainer/.test(prof)) {
        professionDeductions.push({ name: "Client Entertainment (50%)", notes: "Business meals are 50% deductible" }, { name: "Travel to Client Sites", notes: "Flights, hotels, car rentals" }, { name: "Proposal & Contract Tools", notes: "DocuSign, Proposify, Notion" }, { name: "CRM & Sales Tools", notes: "HubSpot, Pipedrive, etc." });
    }
    if (/writer|content|copywriter|journalist|blogger/.test(prof)) {
        professionDeductions.push({ name: "Research Materials & Subscriptions", notes: "Newspapers, journals, databases" }, { name: "Writing Software", notes: "Scrivener, Grammarly, Hemingway Editor" }, { name: "Domain & Blog Hosting", notes: "Personal publishing platform" });
    }
    const all = [...universalDeductions, ...homeOfficeDeductions, ...professionDeductions];
    const revenueNote = annual_revenue
        ? `\n> Based on ~$${annual_revenue.toLocaleString()} revenue, these deductions could meaningfully reduce your taxable income.`
        : "";
    const result = `## 💰 Tax Deductions for: ${profession}
${revenueNote}

### Universal Self-Employment Deductions
${universalDeductions.map((d) => `- **${d.name}** – ${d.notes}`).join("\n")}

${homeOfficeDeductions.length > 0 ? `### 🏠 Home Office Deductions\n${homeOfficeDeductions.map((d) => `- **${d.name}** – ${d.notes}`).join("\n")}\n` : ""}
### 🎯 Profession-Specific: ${profession}
${professionDeductions.length > 0
        ? professionDeductions.map((d) => `- **${d.name}** – ${d.notes}`).join("\n")
        : "- Review IRS Publication 535 for additional industry-specific deductions"}

### Next Steps
1. Open a dedicated business checking account to separate expenses
2. Use accounting software (QuickBooks, Wave) to categorize automatically
3. Keep receipts for all deductions over $75
4. Consult a CPA to confirm deductions for your specific situation
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── quarterly_estimate ───────────────────────────────────────────────────────
server.tool("quarterly_estimate", "Calculate quarterly estimated tax payments for self-employed individuals", {
    annual_net_profit: z.number().describe("Expected annual net profit (revenue minus expenses) in USD"),
    filing_status: z.enum(["single", "married_filing_jointly", "married_filing_separately", "head_of_household"]).optional().default("single"),
    state: z.string().optional().describe("Two-letter US state code for state tax estimate (e.g. CA, TX, NY)"),
    prior_year_tax: z.number().optional().describe("Prior year total tax liability (for safe harbor calculation)"),
}, async ({ annual_net_profit, filing_status, state, prior_year_tax }) => {
    // Federal income tax brackets 2024 (single)
    const brackets = {
        single: [[0, 11600, 0.10], [11600, 47150, 0.12], [47150, 100525, 0.22], [100525, 191950, 0.24], [191950, 243725, 0.32], [243725, 609350, 0.35], [609350, Infinity, 0.37]],
        married_filing_jointly: [[0, 23200, 0.10], [23200, 94300, 0.12], [94300, 201050, 0.22], [201050, 383900, 0.24], [383900, 487450, 0.32], [487450, 731200, 0.35], [731200, Infinity, 0.37]],
        married_filing_separately: [[0, 11600, 0.10], [11600, 47150, 0.12], [47150, 100525, 0.22], [100525, 191950, 0.24], [191950, 243725, 0.32], [243725, 365600, 0.35], [365600, Infinity, 0.37]],
        head_of_household: [[0, 16550, 0.10], [16550, 63100, 0.12], [63100, 100500, 0.22], [100500, 191950, 0.24], [191950, 243700, 0.32], [243700, 609350, 0.35], [609350, Infinity, 0.37]],
    };
    const standardDeductions = {
        single: 14600,
        married_filing_jointly: 29200,
        married_filing_separately: 14600,
        head_of_household: 21900,
    };
    // SE tax: 15.3% on 92.35% of net profit (capped at $168,600 for SS)
    const netEarnings = annual_net_profit * 0.9235;
    const ssTax = Math.min(netEarnings, 168600) * 0.124;
    const medicareTax = netEarnings * 0.029;
    const seTax = ssTax + medicareTax;
    const seDeduction = seTax / 2;
    // Federal income tax
    const agi = annual_net_profit - seDeduction;
    const taxableIncome = Math.max(0, agi - (standardDeductions[filing_status] ?? 14600));
    let federalIncomeTax = 0;
    const bracks = brackets[filing_status] ?? brackets.single;
    for (const [low, high, rate] of bracks) {
        if (taxableIncome <= low)
            break;
        federalIncomeTax += (Math.min(taxableIncome, high) - low) * rate;
    }
    const totalFederal = federalIncomeTax + seTax;
    const quarterlyFederal = totalFederal / 4;
    // State tax rough estimate
    const stateRates = {
        CA: 0.093, NY: 0.0685, TX: 0, FL: 0, WA: 0, OR: 0.099,
        IL: 0.0495, PA: 0.0307, NJ: 0.0897, MA: 0.05,
    };
    const stateRate = state ? (stateRates[state.toUpperCase()] ?? 0.05) : null;
    const stateTax = stateRate !== null ? taxableIncome * stateRate : null;
    const quarterlyState = stateTax !== null ? stateTax / 4 : null;
    const safeHarbor = prior_year_tax ? prior_year_tax / 4 : null;
    const recommended = safeHarbor
        ? Math.min(quarterlyFederal, safeHarbor)
        : quarterlyFederal;
    const result = `## 📅 Quarterly Tax Estimate (2024)

**Net Profit:** $${annual_net_profit.toLocaleString()}
**Filing Status:** ${filing_status.replace(/_/g, " ")}

### Federal Tax Breakdown
| Component | Annual | Per Quarter |
|-----------|--------|-------------|
| Self-Employment Tax (15.3%) | $${seTax.toFixed(0)} | $${(seTax / 4).toFixed(0)} |
| Federal Income Tax | $${federalIncomeTax.toFixed(0)} | $${(federalIncomeTax / 4).toFixed(0)} |
| **Total Federal** | **$${totalFederal.toFixed(0)}** | **$${quarterlyFederal.toFixed(0)}** |
${stateTax !== null ? `| State Tax (${state?.toUpperCase()} ~${((stateRate ?? 0) * 100).toFixed(1)}%) | $${stateTax.toFixed(0)} | $${(stateTax / 4).toFixed(0)} |` : ""}

### Recommended Quarterly Payment
${safeHarbor ? `- **Safe Harbor (prior year method):** $${safeHarbor.toFixed(0)}/quarter\n- **Current year estimate:** $${quarterlyFederal.toFixed(0)}/quarter\n- **Recommended (lower of two):** $${recommended.toFixed(0)}/quarter` : `- **Pay:** $${quarterlyFederal.toFixed(0)}/quarter federal${quarterlyState ? ` + $${quarterlyState.toFixed(0)}/quarter state` : ""}`}

### 2024 Due Dates
- **Q1:** April 15, 2024 (income Jan 1 – Mar 31)
- **Q2:** June 17, 2024 (income Apr 1 – May 31)
- **Q3:** September 16, 2024 (income Jun 1 – Aug 31)
- **Q4:** January 15, 2025 (income Sep 1 – Dec 31)

> ⚠️ This is an estimate. Actual tax will vary based on deductions, credits, and other income. Consult a CPA for your exact liability.
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── mileage_calculator ───────────────────────────────────────────────────────
server.tool("mileage_calculator", "Convert business miles driven into an IRS-compliant tax deduction amount", {
    miles: z.number().describe("Total business miles driven"),
    year: z.number().optional().default(2024).describe("Tax year (affects IRS mileage rate)"),
    trip_log: z.array(z.object({
        date: z.string(),
        from: z.string(),
        to: z.string(),
        purpose: z.string(),
        miles: z.number(),
    })).optional().describe("Optional detailed trip log for documentation"),
}, async ({ miles, year, trip_log }) => {
    const rates = {
        2024: { business: 0.67, medical: 0.21, charity: 0.14 },
        2023: { business: 0.655, medical: 0.22, charity: 0.14 },
        2022: { business: 0.625, medical: 0.22, charity: 0.14 },
    };
    const rate = rates[year] ?? rates[2024];
    const deduction = miles * rate.business;
    const logSection = trip_log && trip_log.length > 0
        ? `\n### Trip Log Summary\n| Date | From | To | Purpose | Miles |\n|------|------|-----|---------|-------|\n${trip_log.map((t) => `| ${t.date} | ${t.from} | ${t.to} | ${t.purpose} | ${t.miles} |`).join("\n")}\n**Total from log:** ${trip_log.reduce((s, t) => s + t.miles, 0)} miles`
        : "";
    const result = `## 🚗 Mileage Deduction Calculator (${year})

| Metric | Value |
|--------|-------|
| Business Miles | ${miles.toLocaleString()} |
| IRS Rate (${year}) | $${rate.business}/mile |
| **Tax Deduction** | **$${deduction.toFixed(2)}** |

### Other IRS Mileage Rates (${year})
- Medical / Moving: $${rate.medical}/mile
- Charitable: $${rate.charity}/mile

### IRS Documentation Requirements
You must keep a contemporaneous mileage log with:
1. **Date** of each trip
2. **Destination** (city or business name)
3. **Business purpose** of the trip
4. **Miles driven** (odometer start/end or map distance)
${logSection}

### Actual Expense vs. Standard Mileage
- **Standard mileage** (used here): simpler, no receipts for gas/repairs
- **Actual expense method**: track all vehicle costs and multiply by business-use %
- You must choose one method at the start — switching has restrictions

> 💡 Tracking tip: Use MileIQ, Everlance, or TripLog to auto-log business mileage
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── tax_calendar ─────────────────────────────────────────────────────────────
server.tool("tax_calendar", "Get upcoming tax deadlines and filing calendar based on entity type", {
    entity_type: z.enum(["sole_proprietor", "llc_single", "llc_multi", "s_corp", "c_corp", "partnership"]).describe("Business entity type"),
    state: z.string().optional().describe("Two-letter US state code for state-specific deadlines"),
    fiscal_year_end: z.string().optional().default("December").describe("Fiscal year end month (default: December)"),
}, async ({ entity_type, state, fiscal_year_end }) => {
    const fyeNote = fiscal_year_end !== "December"
        ? `\n> ⚠️ Non-December fiscal year end (${fiscal_year_end}) — deadlines shift accordingly. Consult IRS Publication 509.`
        : "";
    const deadlines = {
        sole_proprietor: [
            { date: "January 15", form: "1040-ES", description: "Q4 estimated tax payment" },
            { date: "January 31", form: "1099-NEC", description: "Issue 1099s to contractors paid $600+" },
            { date: "April 15", form: "Schedule C + 1040", description: "Annual personal & business return (or extension)" },
            { date: "April 15", form: "1040-ES", description: "Q1 estimated tax payment" },
            { date: "June 16", form: "1040-ES", description: "Q2 estimated tax payment" },
            { date: "September 15", form: "1040-ES", description: "Q3 estimated tax payment" },
            { date: "October 15", form: "1040 (extended)", description: "Extended return deadline" },
        ],
        llc_single: [
            { date: "January 15", form: "1040-ES", description: "Q4 estimated tax payment" },
            { date: "January 31", form: "1099-NEC", description: "Issue 1099s to contractors" },
            { date: "April 15", form: "Schedule C + 1040", description: "Annual return (single-member LLC = disregarded entity)" },
            { date: "April 15", form: "1040-ES", description: "Q1 estimated tax payment" },
            { date: "June 16", form: "1040-ES", description: "Q2 estimated tax payment" },
            { date: "September 15", form: "1040-ES", description: "Q3 estimated tax payment" },
        ],
        llc_multi: [
            { date: "January 15", form: "1040-ES", description: "Q4 estimated payments for each member" },
            { date: "January 31", form: "1099-NEC", description: "Issue 1099s to contractors" },
            { date: "March 15", form: "Form 1065", description: "Partnership return (or 6-month extension)" },
            { date: "March 15", form: "Schedule K-1", description: "Distribute K-1s to all partners/members" },
            { date: "April 15", form: "1040-ES", description: "Q1 estimated tax for members" },
            { date: "September 15", form: "Form 1065 (extended)", description: "Extended partnership return deadline" },
        ],
        s_corp: [
            { date: "January 15", form: "1040-ES", description: "Q4 estimated tax for shareholders" },
            { date: "January 31", form: "W-2 + 1099", description: "W-2s to employees; 1099s to contractors" },
            { date: "February 28", form: "W-2/1099 to IRS", description: "File W-2s and 1099s with IRS (paper)" },
            { date: "March 15", form: "Form 1120-S", description: "S-Corp return (or 6-month extension)" },
            { date: "March 15", form: "Schedule K-1", description: "Distribute K-1s to shareholders" },
            { date: "March 31", form: "W-2/1099 (e-file)", description: "Electronic filing of W-2s and 1099s" },
            { date: "September 15", form: "1120-S (extended)", description: "Extended S-Corp return deadline" },
        ],
        c_corp: [
            { date: "January 15", form: "1120-W", description: "Q4 estimated corporate tax payment" },
            { date: "January 31", form: "W-2 + 1099", description: "Wage statements and contractor forms" },
            { date: "April 15", form: "Form 1120", description: "C-Corp return (or 6-month extension)" },
            { date: "April 15", form: "1120-W", description: "Q1 estimated corporate tax payment" },
            { date: "June 16", form: "1120-W", description: "Q2 estimated corporate tax payment" },
            { date: "September 15", form: "1120-W", description: "Q3 estimated corporate tax payment" },
            { date: "October 15", form: "Form 1120 (extended)", description: "Extended C-Corp return deadline" },
        ],
        partnership: [
            { date: "January 31", form: "1099-NEC", description: "Issue 1099s to contractors paid $600+" },
            { date: "March 15", form: "Form 1065", description: "Partnership return (or 6-month extension)" },
            { date: "March 15", form: "Schedule K-1", description: "Distribute K-1s to all partners" },
            { date: "September 15", form: "Form 1065 (extended)", description: "Extended partnership return deadline" },
        ],
    };
    const list = deadlines[entity_type] ?? deadlines.sole_proprietor;
    const result = `## 📅 Tax Calendar: ${entity_type.replace(/_/g, " ").toUpperCase()}
${state ? `**State:** ${state.toUpperCase()} — check your state revenue department for additional state deadlines\n` : ""}${fyeNote}

### Federal Deadlines (2024 Calendar Year)
| Deadline | Form | Description |
|----------|------|-------------|
${list.map((d) => `| **${d.date}** | ${d.form} | ${d.description} |`).join("\n")}

### Key Reminders
- **Extensions** extend the filing deadline, NOT the payment deadline — you still owe estimated tax by the original due date
- Set calendar reminders 2 weeks before each deadline
- File for an automatic extension using Form 4868 (individuals) or Form 7004 (business entities)
- Payroll taxes (if applicable) are due separately — typically semi-weekly or monthly

### State Considerations
${state
        ? `- Most states follow federal deadlines but verify at your state's department of revenue website\n- Some states require separate state estimated tax payments`
        : "- State deadlines vary — search '[your state] department of revenue tax calendar'"}
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MAMA Tax Prep MCP server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
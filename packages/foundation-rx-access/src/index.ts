#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CTA = `\n---\nOpen source by OliWoods Foundation`;

const server = new McpServer({
  name: "foundation-rx-access",
  version: "1.0.0",
});

// ── search_assistance_programs ───────────────────────────────────────────────
server.tool(
  "search_assistance_programs",
  "Search for patient assistance programs (PAPs), copay cards, and manufacturer discounts for a prescription drug",
  {
    drug_name: z.string().describe("Drug name (brand or generic)"),
    manufacturer: z.string().optional().describe("Manufacturer name if known"),
    condition: z.string().optional().describe("Medical condition being treated"),
    insurance_status: z.enum(["uninsured", "underinsured", "medicaid", "medicare", "commercial"]).optional().default("uninsured"),
  },
  async ({ drug_name, manufacturer, condition, insurance_status }) => {
    const programTypes: Record<string, string[]> = {
      uninsured: ["Manufacturer PAP (free or low-cost drug)", "NeedyMeds database", "RxHope", "Partnership for Prescription Assistance", "State pharmaceutical assistance programs"],
      underinsured: ["Manufacturer copay card", "NeedyMeds copay assistance", "HealthWell Foundation grants", "PAN Foundation"],
      medicaid: ["Medicaid preferred drug list savings", "State supplemental programs", "340B program pharmacies"],
      medicare: ["Medicare Extra Help / LIS", "Medicare Savings Programs", "State SHIP counseling", "Manufacturer Medicare bridge programs"],
      commercial: ["Manufacturer copay card (up to $0 copay)", "Specialty pharmacy savings programs", "Good RX / coupon codes"],
    };

    const programs = programTypes[insurance_status] ?? programTypes["uninsured"];
    const manufacturerNote = manufacturer ? `\n**Manufacturer:** ${manufacturer} — check ${manufacturer.toLowerCase().replace(/\s+/g, "")}.com/patient-assistance` : "";
    const conditionNote = condition ? `\n**Condition-specific foundations:** Search "[${condition}] foundation patient assistance" for disease-specific grants.` : "";

    const result = `## Patient Assistance Programs for ${drug_name}

**Insurance Status:** ${insurance_status}
${manufacturerNote}
${conditionNote}

### Recommended Programs to Apply
${programs.map((p, i) => `${i + 1}. ${p}`).join("\n")}

### Universal Resources
- **NeedyMeds.org** — comprehensive PAP database, free to search
- **RxAssist.org** — directory of manufacturer programs
- **GoodRx.com** — instant coupon codes, no eligibility required
- **Partnership for Prescription Assistance (PPArx)** — 1-888-477-2669

### How to Apply
1. Gather: proof of income, insurance card (or denial letter), prescription, and photo ID
2. Have your prescriber complete the medical certification section
3. Submit directly to the manufacturer or through the program portal
4. Renewals are typically annual — set a reminder 60 days before expiry

> Programs and eligibility criteria change frequently. Verify current requirements directly with each program.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── check_eligibility ────────────────────────────────────────────────────────
server.tool(
  "check_eligibility",
  "Check likely eligibility for patient assistance programs based on household income, size, and insurance status",
  {
    annual_household_income: z.number().min(0).describe("Annual household income in USD"),
    household_size: z.number().int().min(1).describe("Number of people in household"),
    insurance_type: z.enum(["none", "medicaid", "medicare_only", "medicare_part_d", "employer", "marketplace", "other"]).describe("Current insurance coverage"),
    drug_monthly_cost: z.number().min(0).describe("Current monthly out-of-pocket cost for the drug"),
    state: z.string().length(2).optional().describe("Two-letter US state code"),
  },
  async ({ annual_household_income, household_size, insurance_type, drug_monthly_cost, state }) => {
    // 2024 Federal Poverty Level guidelines
    const fpl2024Base = 15060;
    const fplPerAdditional = 5380;
    const fpl100 = fpl2024Base + fplPerAdditional * (household_size - 1);
    const incomeAsFplPct = (annual_household_income / fpl100) * 100;
    const monthlyIncome = annual_household_income / 12;
    const drugBurdenPct = monthlyIncome > 0 ? (drug_monthly_cost / monthlyIncome) * 100 : 0;

    const eligibility: { program: string; likely: string; note: string }[] = [];

    // Manufacturer PAP (most require <200–400% FPL)
    if (incomeAsFplPct <= 200) {
      eligibility.push({ program: "Manufacturer PAP (free drug)", likely: "Very Likely", note: "Most programs require ≤200% FPL" });
    } else if (incomeAsFplPct <= 400) {
      eligibility.push({ program: "Manufacturer PAP (discounted drug)", likely: "Likely", note: "Some programs extend to 400% FPL" });
    } else {
      eligibility.push({ program: "Manufacturer PAP", likely: "Unlikely", note: "Income exceeds most program thresholds" });
    }

    // Medicare Extra Help
    if (insurance_type === "medicare_part_d" && incomeAsFplPct <= 150) {
      eligibility.push({ program: "Medicare Extra Help / LIS", likely: "Very Likely", note: "≤150% FPL + limited assets required" });
    }

    // Medicaid
    if (insurance_type === "none" && incomeAsFplPct <= 138) {
      eligibility.push({ program: "Medicaid (ACA expansion)", likely: "Very Likely", note: "Most expansion states cover up to 138% FPL" });
    }

    // Copay assistance (commercial insurance only)
    if (["employer", "marketplace"].includes(insurance_type)) {
      eligibility.push({ program: "Manufacturer copay card", likely: "Likely", note: "Available for most brand drugs with commercial insurance; not valid on government plans" });
    }

    // State programs
    if (state) {
      const statePrograms: Record<string, string> = {
        CA: "CA Rx — calrx.ca.gov", NY: "NY Elderly Pharmaceutical Insurance (EPIC)", PA: "PACE/PACENET", FL: "Rx for Florida Seniors", TX: "Texas Vendor Drug Program",
      };
      if (statePrograms[state.toUpperCase()]) {
        eligibility.push({ program: `State Program (${state.toUpperCase()})`, likely: "Check", note: statePrograms[state.toUpperCase()] });
      }
    }

    const fplLabel = `${incomeAsFplPct.toFixed(0)}% FPL`;
    const burdenLabel = `${drugBurdenPct.toFixed(1)}% of monthly income`;

    const result = `## Eligibility Assessment

**Household:** ${household_size} ${household_size === 1 ? "person" : "people"}
**Annual Income:** $${annual_household_income.toLocaleString()} (${fplLabel})
**Insurance:** ${insurance_type.replace(/_/g, " ")}
**Drug Cost Burden:** $${drug_monthly_cost}/mo = ${burdenLabel}

### Program Eligibility
| Program | Likelihood | Notes |
|---|---|---|
${eligibility.map((e) => `| ${e.program} | ${e.likely} | ${e.note} |`).join("\n")}

### Priority Actions
${incomeAsFplPct <= 200 ? "1. Contact the drug manufacturer's patient assistance line directly — you are likely income-eligible for free or low-cost medication.\n" : ""}${drugBurdenPct >= 10 ? "2. This medication represents a significant financial burden. Ask your prescriber about therapeutic alternatives.\n" : ""}3. Run a GoodRx search to compare cash prices at local pharmacies — sometimes cheaper than your copay.

> Eligibility is based on 2024 Federal Poverty Level guidelines. Individual program rules vary.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── compare_drug_costs ───────────────────────────────────────────────────────
server.tool(
  "compare_drug_costs",
  "Compare the cost of a brand drug versus generic alternatives, mail-order pricing, and GoodRx-style cash pricing across channels",
  {
    brand_drug_name: z.string().describe("Brand drug name"),
    generic_name: z.string().optional().describe("Generic (INN) drug name if known"),
    dosage_strength: z.string().optional().describe("Dosage strength (e.g. '10mg', '20mg/5mL')"),
    quantity: z.number().int().positive().optional().default(30).describe("Quantity (number of pills/units per fill, default 30)"),
    insurance_copay: z.number().min(0).optional().describe("Your current insurance copay for this drug"),
  },
  async ({ brand_drug_name, generic_name, dosage_strength, quantity, insurance_copay }) => {
    const doseStr = dosage_strength ? ` ${dosage_strength}` : "";
    const genericLabel = generic_name ?? `${brand_drug_name} (generic)`;

    // Representative cost tiers — production would call GoodRx / NadAC APIs
    const costTiers = [
      { channel: `${brand_drug_name}${doseStr} — retail pharmacy (brand)`, cost: "Varies widely ($200–$800+/mo)", notes: "Use manufacturer copay card if commercially insured" },
      { channel: `${genericLabel}${doseStr} — retail pharmacy`, cost: "$4–$40 (generic)", notes: "Walmart/Kroger $4 lists; call ahead for pricing" },
      { channel: `${genericLabel} — mail-order (90-day supply)`, cost: "$10–$80 for 90 days", notes: "Most insurers offer 90-day mail-order at 2x the 30-day copay" },
      { channel: "GoodRx / RxSaver coupon (cash)", cost: "Search goodrx.com for real-time pricing", notes: "Often cheaper than insurance copay for generics" },
      { channel: "Mark Cuban Cost Plus Drugs (costplusdrugs.com)", cost: "Manufacturer cost + 15% markup + $3 dispensing", notes: "Significant savings on many generics" },
      { channel: "Amazon Pharmacy", cost: "Prime members get additional discounts", notes: "Free shipping; real-time pricing available" },
    ];

    const copayNote = insurance_copay !== undefined
      ? `\n**Your Current Copay:** $${insurance_copay.toFixed(2)} for ${quantity}-day supply`
      : "";

    const result = `## Drug Cost Comparison — ${brand_drug_name}${doseStr}

**Quantity:** ${quantity} units${copayNote}
**Generic Available:** ${generic_name ? `Yes — ${generic_name}` : "Check with pharmacist or Drugs.com"}

### Cost Channels
| Channel | Estimated Cost | Notes |
|---|---|---|
${costTiers.map((t) => `| ${t.channel} | ${t.cost} | ${t.notes} |`).join("\n")}

### Quick Action Checklist
- [ ] Ask your pharmacist: "Is there a generic available?"
- [ ] Search costplusdrugs.com for the generic name
- [ ] Run GoodRx search and show the coupon at the pharmacy counter
- [ ] If brand-name required, call the manufacturer's patient support line
- [ ] Ask prescriber if a therapeutic alternative is clinically appropriate

> Prices are illustrative ranges. Always verify current pricing at the pharmacy or website before filling.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── find_pharmacy ────────────────────────────────────────────────────────────
server.tool(
  "find_pharmacy",
  "Find pharmacies by type (340B, mail-order, specialty, compounding, retail) with guidance on when each is appropriate",
  {
    pharmacy_type: z.enum(["340B", "mail_order", "specialty", "compounding", "retail", "any"]).describe("Type of pharmacy to find"),
    zip_code: z.string().optional().describe("ZIP code for location-based search"),
    drug_name: z.string().optional().describe("Drug name (helps narrow specialty/compounding recommendations)"),
    insurance: z.string().optional().describe("Insurance plan name to check in-network status"),
  },
  async ({ pharmacy_type, zip_code, drug_name, insurance }) => {
    const typeInfo: Record<string, { description: string; bestFor: string[]; howToFind: string; examples: string[] }> = {
      "340B": {
        description: "Federally subsidized pharmacies for eligible health centers — significantly reduced drug prices for qualifying patients",
        bestFor: ["Uninsured or underinsured patients", "Patients of FQHCs and safety-net hospitals", "High-cost specialty drugs"],
        howToFind: "hrsa.gov/opa/340b-database — search for 340B covered entities near you; ask your clinic if they have a 340B pharmacy contract",
        examples: ["Federally Qualified Health Centers (FQHCs)", "Ryan White HIV/AIDS Program sites", "Safety-net hospital outpatient pharmacies"],
      },
      mail_order: {
        description: "90-day supply delivered to your door — often lower per-unit cost than retail for maintenance medications",
        bestFor: ["Chronic medications taken long-term", "Patients with mobility limitations", "Those seeking 90-day supply savings"],
        howToFind: "Contact your insurance plan's member services for preferred mail-order pharmacy",
        examples: ["Express Scripts", "CVS Caremark Mail Service", "OptumRx", "Amazon Pharmacy"],
      },
      specialty: {
        description: "Handles high-cost, complex medications requiring special storage, administration support, or prior authorization coordination",
        bestFor: ["Biologics, specialty injectables", "Oncology medications", "Rare disease drugs"],
        howToFind: "Your insurance plan's specialty pharmacy formulary; manufacturer hub programs often designate specific specialty pharmacies",
        examples: ["Accredo", "Specialty Pharmacy at CVS", "Walgreens Specialty", "BioPlus Specialty Pharmacy"],
      },
      compounding: {
        description: "Custom-formulated medications when a commercial product is unavailable or unsuitable",
        bestFor: ["Pediatric dosing not commercially available", "Allergen-free formulations", "Custom topical preparations"],
        howToFind: "PCAB-accredited pharmacies at pcab.org; ask your prescriber for a referral",
        examples: ["PCAB-accredited independent compounding pharmacies", "Some hospital pharmacies"],
      },
      retail: {
        description: "Standard walk-in pharmacy for most prescription needs",
        bestFor: ["Acute medications", "Generic medications", "Urgent fills"],
        howToFind: "Use GoodRx or your insurer's pharmacy locator; compare prices across chains",
        examples: ["Walgreens", "CVS", "Rite Aid", "Walmart Pharmacy", "Costco Pharmacy (often lowest cash prices)"],
      },
      any: {
        description: "All pharmacy types",
        bestFor: ["Use search tools to identify best option for your specific situation"],
        howToFind: "GoodRx pharmacy locator, your insurance member portal, or HRSA 340B database",
        examples: ["See specific type guides above"],
      },
    };

    const info = typeInfo[pharmacy_type];
    const zipNote = zip_code ? `\n**Search Area:** ZIP ${zip_code}` : "";
    const drugNote = drug_name ? `\n**Drug:** ${drug_name}` : "";
    const insuranceNote = insurance ? `\n**Insurance:** ${insurance} — verify in-network status via your plan portal or member services` : "";

    const result = `## Pharmacy Finder — ${pharmacy_type.replace("_", "-").toUpperCase()} Pharmacies
${zipNote}${drugNote}${insuranceNote}

### About ${pharmacy_type.replace("_", " ")} Pharmacies
${info.description}

### Best For
${info.bestFor.map((b) => `- ${b}`).join("\n")}

### How to Find
${info.howToFind}

### Examples
${info.examples.map((e) => `- ${e}`).join("\n")}

### General Tips
- Always call ahead to confirm the drug is in stock before making a trip
- Ask about automatic refill programs for maintenance medications
- Compare prices between chains — there can be significant variation
- Costco and Sam's Club pharmacies offer competitive cash prices without membership for prescriptions

> Availability varies by location and drug. Contact pharmacies directly for current pricing and stock.
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

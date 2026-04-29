# @oliwoods/immigration-helper-mcp

> **Open-source immigration helper MCP server — visa eligibility, green card timeline, document checklists, USCIS fee calculator, and immigration status explainer.**

[![npm version](https://img.shields.io/npm/v/@oliwoods/immigration-helper-mcp)](https://www.npmjs.com/package/@oliwoods/immigration-helper-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

**Keywords:** visa eligibility · green card · H-1B · immigration · USCIS · work visa · immigration lawyer · visa timeline · naturalization · immigration status · F-1 visa · EB-1 EB-2 EB-3

---

## Overview

`@oliwoods/immigration-helper-mcp` is a free, open-source MCP server that demystifies US immigration. It covers visa eligibility, green card wait times, document checklists, fee calculations, and plain-English status explanations — making expert-level immigration information accessible to everyone.

> **This tool provides general educational information only. Always consult a licensed immigration attorney before taking any immigration action.**

### Tools

| Tool | Description |
|------|-------------|
| `visa_eligibility` | Eligible US visa types with requirements, processing time, and recommended path |
| `green_card_timeline` | Wait time by category and country of birth with Visa Bulletin analysis |
| `document_checklist` | Complete document list, denial reasons, and filing tips for any application type |
| `fee_calculator` | Full USCIS fee breakdown including premium processing and family members |
| `status_explainer` | Plain-English explanation of any immigration status — rights, restrictions, and next steps |

---

## Installation

```bash
npm install -g @oliwoods/immigration-helper-mcp
# or run directly with npx
npx @oliwoods/immigration-helper-mcp
```

## MCP Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "immigration-helper": {
      "command": "npx",
      "args": ["-y", "@oliwoods/immigration-helper-mcp"]
    }
  }
}
```

---

## Tools Reference

### 1. `visa_eligibility` — US Visa Eligibility Check

Find out which visa categories you may qualify for.

**Input:**
```json
{
  "nationality": "India",
  "destination_country": "United States",
  "purpose": "work",
  "qualifications": {
    "education_level": "masters",
    "job_offer": true,
    "employer_sponsor": true
  }
}
```

**Output includes:** Eligible visa types (H-1B, L-1, O-1, E-2, etc.) with requirements, processing times, success rate estimates, recommended path, and country-specific backlog warnings.

**Purposes:** `work` · `study` · `family` · `investment` · `tourism` · `asylum`

---

### 2. `green_card_timeline` — Green Card Wait Time

Estimate how long your green card will take.

**Input:**
```json
{
  "current_visa_type": "H-1B",
  "priority_category": "EB-2-NIW",
  "country_of_birth": "India"
}
```

**Output:**
```json
{
  "estimated_wait_time": "60–80+ years",
  "backlog_warning": "⚠️  India nationals face per-country cap backlogs.",
  "expedite_options": ["Premium processing for I-140", "Consider EB-1A upgrade strategy"],
  "priority_date_explained": { "..." }
}
```

**Categories:** `EB-1A` · `EB-1B` · `EB-1C` · `EB-2` · `EB-2-NIW` · `EB-3` · `EB-5` · `F-1` through `F-4` · `IR-direct`

---

### 3. `document_checklist` — Application Document Checklist

Know exactly what to file before starting an application.

**Input:**
```json
{ "application_type": "H-1B" }
```

**Output includes:** Itemised document checklist, common denial reasons, tips for a strong application, processing time estimate, and premium processing availability.

**Application types:** `H-1B` · `L-1` · `O-1` · `EB-1A` · `EB-1B` · `EB-1C` · `EB-2-NIW` · `F-1` · `K-1` · `I-485` · `naturalization` · `DACA` · `TPS`

---

### 4. `fee_calculator` — USCIS Fee Calculator

Calculate the total cost before filing.

**Input:**
```json
{
  "application_type": "I-485",
  "premium_processing": false,
  "family_members": 2
}
```

**Output:**
```json
{
  "government_fees_breakdown": {
    "primary_form_fee_usd": 1440,
    "biometrics_usd": 85
  },
  "total_uscis_government_fees_usd": 4305,
  "attorney_fee_range": "$2,500–5,000",
  "estimated_total_cost_usd": "$4,305 + attorney fees"
}
```

---

### 5. `status_explainer` — Immigration Status in Plain English

Understand your rights, restrictions, and next steps.

**Input:**
```json
{ "immigration_status": "H-1B" }
```

**Output includes:** Work authorization details, travel rights, public benefits eligibility, key restrictions, path to next status, renewal deadlines, and critical warnings (e.g., "Working for a different employer without a transfer is an immediate violation").

**Supported statuses:** `H-1B` · `F-1` · `F-1 OPT` · `LPR` / `Green Card` · `DACA` · `TPS` · `Pending I-485` · `K-1` · `O-1`

---

## Key Resources

- **USCIS:** [uscis.gov](https://uscis.gov)
- **Visa Bulletin:** [travel.state.gov](https://travel.state.gov)
- **I-94 Travel History:** [i94.cbp.dhs.gov](https://i94.cbp.dhs.gov)
- **Find a Licensed Attorney:** [ailalawyer.com](https://ailalawyer.com)
- **USCIS Case Status:** [egov.uscis.gov](https://egov.uscis.gov)

---

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

### Project structure

```
packages/immigration-helper/
├── src/
│   ├── index.ts
│   ├── footer.ts
│   ├── heuristics.ts
│   └── tools/
│       ├── visa-eligibility.ts
│       ├── green-card-timeline.ts
│       ├── document-checklist.ts
│       ├── fee-calculator.ts
│       └── status-explainer.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Disclaimer

> **This MCP server provides general educational information only. It is NOT legal advice and NOT a substitute for a licensed immigration attorney.** Immigration law is complex and highly fact-specific. Errors in immigration filings can have severe consequences. Always consult an AILA-member immigration attorney before taking any action.

---

🌍 **Open source by OliWoods Foundation — [github.com/OliWoods-Org/mama-mcp-marketplace](https://github.com/OliWoods-Org/mama-mcp-marketplace)**

---

## License

MIT © [OliWoods Foundation](https://oliwoods.com)

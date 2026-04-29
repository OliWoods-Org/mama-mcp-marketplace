# @oliwoods/home-maintenance-mcp

> **AI-powered home maintenance MCP server — seasonal checklists, repair cost estimates, energy audits, contractor vetting, and home value impact analysis.**

[![npm version](https://img.shields.io/npm/v/@oliwoods/home-maintenance-mcp)](https://www.npmjs.com/package/@oliwoods/home-maintenance-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

**Keywords:** home maintenance · home repair costs · seasonal maintenance checklist · energy audit · home improvement ROI · contractor hiring · home value · HVAC repair · energy efficiency · house maintenance

---

## Overview

`@oliwoods/home-maintenance-mcp` is a Model Context Protocol (MCP) server that delivers expert home maintenance guidance directly in your AI assistant. Plan maintenance, estimate repair costs, audit energy efficiency, vet contractors, and model the financial impact of improvements — all in one tool.

### Tools

| Tool | Description |
|------|-------------|
| `seasonal_checklist` | Prioritised maintenance tasks by season, home type, and climate zone |
| `repair_estimator` | DIY vs. pro cost ranges, timelines, and contractor questions for 8 repair types |
| `energy_audit` | Efficiency score, top 5 ROI improvements, savings estimates, and available rebates |
| `contractor_questions` | 10 essential vetting questions, credential verification, and red flags |
| `home_value_impact` | ROI, appraiser impact, and splurge-vs-save guide for 12 improvement types |

---

## Installation

```bash
npm install -g @oliwoods/home-maintenance-mcp
# or run directly with npx
npx @oliwoods/home-maintenance-mcp
```

## MCP Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "home-maintenance": {
      "command": "npx",
      "args": ["-y", "@oliwoods/home-maintenance-mcp"]
    }
  }
}
```

---

## Tools Reference

### 1. `seasonal_checklist` — Seasonal Maintenance Tasks

Get a prioritised checklist tailored to your home and climate.

**Input:**
```json
{
  "season": "fall",
  "home_type": "house",
  "climate_zone": "cold"
}
```

**Output:** Ranked tasks with estimated time, cost, and DIY/pro recommendation. Climate-specific notes (freeze prevention, hurricane prep, fire clearance, etc.).

**Seasons:** `spring` · `summer` · `fall` · `winter`
**Home types:** `house` · `condo` · `apartment`
**Climate zones:** `cold` · `temperate` · `hot_humid` · `hot_dry` · `coastal`

---

### 2. `repair_estimator` — Repair Cost Estimates

Estimate DIY vs. professional costs with contractor guidance.

**Input:**
```json
{
  "repair_type": "hvac",
  "severity": "moderate",
  "home_age_years": 35
}
```

**Output:**
```json
{
  "cost_estimates": {
    "diy_range": "$150–600",
    "professional_range": "$500–3,500"
  },
  "typical_timeline": "4–8 hours",
  "questions_to_ask_contractors": ["..."],
  "red_flags_to_watch_for": ["..."],
  "permits_typically_required": true
}
```

**Repair types:** `roof` · `plumbing` · `hvac` · `electrical` · `foundation` · `appliance` · `windows` · `siding`

---

### 3. `energy_audit` — Home Energy Efficiency

Identify the highest-ROI improvements and available incentives.

**Input:**
```json
{
  "home_sqft": 1800,
  "home_age_years": 25,
  "heating_cooling_type": "gas_forced_air",
  "insulation_status": "average",
  "window_type": "double_pane",
  "monthly_energy_bill_usd": 180
}
```

**Output includes:** Efficiency score (0–100), top 5 improvements ranked by ROI, annual savings estimate per improvement, Federal 25C tax credit and utility rebate details.

---

### 4. `contractor_questions` — Vetting Any Contractor

10 must-ask questions before signing with any contractor.

**Input:**
```json
{ "project_type": "kitchen remodel" }
```

**Output includes:** Top 10 project-specific questions, licence and insurance requirements by trade, how to verify credentials online, red flags in quotes, and contract essentials.

---

### 5. `home_value_impact` — Improvement ROI Analysis

Model the financial return on any home improvement before committing.

**Input:**
```json
{
  "improvement_type": "kitchen_remodel",
  "home_value_usd": 450000
}
```

**Output:**
```json
{
  "typical_cost_range": "$15,000–75,000",
  "expected_value_increase": "$10,000–55,000",
  "national_average_roi_pct": 72,
  "appraiser_impact_level": "high",
  "best_roi_scenarios": ["..."],
  "splurge_vs_save_guide": "..."
}
```

**Improvement types:** `kitchen_remodel` · `bathroom_update` · `new_roof` · `landscaping` · `pool` · `deck_patio` · `finished_basement` · `garage_addition` · `hvac_replacement` · `windows_doors` · `exterior_paint` · `solar_panels`

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
packages/home-maintenance/
├── src/
│   ├── index.ts
│   ├── footer.ts
│   ├── heuristics.ts
│   └── tools/
│       ├── seasonal-checklist.ts
│       ├── repair-estimator.ts
│       ├── energy-audit.ts
│       ├── contractor-questions.ts
│       └── home-value-impact.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Disclaimer

> Cost estimates and ROI figures are national averages for educational purposes. Always obtain written quotes from licensed contractors and consult local real estate professionals before making financial decisions.

---

🏠 **Track your home equity → [paperst.oliwoods.com/calculator](https://paperst.oliwoods.com/calculator)**

---

## License

MIT © [OliWoods Foundation](https://oliwoods.com)

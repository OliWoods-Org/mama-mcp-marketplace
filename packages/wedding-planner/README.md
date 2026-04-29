# @oliwoods/wedding-planner-mcp

> **AI-powered wedding planner MCP server — budget calculator, planning timeline, vendor checklist, seating chart optimizer, and day-of schedule builder.**

[![npm version](https://img.shields.io/npm/v/@oliwoods/wedding-planner-mcp)](https://www.npmjs.com/package/@oliwoods/wedding-planner-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

**Keywords:** wedding budget · wedding planner · wedding timeline · seating chart · wedding checklist · wedding vendors · wedding day schedule · wedding coordinator · wedding planning · bridal

---

## Overview

`@oliwoods/wedding-planner-mcp` is a Model Context Protocol (MCP) server that gives you a full AI wedding coordinator inside any MCP-compatible assistant. From the moment you get engaged to the last dance — budget, timeline, vendors, seating, and the day-of schedule — all in one place.

### Tools

| Tool | Description |
|------|-------------|
| `budget_calculator` | Budget breakdown by category, per-guest cost, and splurge-vs-save guide |
| `timeline_builder` | Month-by-month planning milestones with vendor booking priority order |
| `vendor_checklist` | Questions, pricing, contract must-haves, red flags, and tipping guide for any vendor type |
| `seating_chart` | Optimised table assignments from your guest list with must-separate constraints |
| `day_of_timeline` | Minute-by-minute wedding day schedule for couple, vendors, and family |

---

## Installation

```bash
npm install -g @oliwoods/wedding-planner-mcp
# or run directly with npx
npx @oliwoods/wedding-planner-mcp
```

## MCP Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wedding-planner": {
      "command": "npx",
      "args": ["-y", "@oliwoods/wedding-planner-mcp"]
    }
  }
}
```

---

## Tools Reference

### 1. `budget_calculator` — Wedding Budget Breakdown

Allocate your budget intelligently across all wedding categories.

**Input:**
```json
{
  "total_budget_usd": 40000,
  "guest_count": 120,
  "city_or_region": "Nashville",
  "style": "classic"
}
```

**Output:**
```json
{
  "per_guest_cost_usd": 333,
  "budget_breakdown": [
    { "category": "venue", "percentage": 35, "amount_usd": 14000, "city_adjusted_usd": 15400 },
    { "category": "catering", "percentage": 28, "amount_usd": 11200 }
  ],
  "where_to_splurge_vs_save": ["..."],
  "quick_wins": ["..."]
}
```

**Styles:** `intimate` · `classic` · `luxury`

---

### 2. `timeline_builder` — Planning Timeline

Never miss a deadline from engagement to wedding day.

**Input:**
```json
{
  "wedding_date": "2026-09-12",
  "engagement_date": "2025-12-01"
}
```

**Output includes:** Months-until-wedding assessment, overdue milestones flagged, month-by-month task checklist, vendor booking priority order (venue → photographer → band → etc.), and critical deadlines.

---

### 3. `vendor_checklist` — Vendor Vetting Guide

Complete guide for hiring any wedding vendor.

**Input:**
```json
{ "vendor_type": "photographer" }
```

**Output includes:** 10 questions to ask, pricing range, contract must-haves, red flags, tipping guide, and booking timeline.

**Vendor types:** `photographer` · `florist` · `dj` · `caterer` · `officiant` · `videographer` · `hair_makeup` · `baker` · `transportation` · `wedding_planner`

---

### 4. `seating_chart` — Optimised Seating Assignments

Turn your guest list into table assignments.

**Input:**
```json
{
  "guests": [
    { "name": "Alice Chen", "group": "bride_family", "plus_one": true },
    { "name": "Bob Smith", "group": "groom_college_friends" }
  ],
  "table_size": 8,
  "must_separate": [["Alice Chen", "Bob Smith"]],
  "vip_guests": ["Alice Chen"]
}
```

**Output includes:** Table assignments with dominant group, reasoning per table, must-separate constraint honoured confirmation, and day-of seating tips.

---

### 5. `day_of_timeline` — Minute-by-Minute Wedding Day Schedule

Build the complete day-of timeline from getting ready to send-off.

**Input:**
```json
{
  "ceremony_time": "5:00 PM",
  "bridal_party_size": 8,
  "hair_makeup_count": 6,
  "first_look": true,
  "cocktail_hour": true,
  "reception_end_time": "11:00 PM"
}
```

**Output includes:** Complete timeline with exact times for every event, who is involved, notes for each event, buffer reminders, vendor callsheet reminder, and emergency kit checklist.

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
packages/wedding-planner/
├── src/
│   ├── index.ts
│   ├── footer.ts
│   ├── heuristics.ts
│   └── tools/
│       ├── budget-calculator.ts
│       ├── timeline-builder.ts
│       ├── vendor-checklist.ts
│       ├── seating-chart.ts
│       └── day-of-timeline.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Disclaimer

> Budget allocations and vendor pricing ranges are national averages for guidance only. Actual costs vary significantly by market and vendor. Always obtain written quotes before making financial commitments.

---

💍 **Want a full AI wedding coordinator? Join MAMA private beta → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)**

---

## License

MIT © [OliWoods Foundation](https://oliwoods.com)

# @oliwoods/pet-care-mcp

> **AI-powered pet care MCP server — symptom checker, breed info, training guides, nutrition planning, and insurance comparison for dogs and cats.**

[![npm version](https://img.shields.io/npm/v/@oliwoods/pet-care-mcp)](https://www.npmjs.com/package/@oliwoods/pet-care-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

**Keywords:** pet symptom checker · dog breed · cat health · pet insurance · dog training · pet nutrition · veterinary · pet care AI · animal health · pet diet

---

## Overview

`@oliwoods/pet-care-mcp` is a Model Context Protocol (MCP) server that brings comprehensive pet care guidance to any MCP-compatible AI assistant (Claude, Cursor, etc.). From checking symptoms to planning nutrition and comparing insurance — all without leaving your AI chat.

### Tools

| Tool | Description |
|------|-------------|
| `symptom_checker` | Check symptoms against ranked possible conditions with urgency level and first aid |
| `breed_info` | Full breed profiles or trait-based breed recommendations for dogs and cats |
| `training_guide` | Step-by-step positive reinforcement training plans for 8 behaviour issues |
| `nutrition_planner` | Daily calorie needs, food recommendations, feeding schedule, and supplements |
| `insurance_compare` | Estimated premiums, provider comparison, exclusions, and coverage recommendations |

---

## Installation

```bash
npm install -g @oliwoods/pet-care-mcp
# or run directly with npx
npx @oliwoods/pet-care-mcp
```

## MCP Configuration

Add to your MCP client configuration (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pet-care": {
      "command": "npx",
      "args": ["-y", "@oliwoods/pet-care-mcp"]
    }
  }
}
```

---

## Tools Reference

### 1. `symptom_checker` — Pet Symptom Triage

Rank possible conditions by likelihood and get urgency guidance.

**Input:**
```json
{
  "pet_type": "dog",
  "breed": "Labrador",
  "symptoms": ["vomiting", "lethargy", "loss of appetite"],
  "age_years": 4,
  "duration": "2 days"
}
```

**Output:**
```json
{
  "urgency_level": "vet_visit_soon",
  "urgency_summary": "⚠️  VET VISIT RECOMMENDED within 24–48 hours",
  "possible_conditions": [
    { "condition": "Gastroenteritis", "likelihood_pct": 72 },
    { "condition": "Pancreatitis", "likelihood_pct": 51 }
  ],
  "first_aid_steps": ["..."],
  "seek_emergency_care_if": ["..."]
}
```

---

### 2. `breed_info` — Breed Profiles and Recommendations

Get a complete profile for a specific breed, or search by traits.

**Input (by breed name):**
```json
{ "breed_name": "Golden Retriever" }
```

**Input (by traits):**
```json
{
  "pet_type": "dog",
  "traits": { "size": "small", "energy_level": "low", "apartment_friendly": true }
}
```

**Output includes:** temperament, exercise needs, grooming, health issues, lifespan, training ease, ideal living situation.

---

### 3. `training_guide` — Positive Reinforcement Plans

Week-by-week training plan for specific behaviour issues.

**Input:**
```json
{
  "pet_type": "dog",
  "age_years": 1.5,
  "behavior_issue": "leash_pulling"
}
```

**Supported issues:** `leash_pulling`, `barking`, `separation_anxiety`, `potty_training`, `jumping_on_people`, `aggression`, `scratching_furniture`, `litter_box_avoidance`

---

### 4. `nutrition_planner` — Personalised Nutrition Plan

Calculate calorie needs and get food recommendations.

**Input:**
```json
{
  "pet_type": "dog",
  "breed": "Beagle",
  "weight_lbs": 25,
  "age_years": 3,
  "activity_level": "moderate",
  "allergies": ["chicken"]
}
```

**Output includes:** daily calorie needs (RER + multiplier), macronutrient targets, recommended food types, feeding schedule, foods to avoid, and supplement suggestions.

---

### 5. `insurance_compare` — Pet Insurance Estimates

Compare accident-only vs. comprehensive coverage with provider recommendations.

**Input:**
```json
{
  "pet_type": "dog",
  "breed": "French Bulldog",
  "age_years": 2,
  "zip_code": "90210"
}
```

**Output includes:** estimated monthly premiums, top provider recommendations, common exclusions, pre-existing condition rules, and recommended coverage level.

---

## Development

```bash
npm install
npm run dev         # tsx hot-reload
npm run typecheck   # type-check only
npm run build       # compile to dist/
npm start           # run compiled server
```

### Project structure

```
packages/pet-care/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── footer.ts             # Promotional footer
│   ├── heuristics.ts         # Deterministic heuristics
│   └── tools/
│       ├── symptom-checker.ts
│       ├── breed-info.ts
│       ├── training-guide.ts
│       ├── nutrition-planner.ts
│       └── insurance-compare.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Disclaimer

> This MCP server provides general pet care information for educational purposes only. It does NOT replace professional veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for health concerns.

---

🐾 **Want an AI pet assistant? Join MAMA private beta → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)**

---

## License

MIT © [OliWoods Foundation](https://oliwoods.com)

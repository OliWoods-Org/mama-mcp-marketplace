# Meal Planner MCP

AI meal planning assistant for Claude. Plan weekly meals, build grocery lists, discover recipes, look up nutrition facts, and get step-by-step meal prep guides — all deterministic, no API keys required.

## Tools (5)

| Tool | Description |
|------|-------------|
| `plan_meals` | Generate a full weekly meal plan with breakfast, lunch, dinner, and snacks — includes per-day calories, macros, and a nutrition summary |
| `grocery_list` | Build an organized grocery list sorted by store section with quantities, estimated costs, and budget tips |
| `recipe_finder` | Find top 3 matching recipes with ingredients, step-by-step instructions, nutrition facts, and substitutions |
| `nutrition_lookup` | Look up detailed nutrition facts for any food — calories, protein, fiber, vitamins, minerals, health score, and optional side-by-side comparison |
| `meal_prep_guide` | Get an optimized prep order, step-by-step instructions, storage details, and reheating tips for a batch cooking session |

## Quick Start

```bash
npx @oliwoods/meal-planner-mcp
```

Or install globally:

```bash
npm install -g @oliwoods/meal-planner-mcp
meal-planner-mcp
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "meal-planner": {
      "command": "npx",
      "args": ["@oliwoods/meal-planner-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "meal-planner": {
      "command": "meal-planner-mcp"
    }
  }
}
```

## Example Usage

```
Plan 7 days of Mediterranean meals for 2 people, targeting 1800 calories per day

Build a grocery list for a week of keto meals for 2 people

Find me a quick chicken recipe, gluten-free, under 30 minutes

Look up nutrition facts for salmon, compare to chicken breast

Create a meal prep guide for: grilled chicken, quinoa, roasted vegetables — 2 hours available, 4 servings, fridge storage
```

## Development

```bash
npm install
npm run build   # compile TypeScript
npm run dev     # run with tsx (no build needed)
npm run typecheck
```

---

Want automated weekly meal plans? **[mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)**

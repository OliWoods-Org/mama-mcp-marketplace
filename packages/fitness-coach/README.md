# Fitness Coach MCP

AI personal fitness coach for Claude. Generate tailored workout plans, calculate macros with real formulas, look up exercise technique, track body composition, and build progressive overload programmes — all in your AI assistant.

## Tools (5)

| Tool | Description |
|------|-------------|
| `workout_generator` | Generate a full weekly workout plan with exercises, sets, reps, rest, and coaching notes — tailored by goal, level, days, and equipment |
| `macro_calculator` | Calculate personalised calories and macros using the Mifflin-St Jeor BMR formula, with goal-adjusted targets and meal timing guidance |
| `exercise_lookup` | Look up any exercise — form cues, target muscles, common mistakes, variations, rep ranges, and safety notes |
| `body_comp_tracker` | Analyse lean mass vs fat mass, project body composition at 4/8/12 weeks, and get realistic timeline and weekly targets |
| `progressive_overload` | Build a week-by-week progressive overload plan with weight, sets, and reps per week, deload weeks, and estimated 1RM progression |

## Quick Start

```bash
npx @oliwoods/fitness-coach-mcp
```

Or install and build locally:

```bash
npm install
npm run build
node dist/index.js
```

## Claude Desktop Config

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fitness-coach": {
      "command": "npx",
      "args": ["@oliwoods/fitness-coach-mcp"]
    }
  }
}
```

Or if running from a local build:

```json
{
  "mcpServers": {
    "fitness-coach": {
      "command": "node",
      "args": ["/path/to/fitness-coach/dist/index.js"]
    }
  }
}
```

## Example Usage

```
Generate a 4-day hypertrophy workout plan for an intermediate lifter with a full gym

Calculate my macros: 185 lbs, 5'10", 28 years old, male, moderately active, goal is to cut

Look up the barbell squat — full breakdown with form cues and common mistakes

Track my body composition: 190 lbs at 22% body fat, goal is 175 lbs at 15%, 16 weeks

Build a 12-week progressive overload plan for bench press: currently 185 lbs × 4 sets × 6 reps, goal is strength
```

## Want an AI personal trainer?

[mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)

## License

MIT

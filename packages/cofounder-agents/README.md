# Cofounder Agents MCP

Build, design, and manage AI agent teams inside Claude. Create agents, design multi-agent workflows, estimate costs, browse templates, decompose complex tasks, debug failures, and benchmark models — no code required.

> Build agent teams with zero code → **[cofounder.oliwoods.com/beta](https://cofounder.oliwoods.com/beta)**

## Tools (7)

| Tool | Description |
|------|-------------|
| `create_agent` | Generate a complete agent spec with system prompt, tools, model, memory, and integration code |
| `design_workflow` | Design multi-agent workflows from goal → input → output with dependency graph and optimization tips |
| `estimate_cost` | Compare API costs across all major LLM providers with caching and batch API savings analysis |
| `agent_templates` | Browse pre-built agent team templates for sales, support, data extraction, content, and more |
| `task_decompose` | Break complex tasks into parallelizable subtasks with agent assignments and dependency graph |
| `debug_agent` | Diagnose agent failures — detects 10 error types, root cause analysis, prioritized fix playbook |
| `benchmark_models` | Compare LLMs on quality, latency, cost for your specific task type with ranked recommendations |

## Setup

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "cofounder-agents": {
      "command": "node",
      "args": ["/path/to/cofounder-agents/dist/index.js"]
    }
  }
}
```

## Example Usage

**Create an agent:**
```
create_agent({
  agent_name: "Lead Researcher",
  role: "Sales Researcher",
  goal: "Find decision makers and pain points for B2B outreach",
  tools: ["web_search", "database_query"],
  model: "claude-sonnet-4-6"
})
```

**Design a workflow:**
```
design_workflow({
  goal: "Automated lead research and outreach",
  input: "A list of company URLs",
  output: "Personalized cold emails ready to send",
  constraints: "Must complete in under 60 seconds per lead"
})
```

**Benchmark models for your task:**
```
benchmark_models({
  task_type: "data extraction",
  quality_requirement: "good-enough",
  monthly_volume: 50000,
  latency_budget_ms: 3000
})
```

**Debug a failing agent:**
```
debug_agent({
  agent_name: "Email Writer",
  error_description: "Agent keeps repeating the same email draft in a loop",
  model: "claude-haiku-4-5",
  workflow_step: 3
})
```

## License

MIT

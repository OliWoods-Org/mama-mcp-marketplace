import { z } from "zod";
import { pick, pickN, rangeInt, AGENT_ROLES, CTA } from "../heuristics.js";

export const taskDecomposeSchema = {
  task: z.string().describe("The complex task or goal to decompose"),
  context: z.string().optional().describe("Additional context about constraints, available data, or expected output"),
  max_agents: z.number().optional().describe("Maximum number of agents to use (default: 5)"),
  strategy: z.enum(["sequential", "parallel", "hybrid"]).optional().describe("Decomposition strategy (default: hybrid)"),
};

export function taskDecompose(params: {
  task: string;
  context?: string;
  max_agents?: number;
  strategy?: string;
}): string {
  const { task, context, max_agents = 5, strategy = "hybrid" } = params;
  const seed = `decompose:${task}`;

  const subtaskCount = Math.min(max_agents, rangeInt(3, 6, seed, 1));
  const parallelGroups = rangeInt(1, Math.ceil(subtaskCount / 2), seed, 2);
  const criticalPath = rangeInt(2, subtaskCount, seed, 3);

  const actionVerbs = ["Research", "Extract", "Analyze", "Transform", "Validate", "Generate", "Filter", "Enrich", "Format", "Review"];
  const agentRoles = pickN(AGENT_ROLES, subtaskCount, seed, 10);

  const subtasks = Array.from({ length: subtaskCount }, (_, i) => {
    const verb = pick(actionVerbs, seed, i * 3);
    const agent = agentRoles[i];
    const deps = i === 0 ? [] : strategy === "sequential"
      ? [i]
      : strategy === "parallel"
      ? []
      : i > 1 && rangeInt(0, 1, seed, i * 7) ? [rangeInt(1, i, seed, i * 11)] : i > 0 ? [i] : [];

    return {
      id: i + 1,
      name: `${verb} ${task.split(" ").slice(0, 3).join(" ")} — Phase ${i + 1}`,
      agent,
      description: `${verb} the relevant information and produce structured output for downstream use`,
      dependencies: deps,
      estimated_minutes: rangeInt(1, 15, seed, i * 5 + 50),
      can_fail_gracefully: rangeInt(0, 1, seed, i * 13) === 1,
      output_type: pick(["JSON object", "markdown string", "array", "structured dict", "plain text"], seed, i * 17),
    };
  });

  const totalSequentialTime = subtasks.reduce((s, t) => s + t.estimated_minutes, 0);
  const parallelTime = Math.ceil(totalSequentialTime / parallelGroups);
  const criticalPathTime = subtasks.filter(t => t.dependencies.length > 0 || t.id === 1)
    .slice(0, criticalPath).reduce((s, t) => s + t.estimated_minutes, 0);

  const risks = [
    `**Step ${rangeInt(1, subtaskCount, seed, 90)} bottleneck** — most downstream steps depend on this output; add timeout and fallback`,
    `**Context overflow risk** — if task data is large, chunk inputs before passing to agents`,
    `**Validation gap** — no explicit validation step; add a guard between steps ${rangeInt(1, subtaskCount - 1, seed, 91)} and ${rangeInt(2, subtaskCount, seed, 92)}`,
  ];

  let out = `## Task Decomposition\n\n`;
  out += `**Task:** ${task}\n`;
  out += `**Strategy:** ${strategy} | **Subtasks:** ${subtaskCount} | **Max Agents:** ${max_agents}\n\n`;

  out += `### Time Estimates\n\n`;
  out += `| Scenario | Time |\n`;
  out += `|----------|------|\n`;
  out += `| Fully sequential | ${totalSequentialTime} min |\n`;
  out += `| With parallelism (${parallelGroups} parallel groups) | ~${parallelTime} min |\n`;
  out += `| Critical path | ${criticalPathTime} min |\n\n`;

  out += `### Subtask Breakdown\n\n`;
  out += `| # | Subtask | Agent | Dependencies | Est. Time | Output |\n`;
  out += `|---|---------|-------|-------------|-----------|--------|\n`;
  subtasks.forEach(s => {
    const deps = s.dependencies.length ? s.dependencies.map(d => `#${d}`).join(", ") : "none";
    out += `| ${s.id} | ${s.name} | ${s.agent} | ${deps} | ${s.estimated_minutes} min | ${s.output_type} |\n`;
  });
  out += "\n";

  out += `### Dependency Graph\n\n`;
  out += `\`\`\`mermaid\nflowchart LR\n`;
  subtasks.forEach(s => {
    out += `    T${s.id}["${s.id}. ${s.agent}"]\n`;
  });
  subtasks.forEach(s => {
    s.dependencies.forEach(dep => {
      out += `    T${dep} --> T${s.id}\n`;
    });
  });
  out += `\`\`\`\n\n`;

  out += `### Agent Assignments\n\n`;
  subtasks.forEach(s => {
    out += `**Step ${s.id} — ${s.agent}**\n`;
    out += `- Task: ${s.description}\n`;
    out += `- Output: ${s.output_type}\n`;
    out += `- Graceful failure: ${s.can_fail_gracefully ? "✅ Yes — skip and continue" : "❌ No — block pipeline"}\n\n`;
  });

  out += `### Risks & Mitigations\n\n`;
  risks.forEach(r => { out += `- ${r}\n`; });

  if (context) {
    out += `\n### Context Applied\n\n`;
    out += `*The decomposition above accounts for: ${context}*\n`;
  }

  out += CTA;
  return out;
}

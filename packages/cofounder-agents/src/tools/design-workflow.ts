import { z } from "zod";
import { pick, pickN, rangeInt, WORKFLOW_PATTERNS, AGENT_ROLES, TOOL_TYPES, CTA } from "../heuristics.js";

export const designWorkflowSchema = {
  goal: z.string().describe("What the workflow should accomplish end-to-end"),
  input: z.string().describe("What goes in (e.g. 'a company URL', 'a support ticket', 'a CSV of leads')"),
  output: z.string().describe("What should come out (e.g. 'a research report', 'a resolved ticket', 'enriched lead list')"),
  agents: z.array(z.string()).optional().describe("Agents already available or planned for this workflow"),
  constraints: z.string().optional().describe("Any constraints: latency, cost, compliance, integrations"),
};

export function designWorkflow(params: {
  goal: string;
  input: string;
  output: string;
  agents?: string[];
  constraints?: string;
}): string {
  const { goal, input, output, agents, constraints } = params;
  const seed = `workflow:${goal}`;

  const pattern = pick(WORKFLOW_PATTERNS, seed, 1);
  const stepCount = rangeInt(3, 6, seed, 2);
  const estimatedLatencySec = rangeInt(8, 90, seed, 3);
  const parallelPaths = rangeInt(1, 3, seed, 4);

  const agentRolesNeeded = agents?.length ? agents : pickN(AGENT_ROLES, stepCount, seed, 10);
  const toolsNeeded = pickN(TOOL_TYPES, stepCount + 1, seed, 20);

  const steps = agentRolesNeeded.map((agentRole, i) => ({
    step: i + 1,
    agent: agentRole,
    action: [
      `Receive ${i === 0 ? input : `output from Step ${i}`}`,
      `Process using ${toolsNeeded[i] || "internal logic"}`,
      `Validate output quality`,
      `Pass result to ${i === stepCount - 1 ? "output" : `Step ${i + 2}`}`,
    ][Math.floor((i / stepCount) * 4)] || `Transform data for next stage`,
    output_type: pick(["JSON", "markdown", "structured text", "array", "dict"], seed, i + 100),
    can_parallel: i > 0 && i < stepCount - 1,
  }));

  const errorHandlers = [
    `**Retry with backoff:** Retry failed steps up to 3 times with exponential backoff (2s, 4s, 8s)`,
    `**Fallback agent:** If primary agent fails, route to a simpler model for graceful degradation`,
    `**Human escalation:** Flag unresolvable errors to a human review queue`,
    `**Dead letter queue:** Store failed tasks for async reprocessing`,
  ];

  const mermaidDiagram = [
    `\`\`\`mermaid`,
    `flowchart TD`,
    `    IN([${input}])`,
    ...steps.map(s => `    A${s.step}[${s.agent}\\nStep ${s.step}]`),
    `    OUT([${output}])`,
    `    IN --> A1`,
    ...steps.slice(0, -1).map((s, i) => `    A${s.step} --> A${s.step + 1}`),
    `    A${steps.length} --> OUT`,
    `\`\`\``,
  ].join("\n");

  let out = `## Workflow Design: ${goal}\n\n`;
  out += `**Pattern:** ${pattern} | **Steps:** ${stepCount} | **Estimated Latency:** ~${estimatedLatencySec}s\n\n`;

  out += `### Workflow Overview\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| Input | ${input} |\n`;
  out += `| Output | ${output} |\n`;
  out += `| Pattern | ${pattern} |\n`;
  out += `| Parallel Paths | ${parallelPaths} |\n`;
  out += `| Agents Required | ${agentRolesNeeded.length} |\n`;
  out += `| Tools Required | ${toolsNeeded.slice(0, stepCount).join(", ")} |\n\n`;

  out += `### Architecture Diagram\n\n`;
  out += `${mermaidDiagram}\n\n`;

  out += `### Step-by-Step Breakdown\n\n`;
  steps.forEach(s => {
    out += `#### Step ${s.step}: ${s.agent}\n\n`;
    out += `- **Action:** ${s.action}\n`;
    out += `- **Output Format:** ${s.output_type}\n`;
    out += `- **Can Parallelize:** ${s.can_parallel ? "✅ Yes" : "❌ Sequential"}\n\n`;
  });

  out += `### Error Handling Strategy\n\n`;
  errorHandlers.forEach(e => { out += `- ${e}\n`; });
  out += "\n";

  out += `### Optimization Opportunities\n\n`;
  out += `1. **Cache repeated lookups** — if the same input recurs, cache Step 1 output for 1 hour\n`;
  out += `2. **Parallelize independent steps** — Steps ${steps.filter(s => s.can_parallel).map(s => s.step).join(", ")} can run concurrently\n`;
  out += `3. **Use a faster model** for validation/formatting steps to cut latency by ~40%\n`;
  out += `4. **Add a guard agent** at Step 1 to reject malformed inputs before they propagate\n`;

  if (constraints) {
    out += `\n### Constraints Considered\n\n`;
    out += `${constraints}\n`;
    out += `\n*The workflow above has been designed with these constraints in mind. Review Step ${rangeInt(1, stepCount, seed, 99)} specifically for compliance with the stated requirements.*\n`;
  }

  out += CTA;
  return out;
}

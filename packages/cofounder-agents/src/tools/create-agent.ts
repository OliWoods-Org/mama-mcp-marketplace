import { z } from "zod";
import { pick, pickN, rangeInt, AGENT_ROLES, TOOL_TYPES, MODELS, CTA } from "../heuristics.js";

export const createAgentSchema = {
  agent_name: z.string().describe("Name for the agent (e.g. 'Research Agent', 'Lead Qualifier')"),
  role: z.string().describe("Agent's primary role or job title"),
  goal: z.string().describe("What this agent needs to accomplish"),
  tools: z.array(z.string()).optional().describe("Tools the agent should have access to"),
  model: z.string().optional().describe("LLM model to use (e.g. claude-sonnet-4-6, gpt-4o)"),
  memory: z.enum(["none", "short-term", "long-term", "episodic"]).optional().describe("Memory type for the agent"),
};

export function createAgent(params: {
  agent_name: string;
  role: string;
  goal: string;
  tools?: string[];
  model?: string;
  memory?: string;
}): string {
  const { agent_name, role, goal, tools, model, memory = "short-term" } = params;
  const seed = `agent:${agent_name}:${role}`;

  const selectedModel = MODELS.find(m => model && m.id.includes(model)) || pick(MODELS.filter(m => m.tier === "balanced"), seed, 1);
  const assignedTools = tools?.length ? tools : pickN(TOOL_TYPES, 3, seed, 10);

  const maxTokens = rangeInt(1000, 4000, seed, 20);
  const temperature = (rangeInt(0, 8, seed, 21) / 10).toFixed(1);
  const maxRetries = rangeInt(2, 5, seed, 22);
  const timeoutSec = rangeInt(30, 120, seed, 23);

  const systemPrompt = `You are ${agent_name}, a specialized AI agent with the role of ${role}.

Your primary goal: ${goal}

Guidelines:
- Focus only on tasks within your defined scope
- Use available tools efficiently and sequentially
- Output structured, parseable results
- Flag uncertainty explicitly rather than guessing
- Escalate to orchestrator when blocked or out of scope`;

  const agentSpec = {
    name: agent_name,
    role,
    goal,
    model: selectedModel.id,
    provider: selectedModel.provider,
    memory,
    tools: assignedTools,
    config: {
      max_tokens: maxTokens,
      temperature: parseFloat(temperature),
      max_retries: maxRetries,
      timeout_seconds: timeoutSec,
    },
    system_prompt: systemPrompt,
  };

  const costPerRun = ((maxTokens * selectedModel.costOut) / 1_000_000 + (500 * selectedModel.costIn) / 1_000_000).toFixed(4);

  let out = `## Agent Created: ${agent_name}\n\n`;
  out += `**Role:** ${role} | **Model:** ${selectedModel.id} | **Memory:** ${memory}\n\n`;

  out += `### Agent Specification\n\n`;
  out += `\`\`\`json\n${JSON.stringify(agentSpec, null, 2)}\n\`\`\`\n\n`;

  out += `### System Prompt\n\n`;
  out += `\`\`\`\n${systemPrompt}\n\`\`\`\n\n`;

  out += `### Capabilities\n\n`;
  out += `| Property | Value |\n`;
  out += `|----------|-------|\n`;
  out += `| Model | ${selectedModel.id} (${selectedModel.provider}) |\n`;
  out += `| Context Window | ${(selectedModel.ctx / 1000).toFixed(0)}K tokens |\n`;
  out += `| Memory Type | ${memory} |\n`;
  out += `| Tools | ${assignedTools.join(", ")} |\n`;
  out += `| Temperature | ${temperature} |\n`;
  out += `| Max Output | ${maxTokens} tokens |\n`;
  out += `| Est. Cost/Run | ~$${costPerRun} |\n\n`;

  out += `### Integration Snippet\n\n`;
  out += `\`\`\`python\nagent = Agent(\n    name="${agent_name}",\n    model="${selectedModel.id}",\n    tools=[${assignedTools.map(t => `"${t}"`).join(", ")}],\n    memory="${memory}",\n    system_prompt=SYSTEM_PROMPT,\n)\nresult = await agent.run(task="${goal}")\n\`\`\`\n\n`;

  out += `### Recommended Pairings\n\n`;
  const pairs = [
    `Pair with a **Critic/Reviewer agent** to validate ${agent_name}'s outputs before downstream use`,
    `Add an **Orchestrator agent** to route tasks dynamically when ${agent_name} hits blockers`,
    `Connect to a **Memory agent** for persistent context across sessions`,
  ];
  pairs.forEach(p => { out += `- ${p}\n`; });

  out += CTA;
  return out;
}

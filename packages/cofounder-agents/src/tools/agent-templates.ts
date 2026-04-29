import { z } from "zod";
import { pick, pickN, rangeInt, MODELS, TOOL_TYPES, USE_CASES, CTA } from "../heuristics.js";

export const agentTemplatesSchema = {
  use_case: z.string().describe("Use case or industry to find templates for (e.g. 'sales', 'customer support', 'data extraction', 'content')"),
  team_size: z.number().optional().describe("Number of agents in the team (1-10, default: 3)"),
};

export function agentTemplates(params: {
  use_case: string;
  team_size?: number;
}): string {
  const { use_case, team_size = 3 } = params;
  const seed = `templates:${use_case}:${team_size}`;

  const useCaseKey = USE_CASES.find(u => u.includes(use_case.toLowerCase().replace(/\s/g, "-"))) || pick(USE_CASES, seed, 1);

  type Template = {
    name: string;
    role: string;
    model: string;
    tools: string[];
    systemPrompt: string;
    useCase: string;
  };

  const templateLibrary: Record<string, Template[]> = {
    "sales-outreach": [
      { name: "Lead Researcher", role: "Researcher", model: "claude-sonnet-4-6", tools: ["web_search", "database_query"], systemPrompt: "You research companies and contacts to build detailed prospect profiles before outreach.", useCase: "sales-outreach" },
      { name: "Email Personalizer", role: "Writer", model: "claude-sonnet-4-6", tools: ["api_caller", "email_sender"], systemPrompt: "You write highly personalized cold emails based on research data. Each email is unique, relevant, and under 100 words.", useCase: "sales-outreach" },
      { name: "Sequence Manager", role: "Orchestrator", model: "claude-haiku-4-5", tools: ["email_sender", "calendar_manager", "notification_sender"], systemPrompt: "You manage multi-touch outreach sequences, tracking reply status and triggering follow-up tasks.", useCase: "sales-outreach" },
    ],
    "customer-support": [
      { name: "Ticket Classifier", role: "Classifier", model: "claude-haiku-4-5", tools: ["database_query", "api_caller"], systemPrompt: "You classify incoming support tickets by type, priority, and required team. Output structured JSON.", useCase: "customer-support" },
      { name: "Knowledge Agent", role: "Researcher", model: "claude-sonnet-4-6", tools: ["file_reader", "database_query", "web_search"], systemPrompt: "You search the knowledge base and documentation to find accurate answers to customer questions.", useCase: "customer-support" },
      { name: "Response Writer", role: "Writer", model: "claude-sonnet-4-6", tools: ["email_sender", "api_caller"], systemPrompt: "You write empathetic, clear, and accurate customer support responses using answers from the Knowledge Agent.", useCase: "customer-support" },
    ],
    "data-extraction": [
      { name: "Source Crawler", role: "Extractor", model: "claude-sonnet-4-6", tools: ["web_search", "api_caller", "pdf_parser"], systemPrompt: "You crawl web sources and documents to extract structured data matching a given schema.", useCase: "data-extraction" },
      { name: "Data Validator", role: "Validator", model: "claude-haiku-4-5", tools: ["data_validator", "database_query"], systemPrompt: "You validate extracted data against schema rules and flag anomalies for human review.", useCase: "data-extraction" },
      { name: "Formatter", role: "Formatter", model: "claude-haiku-4-5", tools: ["file_reader", "api_caller"], systemPrompt: "You transform validated data into the target output format (JSON, CSV, Airtable, etc.).", useCase: "data-extraction" },
    ],
    "content-pipeline": [
      { name: "Topic Researcher", role: "Researcher", model: "claude-sonnet-4-6", tools: ["web_search", "database_query"], systemPrompt: "You research topics deeply, finding statistics, quotes, examples, and competing angles for content creation.", useCase: "content-pipeline" },
      { name: "Content Writer", role: "Writer", model: "claude-opus-4-7", tools: ["file_reader", "api_caller"], systemPrompt: "You write high-quality, engaging content in the brand voice. You follow the style guide precisely.", useCase: "content-pipeline" },
      { name: "SEO Optimizer", role: "Analyst", model: "claude-haiku-4-5", tools: ["web_search", "data_validator"], systemPrompt: "You optimize content for search intent, keyword placement, and readability. Output revised content with changes annotated.", useCase: "content-pipeline" },
      { name: "Editor", role: "Critic", model: "claude-sonnet-4-6", tools: ["file_reader"], systemPrompt: "You review content for accuracy, tone, and brand alignment. Provide specific, actionable edit suggestions.", useCase: "content-pipeline" },
    ],
    default: [
      { name: "Orchestrator", role: "Orchestrator", model: "claude-sonnet-4-6", tools: ["api_caller", "notification_sender"], systemPrompt: "You manage task routing, delegate to specialist agents, and aggregate results into a final output.", useCase: use_case },
      { name: "Specialist Agent", role: pick(["Researcher", "Analyst", "Writer", "Extractor"], seed, 5), model: "claude-sonnet-4-6", tools: pickN(TOOL_TYPES, 3, seed, 6), systemPrompt: `You are a specialist focused on ${use_case} tasks. You receive structured inputs and return structured outputs.`, useCase: use_case },
      { name: "Validator", role: "Validator", model: "claude-haiku-4-5", tools: ["data_validator"], systemPrompt: "You validate all outputs before they leave the workflow. Flag issues and provide correction suggestions.", useCase: use_case },
    ],
  };

  const templates = (
    templateLibrary[useCaseKey] ||
    templateLibrary[Object.keys(templateLibrary).find(k => use_case.toLowerCase().includes(k.split("-")[0])) || ""] ||
    templateLibrary.default
  ).slice(0, team_size);

  let out = `## Agent Templates: ${use_case}\n\n`;
  out += `**Team Size:** ${templates.length} agents | **Use Case:** ${useCaseKey.replace(/-/g, " ")}\n\n`;

  out += `### Team Overview\n\n`;
  out += `| Agent | Role | Model | Tools |\n`;
  out += `|-------|------|-------|-------|\n`;
  templates.forEach(t => {
    out += `| ${t.name} | ${t.role} | \`${t.model}\` | ${t.tools.join(", ")} |\n`;
  });
  out += "\n";

  templates.forEach((t, i) => {
    out += `### Agent ${i + 1}: ${t.name}\n\n`;
    out += `**Role:** ${t.role} | **Model:** \`${t.model}\`\n\n`;
    out += `**System Prompt:**\n\`\`\`\n${t.systemPrompt}\n\`\`\`\n\n`;
    out += `**Tools:** ${t.tools.join(", ")}\n\n`;
  });

  out += `### Deployment Config\n\n`;
  out += `\`\`\`json\n`;
  out += JSON.stringify({
    team_name: `${use_case} team`,
    agents: templates.map(t => ({
      name: t.name,
      model: t.model,
      tools: t.tools,
      memory: "short-term",
    })),
    workflow: "sequential",
    error_handling: "retry-with-fallback",
  }, null, 2);
  out += `\n\`\`\`\n\n`;

  out += `### Customization Checklist\n\n`;
  out += `- [ ] Replace placeholder system prompts with your specific instructions\n`;
  out += `- [ ] Configure tool credentials (API keys, database connections)\n`;
  out += `- [ ] Set input/output schemas for type safety between agents\n`;
  out += `- [ ] Add guardrails and output validation rules\n`;
  out += `- [ ] Test with 5–10 sample inputs before production deployment\n`;

  out += CTA;
  return out;
}

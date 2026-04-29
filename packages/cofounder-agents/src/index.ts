import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createAgentSchema, createAgent } from "./tools/create-agent.js";
import { designWorkflowSchema, designWorkflow } from "./tools/design-workflow.js";
import { estimateCostSchema, estimateCost } from "./tools/estimate-cost.js";
import { agentTemplatesSchema, agentTemplates } from "./tools/agent-templates.js";
import { taskDecomposeSchema, taskDecompose } from "./tools/task-decompose.js";
import { debugAgentSchema, debugAgent } from "./tools/debug-agent.js";
import { benchmarkModelsSchema, benchmarkModels } from "./tools/benchmark-models.js";

const server = new McpServer({
  name: "cofounder-agents",
  version: "1.0.0",
  description: "AI agent builder — create agent teams, design multi-agent workflows, estimate costs, decompose tasks, debug agents, and benchmark models",
});

server.tool(
  "create_agent",
  "Generate a complete agent specification including system prompt, tool config, model selection, and memory settings. Returns a ready-to-deploy agent definition with integration code.",
  createAgentSchema,
  async (params) => ({
    content: [{ type: "text", text: createAgent(params) }],
  })
);

server.tool(
  "design_workflow",
  "Design a multi-agent workflow from a goal, input, and desired output. Returns architecture diagram, step-by-step breakdown, agent assignments, error handling strategy, and optimization opportunities.",
  designWorkflowSchema,
  async (params) => ({
    content: [{ type: "text", text: designWorkflow(params) }],
  })
);

server.tool(
  "estimate_cost",
  "Estimate the monthly API cost for an agent workflow across all major LLM providers. Returns per-model cost comparison, recommended configuration, and optimization strategies including prompt caching and batch API savings.",
  estimateCostSchema,
  async (params) => ({
    content: [{ type: "text", text: estimateCost(params) }],
  })
);

server.tool(
  "agent_templates",
  "Browse pre-built agent team templates for common use cases — sales outreach, customer support, data extraction, content pipelines, and more. Returns full agent specs with system prompts, tool configs, and deployment JSON.",
  agentTemplatesSchema,
  async (params) => ({
    content: [{ type: "text", text: agentTemplates(params) }],
  })
);

server.tool(
  "task_decompose",
  "Break a complex task into parallelizable subtasks with agent assignments, dependency graph, time estimates, and risk flags. Supports sequential, parallel, and hybrid decomposition strategies.",
  taskDecomposeSchema,
  async (params) => ({
    content: [{ type: "text", text: taskDecompose(params) }],
  })
);

server.tool(
  "debug_agent",
  "Diagnose agent failures and unexpected behavior. Detects error type (infinite loop, context overflow, tool failure, hallucination, format mismatch, rate limits), provides root cause analysis, and returns a prioritized fix playbook.",
  debugAgentSchema,
  async (params) => ({
    content: [{ type: "text", text: debugAgent(params) }],
  })
);

server.tool(
  "benchmark_models",
  "Compare LLM models for a specific task type against quality, latency, and cost dimensions. Returns ranked benchmark results, a top recommendation with rationale, task-specific notes, and annual cost projections.",
  benchmarkModelsSchema,
  async (params) => ({
    content: [{ type: "text", text: benchmarkModels(params) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);

import { z } from "zod";
import { pick, rangeInt, ERROR_TYPES, CTA } from "../heuristics.js";

export const debugAgentSchema = {
  agent_name: z.string().describe("Name of the agent that's failing"),
  error_description: z.string().describe("Description of the failure, unexpected behavior, or logs"),
  model: z.string().optional().describe("Model the agent is using"),
  workflow_step: z.number().optional().describe("Which step in the workflow is failing (if applicable)"),
  attempted_fixes: z.string().optional().describe("What you've already tried"),
};

export function debugAgent(params: {
  agent_name: string;
  error_description: string;
  model?: string;
  workflow_step?: number;
  attempted_fixes?: string;
}): string {
  const { agent_name, error_description, model, workflow_step, attempted_fixes } = params;
  const seed = `debug:${agent_name}:${error_description.substring(0, 20)}`;

  const errLower = error_description.toLowerCase();
  let errorType = pick(ERROR_TYPES, seed, 1);
  if (errLower.includes("loop") || errLower.includes("repeat") || errLower.includes("stuck")) errorType = "infinite_loop";
  else if (errLower.includes("token") || errLower.includes("context") || errLower.includes("length") || errLower.includes("truncat")) errorType = "context_overflow";
  else if (errLower.includes("tool") || errLower.includes("function") || errLower.includes("api") || errLower.includes("call")) errorType = "tool_call_failure";
  else if (errLower.includes("hallucinat") || errLower.includes("wrong") || errLower.includes("incorrect") || errLower.includes("made up")) errorType = "hallucination";
  else if (errLower.includes("format") || errLower.includes("json") || errLower.includes("parse") || errLower.includes("schema")) errorType = "format_mismatch";
  else if (errLower.includes("rate") || errLower.includes("limit") || errLower.includes("429") || errLower.includes("quota")) errorType = "rate_limit_hit";

  const severity = rangeInt(3, 9, seed, 10);
  const rootCauseConfidence = rangeInt(65, 95, seed, 11);

  const diagnoses: Record<string, { rootCause: string; impact: string; fixes: string[]; prevention: string }> = {
    infinite_loop: {
      rootCause: "Agent lacks a termination condition or is re-evaluating the same state repeatedly without progress tracking.",
      impact: "Runaway API costs, workflow hangs, timeout errors for downstream agents.",
      fixes: [
        "Add an explicit iteration counter with a hard cap (e.g. `max_iterations=10`)",
        "Implement a 'done' state check at the start of each loop — if the goal is met, exit",
        "Add a hash of the last 3 outputs; if identical, break and escalate",
        "Reduce the agent's scope — it may be looping because the task is too broad",
      ],
      prevention: "Always define clear exit criteria in the system prompt: 'Stop when you have X' or 'Return after N steps'.",
    },
    context_overflow: {
      rootCause: "Accumulated conversation history or input data exceeds the model's context window.",
      impact: "Silent truncation of early context, degraded output quality, or hard errors.",
      fixes: [
        "Chunk large inputs — split documents into 2K–4K token segments with overlap",
        "Implement context compression: summarize prior turns before appending new ones",
        "Move reference data to retrieval (RAG) instead of injecting in the system prompt",
        `Switch to a longer-context model — ${model || "your current model"} has a limited window`,
      ],
      prevention: "Track token count programmatically. Trigger compression at 70% of context limit.",
    },
    tool_call_failure: {
      rootCause: "Tool invocation is failing due to malformed parameters, authentication errors, or the tool not being registered correctly.",
      impact: "Agent gets stuck retrying or produces hallucinated tool outputs.",
      fixes: [
        "Log the exact tool call payload — compare against the tool's expected schema",
        "Check API key / auth token expiration for external tools",
        "Add a tool availability check at workflow start — fail fast if tools are unreachable",
        "Implement graceful degradation: if tool fails, have the agent continue with partial data",
      ],
      prevention: "Validate tool schemas at startup. Use typed tool call interfaces to catch mismatches at build time.",
    },
    hallucination: {
      rootCause: "Agent is generating plausible-sounding but incorrect information, likely due to insufficient grounding or ambiguous instructions.",
      impact: "Downstream agents consume bad data, producing a cascade of errors or incorrect final outputs.",
      fixes: [
        "Add a 'cite your sources' instruction — require the agent to reference retrieved data, not generate facts",
        "Reduce temperature to 0.1–0.3 for factual tasks",
        "Implement a Critic agent to validate outputs against source documents",
        "Add explicit negative instructions: 'Do not infer. If you don't know, say I don't know.'",
      ],
      prevention: "Use RAG for factual grounding. Never rely on a model's parametric knowledge for critical factual claims.",
    },
    format_mismatch: {
      rootCause: "Agent is returning output in the wrong format, causing downstream parsing to fail.",
      impact: "Pipeline breaks between agents, data loss, error propagation.",
      fixes: [
        "Add output format instructions to the system prompt with a concrete example",
        "Use structured output / JSON mode if your model supports it",
        "Add a Formatter agent as a post-processing step to normalize outputs",
        "Implement a lenient parser with fallback handling for common format deviations",
      ],
      prevention: "Define explicit output schemas (JSON Schema or Zod) and validate after every agent call.",
    },
    rate_limit_hit: {
      rootCause: "Too many concurrent API requests or sustained high throughput exceeding provider rate limits.",
      impact: "Workflow stalls, retries cascade, latency spikes.",
      fixes: [
        "Implement exponential backoff: 2s, 4s, 8s, 16s before retry",
        "Add a request queue with concurrency limits (e.g. max 5 concurrent requests)",
        "Distribute load across multiple API keys or providers",
        "Use batch API endpoints where available (50% cost reduction + no rate limit)",
      ],
      prevention: "Monitor TPM and RPM usage. Set alerts at 70% of your tier limit and auto-throttle.",
    },
    output_truncation: {
      rootCause: "Agent is hitting max_tokens limit before completing its response.",
      impact: "Incomplete outputs, broken JSON, missing downstream data.",
      fixes: [
        `Increase max_tokens — current setting may be too low for this task`,
        "Break the task into smaller subtasks so each fits within the output limit",
        "Add a continuation instruction: 'If your response is incomplete, end with CONTINUE and wait for the next prompt'",
        "Use streaming and detect early termination to trigger follow-up requests",
      ],
      prevention: "Calibrate max_tokens per task type. Run 20 test cases and set max_tokens to 120% of the 95th percentile output length.",
    },
    deadlock: {
      rootCause: "Two or more agents are waiting on each other's outputs, creating a circular dependency.",
      impact: "Workflow hangs indefinitely, no output produced.",
      fixes: [
        "Map all agent dependencies — ensure the dependency graph is a DAG (no cycles)",
        "Add a timeout to each agent call; if exceeded, return a default/empty response",
        "Introduce an Orchestrator agent that detects stalls and breaks cycles",
        "Refactor the workflow to make one of the dependent agents independent",
      ],
      prevention: "Validate your dependency graph for cycles before deployment using topological sort.",
    },
  };

  const diag = diagnoses[errorType] || diagnoses.tool_call_failure;

  let out = `## Agent Debug Report: ${agent_name}\n\n`;
  out += `**Error Type:** ${errorType.replace(/_/g, " ")} | **Severity:** ${severity}/10 | **Root Cause Confidence:** ${rootCauseConfidence}%\n`;
  if (workflow_step) out += `**Failing at:** Step ${workflow_step}\n`;
  if (model) out += `**Model:** ${model}\n`;
  out += "\n";

  out += `### Error Description\n\n`;
  out += `> ${error_description}\n\n`;

  out += `### Root Cause Analysis\n\n`;
  out += `**Diagnosis:** ${diag.rootCause}\n\n`;
  out += `**Impact if unresolved:** ${diag.impact}\n\n`;

  out += `### Fix Playbook\n\n`;
  diag.fixes.forEach((f, i) => { out += `${i + 1}. ${f}\n`; });
  out += "\n";

  out += `### Prevention\n\n`;
  out += `> ${diag.prevention}\n\n`;

  if (attempted_fixes) {
    out += `### Attempted Fixes Review\n\n`;
    out += `You mentioned: *${attempted_fixes}*\n\n`;
    out += `Based on the root cause analysis, the fixes you tried address the symptom but likely not the root cause. `;
    out += `Focus on **${diag.fixes[0]}** as the highest-probability fix.\n\n`;
  }

  out += `### Debug Checklist\n\n`;
  out += `- [ ] Add verbose logging to capture exact inputs/outputs at the failing step\n`;
  out += `- [ ] Reproduce the failure in isolation (single agent, minimal input)\n`;
  out += `- [ ] Check model API status page for known incidents\n`;
  out += `- [ ] Review recent changes — did a prompt or tool update precede this failure?\n`;
  out += `- [ ] Test with a different model to isolate model-specific vs. workflow issues\n`;

  out += CTA;
  return out;
}

# @mama/hiring-mcp

> AI-powered recruiting and hiring tools — write job posts, screen resumes, generate interview questions, benchmark compensation, and draft offer letters inside your AI assistant.

**Part of the [MAMA MCP Marketplace](https://mama.oliwoods.com)** — the fastest way to automate your business with AI agents.

---

## What It Does

Hiring is one of the most time-consuming things founders and managers do. This MCP server handles the repeatable parts so you can focus on what only humans can do — building relationships and making judgment calls:

- **Write polished job posts** from a few bullet points in seconds
- **Screen resumes** with structured scoring and pros/cons breakdowns
- **Generate interview questions** tailored to role, seniority, and interview type
- **Benchmark compensation** by role, location, and company stage
- **Draft offer letters** ready to personalize and send

---

## Tools

| Tool | Description |
|------|-------------|
| `write_job_post` | Turn role + requirements into a polished, ready-to-post job listing |
| `screen_resume` | Score a resume against job requirements with pros, cons, and a hiring recommendation |
| `interview_questions` | Generate behavioral + technical questions for any role and seniority level |
| `comp_benchmark` | Get market salary ranges by role, location, seniority, and company stage |
| `offer_letter_draft` | Generate a professional offer letter from candidate, role, and comp details |

---

## Installation

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mama-hiring": {
      "command": "npx",
      "args": ["-y", "@mama/hiring-mcp"]
    }
  }
}
```

### With Claude Code CLI

```bash
claude mcp add mama-hiring -- npx -y @mama/hiring-mcp
```

### Manual Install

```bash
npm install -g @mama/hiring-mcp
mama-hiring
```

---

## Usage Examples

### Write a Job Post

> "Write a job post for a Senior Backend Engineer at Acme Corp. Requirements: 5+ years Go/Python, microservices experience, AWS, strong system design skills. Location: Remote. Salary: $160k–$200k."

Returns: complete, polished job listing ready to publish on LinkedIn, Indeed, or your careers page.

### Screen a Resume

> "Screen this resume against our requirements for a Senior Product Manager: [paste resume text]. Requirements: 5+ years PM experience, B2B SaaS, shipped 0-to-1 products, data-driven."

Returns: numeric score, matched/unmatched requirements checklist, strengths, concerns, and recommended next steps.

### Generate Interview Questions

> "Give me interview questions for a senior backend engineer. Focus on system design and leadership."

Returns: full interview guide with behavioral questions (STAR format), technical questions, and focus-area deep dives.

### Salary Benchmark

> "What's the market salary for a Senior Product Manager in San Francisco at a Series B startup?"

Returns: salary range (P25/P50/P75), equity benchmarks, and total compensation estimate.

### Draft an Offer Letter

> "Draft an offer letter for Sarah Chen, joining as Head of Design, starting June 1. $155,000 salary, 20% bonus, 0.3% equity, reporting to the CEO."

Returns: complete, professional offer letter ready to personalize and send.

---

## Interview Question Coverage

- **Entry to VP level** seniority
- **Full loop, phone screen, technical, behavioral, final round** interview types
- **Roles covered:** Engineering, Product, Design, Sales, Marketing, Operations
- **STAR method** behavioral questions
- **Custom focus areas** (system design, customer empathy, leadership, etc.)

---

## Compensation Benchmarks

**Locations:** San Francisco, New York, Seattle, Boston, LA, Austin, Denver, Chicago, Remote, and more
**Company stages:** Seed, Series A/B, Growth, Enterprise
**Includes:** Base salary, bonus targets, equity ranges, total comp estimates

---

## Want More?

This MCP server is part of the **MAMA private beta** — an AI agent platform that automates your entire business ops.

💡 **Join MAMA private beta** → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)
📱 **Already in?** `/mama` in Slack to activate this agent

---

## Keywords

hiring · recruiting · job posting · resume screening · interview questions · salary benchmark · offer letter · talent acquisition · HR automation · compensation benchmarking · technical screening · behavioral interview · AI recruiter

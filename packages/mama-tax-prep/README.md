# @mama/tax-prep-mcp

> AI-powered tax preparation tools for freelancers, self-employed professionals, and small businesses — directly inside your AI assistant.

**Part of the [MAMA MCP Marketplace](https://mama.oliwoods.com)** — the fastest way to automate your business with AI agents.

---

## What It Does

Stop switching tabs to research tax deadlines, calculate quarterly estimates, or hunt for deductions. This MCP server brings all of it directly into Claude (or any MCP-compatible AI assistant):

- **Scan receipts** and extract structured data instantly
- **Find deductions** specific to your profession or business type
- **Calculate quarterly tax estimates** with safe harbor guidance
- **Convert business miles** to IRS-compliant deduction amounts
- **Never miss a tax deadline** with an entity-specific tax calendar

---

## Tools

| Tool | Description |
|------|-------------|
| `receipt_scanner` | Extract vendor, date, line items, subtotal, tax, and total from raw receipt text |
| `deduction_finder` | Get a list of applicable deductions by profession (freelancer, real estate, software, etc.) |
| `quarterly_estimate` | Calculate quarterly estimated tax payments for self-employed filers |
| `mileage_calculator` | Convert business miles to a tax deduction using current IRS rates |
| `tax_calendar` | Get entity-specific federal tax deadlines (sole prop, LLC, S-Corp, C-Corp, partnership) |

---

## Installation

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mama-tax-prep": {
      "command": "npx",
      "args": ["-y", "@mama/tax-prep-mcp"]
    }
  }
}
```

### With Claude Code CLI

```bash
claude mcp add mama-tax-prep -- npx -y @mama/tax-prep-mcp
```

### Manual Install

```bash
npm install -g @mama/tax-prep-mcp
mama-tax-prep
```

---

## Usage Examples

### Scan a Receipt

> "Scan this receipt: Starbucks Coffee / Date: 03/15/2024 / Latte $6.50 / Sandwich $9.75 / Tax $1.47 / Total $17.72"

Returns: structured data with vendor, items, amounts, and business-use tips.

### Find Your Deductions

> "I'm a freelance software consultant working from home. What can I deduct?"

Returns: categorized list of universal + profession-specific deductions with IRS schedule references.

### Calculate Quarterly Taxes

> "Estimate my quarterly taxes. I expect $120,000 net profit this year, single filer, based in California."

Returns: federal income tax + self-employment tax breakdown, per-quarter payment amounts, and safe harbor guidance.

### Mileage Deduction

> "I drove 4,200 business miles this year. What's my deduction for 2024?"

Returns: `$2,814.00` (at $0.67/mile) with IRS documentation requirements.

### Tax Calendar

> "What are all my tax deadlines as an S-Corp?"

Returns: full year calendar with form numbers and due dates.

---

## Supported Professions (deduction_finder)

- Freelance designers, photographers, videographers
- Software engineers and consultants
- Real estate agents and brokers
- Business consultants and coaches
- Writers, bloggers, and content creators
- Any self-employed professional (universal deductions)

---

## 2024 IRS Mileage Rates

| Purpose | Rate |
|---------|------|
| Business | $0.67/mile |
| Medical | $0.21/mile |
| Charitable | $0.14/mile |

---

## Want More?

This MCP server is part of the **MAMA private beta** — an AI agent platform that automates your entire business ops.

💡 **Join MAMA private beta** → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)
📱 **Already in?** `/mama` in Slack to activate this agent

---

## Keywords

tax preparation · tax deductions · self-employed taxes · quarterly taxes · receipt scanner · freelancer taxes · mileage deduction · 1099 contractor · IRS deadlines · small business taxes · AI tax assistant

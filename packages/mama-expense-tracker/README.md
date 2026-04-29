# @mama/expense-tracker-mcp

> AI-powered expense tracking — categorize transactions, check budgets, generate spending reports, analyze vendors, and split expenses inside your AI assistant.

**Part of the [MAMA MCP Marketplace](https://mama.oliwoods.com)** — the fastest way to automate your business with AI agents.

---

## What It Does

Expense tracking is tedious until it's too late — then it's painful. This MCP server brings intelligent expense analysis directly into your AI assistant so you can stay on top of business finances without switching to another app:

- **Auto-categorize transactions** with tax-deductibility flags and IRS schedule references
- **Check budget vs. actuals** by category with visual status indicators
- **Generate spending reports** with chart-ready JSON data
- **Analyze vendors** to surface top spend, recurring charges, and savings opportunities
- **Split expenses** equally, by percentage, or itemized — with payment request messages

---

## Tools

| Tool | Description |
|------|-------------|
| `categorize_transaction` | Auto-categorize a vendor + amount with tax-deductible flag and IRS reference |
| `budget_check` | Compare actual spending to budget by category with RAG status |
| `spending_report` | Generate a spending summary grouped by category, vendor, or week |
| `vendor_analysis` | Surface top vendors, recurring charges, and savings opportunities |
| `split_expense` | Split a receipt equally, by percentage, or itemized — with payment messages |

---

## Installation

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mama-expense-tracker": {
      "command": "npx",
      "args": ["-y", "@mama/expense-tracker-mcp"]
    }
  }
}
```

### With Claude Code CLI

```bash
claude mcp add mama-expense-tracker -- npx -y @mama/expense-tracker-mcp
```

### Manual Install

```bash
npm install -g @mama/expense-tracker-mcp
mama-expense-tracker
```

---

## Usage Examples

### Categorize a Transaction

> "Categorize this transaction: Adobe Creative Cloud, $54.99."

Returns: Category: Software & SaaS | ✅ 100% Tax Deductible | IRS Schedule C, Line 18 | Record-keeping tips.

### Check Your Budget

> "Check my budget: I budgeted $500 for software and $200 for meals. I've spent $620 on software and $90 on meals."

Returns: table with budget vs. actual, variance, % used, and 🔴/🟡/🟢 status per category.

### Generate a Spending Report

> "Here are my transactions for March: AWS $450, Slack $87, Zoom $15, Delta Airlines $320, Marriott $210, Chipotle $18. Give me a spending report."

Returns: category breakdown with percentages, bar chart visualization, chart JSON, and insights.

### Analyze Vendors

> "Analyze these 20 transactions and tell me who my top vendors are and if there are any savings opportunities."

Returns: ranked vendor table, recurring charge flags, volume discount opportunities, and concentration analysis.

### Split an Expense

> "Split a $180 dinner bill (including 20% tip) equally between Alice, Bob, and Carol."

Returns: per-person amounts ($72 each), payment request messages ready to copy and send.

---

## Category Coverage

| Category | Example Vendors | Deductible |
|----------|----------------|-----------|
| Software & SaaS | Adobe, Slack, AWS, GitHub | ✅ 100% |
| Travel | Airlines, Hotels, Uber, Car Rentals | ✅ 100% |
| Office Supplies | Amazon, Staples, Costco | ✅ 100% |
| Advertising | Google Ads, Meta Ads, LinkedIn Ads | ✅ 100% |
| Meals | Restaurants, Cafes, DoorDash | ✅ 50% |
| Phone & Internet | AT&T, Verizon, Comcast | ✅ ~50% |
| Health Insurance | Medical, Dental, Pharmacy | ✅ 100% |
| Entertainment | Netflix, Concerts, Games | ❌ Personal |
| Groceries | Trader Joe's, Whole Foods | ❌ Personal |

---

## Want More?

This MCP server is part of the **MAMA private beta** — an AI agent platform that automates your entire business ops.

💡 **Join MAMA private beta** → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)
📱 **Already in?** `/mama` in Slack to activate this agent

---

## Keywords

expense tracker · budget · spending analysis · receipt categorization · business expenses · expense management · financial reporting · vendor analysis · expense splitting · tax deductible · bookkeeping · AI expense tracker

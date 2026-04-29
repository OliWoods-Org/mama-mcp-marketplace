# @mama/meeting-prep-mcp

> AI-powered meeting preparation — research attendees, build agendas, prepare talking points, draft follow-ups, and summarize meetings inside your AI assistant.

**Part of the [MAMA MCP Marketplace](https://mama.oliwoods.com)** — the fastest way to automate your business with AI agents.

---

## What It Does

Most meetings fail not because people don't care — but because they weren't prepared. This MCP server handles the entire meeting lifecycle so you can walk in confident and follow up effectively:

- **Research attendees** and get a background brief before the call
- **Build structured agendas** with time allocations for any meeting type
- **Generate talking points** for each agenda item with anticipation of pushback
- **Draft follow-up emails** with decisions and action items already formatted
- **Summarize meeting notes** into structured action items and decisions

---

## Tools

| Tool | Description |
|------|-------------|
| `research_attendees` | Get a background brief, research checklist, and icebreakers for each attendee |
| `build_agenda` | Generate a time-blocked agenda for any meeting type and duration |
| `talking_points` | Create key talking points and supporting data for each agenda item |
| `draft_followup` | Write a follow-up email with decisions, action items, and next steps |
| `meeting_summary` | Extract action items, decisions, and open questions from notes or a transcript |

---

## Installation

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mama-meeting-prep": {
      "command": "npx",
      "args": ["-y", "@mama/meeting-prep-mcp"]
    }
  }
}
```

### With Claude Code CLI

```bash
claude mcp add mama-meeting-prep -- npx -y @mama/meeting-prep-mcp
```

### Manual Install

```bash
npm install -g @mama/meeting-prep-mcp
mama-meeting-prep
```

---

## Usage Examples

### Research Attendees

> "I have a sales call tomorrow with Sarah Kim (VP of Engineering) at Stripe. Brief me."

Returns: research checklist, suggested icebreakers, and conversation angles specific to a sales call with a VP Eng.

### Build a Meeting Agenda

> "Build an agenda for a 60-minute project kickoff with 5 attendees."

Returns: time-blocked agenda with sections, time allocations, owners, and facilitator notes.

### Prepare Talking Points

> "My agenda items are: Q1 performance review, proposed budget increase, team hiring plan. I'm presenting to the exec team."

Returns: structured talking points for each item, frameworks to use, and anticipated hard questions with suggested responses.

### Draft a Follow-Up

> "Draft a follow-up email for today's meeting. Decisions: we're proceeding with the rebrand. Actions: Sarah owns brand guidelines by April 15, Tom owns website copy by April 22."

Returns: complete, professional follow-up email ready to send.

### Summarize Meeting Notes

> "Summarize these meeting notes and pull out all the action items: [paste raw notes or transcript]"

Returns: extracted decisions, action items with owners, open questions, and key topics discussed.

---

## Meeting Types Supported

| Type | Description |
|------|-------------|
| `sales_call` | Discovery → demo → objections → next steps |
| `team_standup` | Yesterday / today / blockers / shoutouts |
| `project_kickoff` | Goals → scope → timeline → ways of working |
| `strategy_review` | Context → performance → options → decision |
| `1_on_1` | Check-in → priorities → challenges → feedback → growth |
| `client_review` | Results → wins → challenges → next priorities |
| `brainstorm` | Frame → diverge → converge → refine |
| `decision_meeting` | Context → options → discussion → decision → comms |
| `interview` | Intro → background → behavioral → technical → Q&A |

---

## Want More?

This MCP server is part of the **MAMA private beta** — an AI agent platform that automates your entire business ops.

💡 **Join MAMA private beta** → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)
📱 **Already in?** `/mama` in Slack to activate this agent

---

## Keywords

meeting preparation · agenda builder · meeting notes · follow-up email · business meetings · meeting summary · action items · attendee research · talking points · executive assistant · meeting automation · AI meeting assistant

#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MAMA_CTA = `\n---\n💡 Want this automated 24/7? Join MAMA private beta → mama.oliwoods.com/beta\n📱 Already in? /mama in Slack to activate this agent`;

const server = new McpServer({
  name: "mama-meeting-prep",
  version: "1.0.0",
});

// ── research_attendees ───────────────────────────────────────────────────────
server.tool(
  "research_attendees",
  "Generate a background brief for meeting attendees based on their names and companies",
  {
    attendees: z.array(z.object({
      name: z.string().describe("Full name"),
      company: z.string().optional().describe("Company or organization"),
      title: z.string().optional().describe("Job title"),
      linkedin_url: z.string().optional().describe("LinkedIn profile URL if known"),
      context: z.string().optional().describe("Any additional context (e.g. 'referred by Jane', 'inbound lead from webinar')"),
    })).describe("List of meeting attendees to research"),
    meeting_purpose: z.string().optional().describe("What the meeting is about (sales call, partnership, job interview, etc.)"),
    your_company: z.string().optional().describe("Your company name for contextualizing the conversation"),
  },
  async ({ attendees, meeting_purpose, your_company }) => {
    const purposeNote = meeting_purpose ? `\n> **Meeting Purpose:** ${meeting_purpose}` : "";
    const yourCo = your_company ? `\n> **Your Company:** ${your_company}` : "";

    const briefs = attendees.map((a) => {
      const titleLine = a.title ? ` — ${a.title}` : "";
      const companyLine = a.company ? ` at ${a.company}` : "";

      // Research preparation checklist based on what's known
      const researchItems: string[] = [];
      if (a.company) {
        researchItems.push(`Review ${a.company}'s recent news, blog posts, or press releases`);
        researchItems.push(`Check ${a.company}'s LinkedIn page: company size, industry, recent activity`);
        researchItems.push(`Look up ${a.company}'s funding history and key investors (Crunchbase / PitchBook)`);
        researchItems.push(`Review their website: product/service, customers, recent announcements`);
      }
      if (a.name) {
        researchItems.push(`Search "${a.name}${a.company ? ` ${a.company}` : ""}" on LinkedIn`);
        researchItems.push(`Search for any public talks, podcasts, or articles by ${a.name.split(" ")[0]}`);
        researchItems.push(`Check Twitter/X for ${a.name}'s recent posts or opinions`);
      }

      const icebreakers = [
        a.context ? `Connection context: ${a.context}` : null,
        a.company ? `"I noticed ${a.company} recently [recent news/launch] — how is that going?"` : null,
        a.title?.toLowerCase().includes("founder") || a.title?.toLowerCase().includes("ceo")
          ? `"What inspired you to start ${a.company}?"` : null,
        `"What are the biggest priorities for your team right now?"`,
        `"How did you get into [their field]?"`,
      ].filter(Boolean) as string[];

      const conversationAngles = [];
      if (meeting_purpose?.toLowerCase().includes("sales") || meeting_purpose?.toLowerCase().includes("demo")) {
        conversationAngles.push("Understand their current workflow and pain points before pitching");
        conversationAngles.push("Ask about their decision-making process and key stakeholders");
        conversationAngles.push("Identify their timeline and budget parameters");
      }
      if (meeting_purpose?.toLowerCase().includes("partner")) {
        conversationAngles.push("Explore complementary customer segments and shared value");
        conversationAngles.push("Understand how they typically structure partnerships");
        conversationAngles.push("Ask about their past partnership experiences and what worked/didn't");
      }
      if (meeting_purpose?.toLowerCase().includes("interview")) {
        conversationAngles.push("Research their team's recent projects and challenges");
        conversationAngles.push("Understand their management style and team culture");
        conversationAngles.push("Prepare thoughtful questions about the role's success metrics");
      }
      if (conversationAngles.length === 0) {
        conversationAngles.push("Listen more than you talk — understand their priorities first");
        conversationAngles.push("Find shared interests or common connections to build rapport");
        conversationAngles.push("Be prepared with 2–3 sharp questions specific to their role");
      }

      return `### ${a.name}${titleLine}${companyLine}

**Research Checklist:**
${researchItems.map((r) => `- [ ] ${r}`).join("\n")}

**Suggested Icebreakers:**
${icebreakers.map((i) => `- "${i}"`).join("\n")}

**Conversation Angles for This Meeting:**
${conversationAngles.map((c) => `- ${c}`).join("\n")}

${a.linkedin_url ? `**LinkedIn:** ${a.linkedin_url}\n` : ""}`;
    });

    const result = `## 🔍 Attendee Research Brief
${purposeNote}${yourCo}

---

${briefs.join("\n---\n\n")}

---

### Meeting Prep Checklist (Do Before the Meeting)
- [ ] Complete research for each attendee above
- [ ] Review any prior email threads or Slack messages with these contacts
- [ ] Prepare your 60-second company/role intro (if first meeting)
- [ ] Write down your top 3 goals for this specific meeting
- [ ] Prepare 5 questions — real curiosity, not just fillers
- [ ] Test your audio/video if virtual (5 min before, not 30 seconds before)
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── build_agenda ─────────────────────────────────────────────────────────────
server.tool(
  "build_agenda",
  "Generate a structured meeting agenda from purpose and attendee context",
  {
    meeting_purpose: z.string().describe("What this meeting needs to accomplish"),
    attendees: z.array(z.string()).describe("List of attendee names or roles"),
    duration_minutes: z.number().min(15).max(480).optional().default(60).describe("Meeting duration in minutes"),
    meeting_type: z.enum(["sales_call", "team_standup", "project_kickoff", "strategy_review", "1_on_1", "client_review", "brainstorm", "decision_meeting", "interview"]).optional().default("strategy_review"),
    pre_read_materials: z.array(z.string()).optional().describe("Documents or materials attendees should review beforehand"),
  },
  async ({ meeting_purpose, attendees, duration_minutes, meeting_type, pre_read_materials }) => {
    const buffer = 5; // always end early
    const usable = duration_minutes - buffer;

    // Time allocation templates by meeting type
    const templates: Record<string, { section: string; pct: number; description: string }[]> = {
      sales_call: [
        { section: "Introductions & rapport building", pct: 0.10, description: "Quick personal intros, establish warmth" },
        { section: "Agenda alignment", pct: 0.05, description: "Confirm agenda and goals for the call" },
        { section: "Discovery: their context, challenges, goals", pct: 0.30, description: "Ask open-ended questions; listen actively" },
        { section: "Solution presentation / demo", pct: 0.30, description: "Tailor your pitch/demo to what you just learned" },
        { section: "Q&A and objection handling", pct: 0.15, description: "Address concerns; build confidence" },
        { section: "Next steps", pct: 0.10, description: "Agree on follow-up, timeline, and who does what" },
      ],
      team_standup: [
        { section: "What I did yesterday", pct: 0.30, description: "Each person: 1–2 sentences, no stories" },
        { section: "What I'm doing today", pct: 0.30, description: "Focus and priority for the day" },
        { section: "Blockers", pct: 0.20, description: "Flag anything that needs team input" },
        { section: "Shoutouts / announcements", pct: 0.20, description: "Quick wins and team news" },
      ],
      project_kickoff: [
        { section: "Project overview & goals", pct: 0.20, description: "Why we're doing this, success metrics" },
        { section: "Team introductions and roles", pct: 0.10, description: "RACI — who owns what" },
        { section: "Scope and deliverables", pct: 0.20, description: "What's in, what's out, key milestones" },
        { section: "Timeline and dependencies", pct: 0.20, description: "Key dates, risks, and blockers" },
        { section: "Ways of working", pct: 0.15, description: "Communication channels, meeting cadence, tools" },
        { section: "Open questions and next steps", pct: 0.15, description: "Parking lot items and immediate actions" },
      ],
      strategy_review: [
        { section: "Context setting", pct: 0.10, description: "Where we are, why this review now" },
        { section: "Performance review", pct: 0.25, description: "What's working, what's not — data-first" },
        { section: "Strategic options", pct: 0.30, description: "Options on the table with pros/cons" },
        { section: "Decision making", pct: 0.20, description: "Agree on path forward" },
        { section: "Action items and owners", pct: 0.15, description: "Who does what by when" },
      ],
      "1_on_1": [
        { section: "Check in", pct: 0.10, description: "How are you doing? Personal pulse check" },
        { section: "Their updates and priorities", pct: 0.30, description: "What's on their plate, what's progressing" },
        { section: "Challenges and support needed", pct: 0.25, description: "Where they're stuck or need help" },
        { section: "Feedback (two-way)", pct: 0.20, description: "What's going well, what could be better" },
        { section: "Career and growth check-in", pct: 0.15, description: "Goals, development, trajectory" },
      ],
      client_review: [
        { section: "Welcome and agenda overview", pct: 0.05, description: "Set the tone and confirm agenda" },
        { section: "Results and performance review", pct: 0.30, description: "Metrics, outcomes, vs. baseline" },
        { section: "Key wins", pct: 0.20, description: "Highlight successes and impact" },
        { section: "Challenges and learnings", pct: 0.20, description: "Honest review of what didn't work" },
        { section: "Next period priorities", pct: 0.15, description: "What we're focusing on next" },
        { section: "Q&A and feedback", pct: 0.10, description: "Their questions and concerns" },
      ],
      brainstorm: [
        { section: "Problem framing", pct: 0.15, description: "Align on what exactly we're solving" },
        { section: "Diverge: idea generation (no filtering)", pct: 0.40, description: "All ideas welcome — quantity over quality" },
        { section: "Converge: clustering and voting", pct: 0.25, description: "Group ideas, dot-vote or rank" },
        { section: "Refine top ideas", pct: 0.10, description: "Flesh out the top 2–3 concepts" },
        { section: "Next steps", pct: 0.10, description: "Who explores what, by when" },
      ],
      decision_meeting: [
        { section: "Decision context", pct: 0.10, description: "What decision needs to be made and why now" },
        { section: "Pre-read review", pct: 0.10, description: "Clarifying questions on pre-work" },
        { section: "Options review", pct: 0.25, description: "Walk through each option with data" },
        { section: "Open discussion", pct: 0.25, description: "Debate assumptions, surface risks" },
        { section: "Decision", pct: 0.15, description: "Reach resolution or escalate" },
        { section: "Communication plan", pct: 0.15, description: "How and when we share this decision" },
      ],
      interview: [
        { section: "Welcome and intro", pct: 0.08, description: "Company and interviewer intro, set agenda" },
        { section: "Candidate background overview", pct: 0.15, description: "Walk me through your background" },
        { section: "Behavioral questions", pct: 0.30, description: "STAR-method situational questions" },
        { section: "Technical / role-specific questions", pct: 0.25, description: "Depth on relevant skills and experience" },
        { section: "Candidate Q&A", pct: 0.15, description: "Their questions — this signals engagement" },
        { section: "Next steps", pct: 0.07, description: "Timeline, process, and follow-up" },
      ],
    };

    const template = templates[meeting_type] ?? templates.strategy_review;

    const agendaItems = template.map((item) => ({
      ...item,
      minutes: Math.round(usable * item.pct),
    }));

    const totalScheduled = agendaItems.reduce((s, i) => s + i.minutes, 0);

    const result = `## 📋 Meeting Agenda

**Purpose:** ${meeting_purpose}
**Attendees:** ${attendees.join(", ")}
**Duration:** ${duration_minutes} minutes (${buffer} min buffer at end)
**Type:** ${meeting_type.replace(/_/g, " ")}

${pre_read_materials && pre_read_materials.length > 0
  ? `### 📄 Pre-Read Materials (send 24hrs in advance)\n${pre_read_materials.map((m) => `- ${m}`).join("\n")}\n`
  : ""}

### Agenda

| # | Time | Topic | Owner | Notes |
|---|------|-------|-------|-------|
${agendaItems.map((item, i) => `| ${i + 1} | ${item.minutes} min | **${item.section}** | TBD | ${item.description} |`).join("\n")}
| | ${buffer} min | Buffer / Hard stop | | End on time |

**Total:** ${totalScheduled + buffer} min / ${duration_minutes} min

---

### Meeting Norms (suggested)
- 📵 No phones / multitasking — be present
- ✋ Use raised hand or reaction emoji (virtual) to queue comments
- 📝 One designated note-taker — rotate this role
- ⏱️ Facilitator is responsible for time-keeping
- 🅿️ Parking lot for off-topic items — don't derail

### Facilitator Notes
- Send this agenda 24 hours before the meeting
- Start with a quick win or positive news to set the tone
- End 5 minutes early to recap action items while everyone's still on
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── talking_points ────────────────────────────────────────────────────────────
server.tool(
  "talking_points",
  "Generate key talking points and supporting data for each agenda item",
  {
    agenda_items: z.array(z.string()).describe("List of agenda topics or sections"),
    meeting_context: z.string().optional().describe("Background on the meeting (what's the situation, who's involved, what's at stake)"),
    your_role: z.string().optional().describe("Your role in the meeting (presenter, decision maker, contributor, etc.)"),
    desired_outcome: z.string().optional().describe("What you want to achieve by the end of this meeting"),
    key_data: z.array(z.string()).optional().describe("Key metrics, facts, or data points to reference"),
  },
  async ({ agenda_items, meeting_context, your_role, desired_outcome, key_data }) => {
    const outcomeNote = desired_outcome ? `\n> **Goal:** ${desired_outcome}` : "";
    const roleNote = your_role ? `\n> **Your role:** ${your_role}` : "";

    const points = agenda_items.map((item, idx) => {
      const itemLower = item.toLowerCase();

      const openingLines = [
        `"I want to start by sharing context on why ${item} matters right now..."`,
        `"Before we dive in, here's the situation with ${item}..."`,
        `"The key question for ${item} is: [your specific question]"`,
      ];

      const supportingFrameworks: string[] = [];
      if (/performance|results|metrics|data/.test(itemLower)) {
        supportingFrameworks.push("Lead with the number, then the story — not the other way around");
        supportingFrameworks.push("Compare to baseline, prior period, or industry benchmark");
        supportingFrameworks.push("Acknowledge what's working before addressing gaps");
      }
      if (/decision|options|choices/.test(itemLower)) {
        supportingFrameworks.push("Present 2–3 options with clear trade-offs, not just your preferred one");
        supportingFrameworks.push("Use a simple decision matrix: Impact vs. Effort, Risk vs. Reward");
        supportingFrameworks.push("Be clear about who makes the call and what 'good' looks like");
      }
      if (/problem|challenge|risk|issue/.test(itemLower)) {
        supportingFrameworks.push("Frame it: what's happening, what's the impact, what do you need");
        supportingFrameworks.push("Come with a proposed solution or ask, not just the problem");
        supportingFrameworks.push("Use data to size the problem — avoids drama, increases credibility");
      }
      if (/update|status|progress/.test(itemLower)) {
        supportingFrameworks.push("Use RAG status: 🟢 Green (on track) / 🟡 Amber (risk) / 🔴 Red (blocked)");
        supportingFrameworks.push("Highlight decisions needed from this group");
        supportingFrameworks.push("Surface risks early — surprises later are worse");
      }
      if (supportingFrameworks.length === 0) {
        supportingFrameworks.push("Start with the headline, then support with evidence");
        supportingFrameworks.push("Anticipate the 3 hardest questions you might get and prepare answers");
        supportingFrameworks.push("End each section with a clear 'so what' or ask");
      }

      const dataForItem = key_data && key_data.length > 0
        ? key_data.slice(idx % key_data.length, (idx % key_data.length) + 2)
        : [];

      return `### ${idx + 1}. ${item}

**Opening:** ${openingLines[idx % openingLines.length]}

**Talking Points:**
${supportingFrameworks.map((f) => `- ${f}`).join("\n")}
${dataForItem.length > 0 ? `\n**Reference Data:**\n${dataForItem.map((d) => `- ${d}`).join("\n")}` : ""}

**Anticipate Pushback On:** _"[What's the most likely objection or hard question here?]"_
**Your Response:** _"[Prepare your answer in advance]"_
`;
    });

    const result = `## 🎯 Talking Points
${meeting_context ? `\n> **Context:** ${meeting_context}` : ""}${outcomeNote}${roleNote}

---

${points.join("\n---\n")}

---

### Universal Tips for All Agenda Items
- Lead with the bottom line — senior stakeholders want the conclusion first
- Use the rule of 3: most people retain 3 key points per topic, maximum
- Pause deliberately after key points — don't rush through the good stuff
- Reference pre-reads if distributed: "As you saw in the doc..."
- Flag whenever you're switching topics: "Moving on to..."

### If You Get Off-Track
"That's a great point — let me add it to our parking lot and we can cover it after the main agenda."
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── draft_followup ────────────────────────────────────────────────────────────
server.tool(
  "draft_followup",
  "Draft a professional follow-up email from meeting notes, capturing decisions and next steps",
  {
    meeting_title: z.string().describe("Title or subject of the meeting"),
    attendees: z.array(z.string()).describe("Names (and optionally emails) of meeting attendees"),
    meeting_date: z.string().describe("Date the meeting took place"),
    key_decisions: z.array(z.string()).optional().describe("Decisions made during the meeting"),
    action_items: z.array(z.object({
      task: z.string(),
      owner: z.string(),
      due_date: z.string().optional(),
    })).optional().describe("Action items with owners and due dates"),
    notes: z.string().optional().describe("Any additional meeting notes or context"),
    your_name: z.string().optional().describe("Your name for the signature"),
    next_meeting: z.string().optional().describe("Next meeting date or cadence"),
  },
  async ({ meeting_title, attendees, meeting_date, key_decisions, action_items, notes, your_name, next_meeting }) => {
    const sender = your_name ?? "[Your Name]";
    const decisions = key_decisions ?? [];
    const actions = action_items ?? [];

    const result = `## ✉️ Follow-Up Email Draft

**To:** ${attendees.join(", ")}
**Subject:** Follow-Up: ${meeting_title} – ${meeting_date}

---

Hi ${attendees[0]?.split(" ")[0] ?? "team"},

Thanks for the time today — great conversation. Here's a quick recap of where we landed.

${decisions.length > 0 ? `**Decisions Made:**\n${decisions.map((d) => `- ${d}`).join("\n")}\n` : ""}

${actions.length > 0 ? `**Action Items:**\n\n| Task | Owner | Due Date |\n|------|-------|----------|\n${actions.map((a) => `| ${a.task} | ${a.owner} | ${a.due_date ?? "TBD"} |`).join("\n")}\n` : ""}

${notes ? `**Notes:**\n${notes}\n` : ""}

${next_meeting ? `**Next Meeting:** ${next_meeting}. I'll send a calendar invite.\n` : ""}

Please let me know if I missed anything or if any of the above needs adjusting. Looking forward to the next steps!

Best,
${sender}

---
_Tip: Send this email within 2 hours of the meeting for best recall and accountability._
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── meeting_summary ───────────────────────────────────────────────────────────
server.tool(
  "meeting_summary",
  "Extract structured action items, decisions, and key takeaways from meeting transcript or notes",
  {
    transcript_or_notes: z.string().describe("Meeting transcript, raw notes, or any text capturing what happened in the meeting"),
    meeting_title: z.string().optional().describe("Meeting title or subject"),
    attendees: z.array(z.string()).optional().describe("List of attendee names"),
    meeting_date: z.string().optional().describe("Date of the meeting"),
  },
  async ({ transcript_or_notes, meeting_title, attendees, meeting_date }) => {
    const text = transcript_or_notes;
    const words = text.split(/\s+/);

    // Extract action item signals
    const actionPatterns = [
      /(?:will|going to|needs to|action:|TODO:|next step:|follow up|reach out|send|schedule|create|review|update|prepare|build|check|confirm|look into)\s+[^.!?\n]{5,100}/gi,
      /(?:action item|AI|@\w+)[:\s]+[^.!?\n]{10,100}/gi,
    ];

    const extractedActions: string[] = [];
    for (const pattern of actionPatterns) {
      const matches = text.match(pattern);
      if (matches) extractedActions.push(...matches.slice(0, 5));
    }

    // Extract decision signals
    const decisionPatterns = [
      /(?:decided|agreed|confirmed|going with|will proceed|approved|resolved)[^.!?\n]{5,150}/gi,
      /(?:decision:|we'll|the team agreed)[^.!?\n]{5,150}/gi,
    ];

    const extractedDecisions: string[] = [];
    for (const pattern of decisionPatterns) {
      const matches = text.match(pattern);
      if (matches) extractedDecisions.push(...matches.slice(0, 5));
    }

    // Extract open questions signals
    const questionPattern = /(?:open question|still TBD|not clear|need to figure out|unclear|pending)[^.!?\n]{5,150}/gi;
    const openQuestions = (text.match(questionPattern) ?? []).slice(0, 3);

    // Key themes from frequent nouns
    const frequentTerms = words
      .filter((w) => w.length > 5)
      .reduce<Record<string, number>>((acc, w) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, "");
        acc[clean] = (acc[clean] ?? 0) + 1;
        return acc;
      }, {});
    const topTerms = Object.entries(frequentTerms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w]) => w);

    const result = `## 📝 Meeting Summary
${meeting_title ? `**Meeting:** ${meeting_title}` : ""}
${meeting_date ? `**Date:** ${meeting_date}` : ""}
${attendees && attendees.length > 0 ? `**Attendees:** ${attendees.join(", ")}` : ""}

---

### Key Decisions
${extractedDecisions.length > 0
  ? extractedDecisions.map((d) => `- ✅ ${d.trim()}`).join("\n")
  : "- *No explicit decisions extracted — review notes for decisions made*"}

### Action Items
${extractedActions.length > 0
  ? extractedActions.map((a, i) => `${i + 1}. ${a.trim()} — **Owner:** [assign owner] **Due:** [date]`).join("\n")
  : "- *No action items explicitly mentioned — add them manually*"}

### Open Questions / Parking Lot
${openQuestions.length > 0
  ? openQuestions.map((q) => `- ❓ ${q.trim()}`).join("\n")
  : "- *No open questions extracted from notes*"}

### Topics Discussed
${topTerms.map((t) => `- ${t.charAt(0).toUpperCase() + t.slice(1)}`).join("\n")}

---

### Raw Notes (for Reference)
${text.slice(0, 800)}${text.length > 800 ? "\n\n_[Notes truncated for summary — full text preserved in source]_" : ""}

---

### Recommended Follow-Up
1. Assign owners to all action items above within 24 hours
2. Send follow-up email with decisions + action items to all attendees
3. Schedule follow-up meeting if needed
4. Archive notes in your team wiki or project management tool
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MAMA Meeting Prep MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

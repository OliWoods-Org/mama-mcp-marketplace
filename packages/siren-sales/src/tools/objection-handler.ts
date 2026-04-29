import { z } from "zod";
import { pick, rangeInt, OBJECTIONS, CTA } from "../heuristics.js";

export const objectionHandlerSchema = {
  objection: z.string().describe("The exact objection the prospect raised, in their words"),
  product_name: z.string().describe("Your product or service name"),
  deal_stage: z.enum(["prospecting", "discovery", "demo", "proposal", "closing"]).describe("Current deal stage"),
  context: z.string().optional().describe("Additional context about the prospect or deal"),
};

export function objectionHandler(params: {
  objection: string;
  product_name: string;
  deal_stage: string;
  context?: string;
}): string {
  const { objection, product_name, deal_stage, context } = params;
  const seed = `objection:${objection}:${deal_stage}`;

  const objLower = objection.toLowerCase();
  let objType = "need";
  if (objLower.includes("expensive") || objLower.includes("cost") || objLower.includes("budget") || objLower.includes("price")) objType = "price";
  else if (objLower.includes("time") || objLower.includes("quarter") || objLower.includes("later") || objLower.includes("busy")) objType = "timing";
  else if (objLower.includes("competitor") || objLower.includes("already use") || objLower.includes("current vendor")) objType = "competitor";
  else if (objLower.includes("build") || objLower.includes("in-house") || objLower.includes("engineer")) objType = "diy";
  else if (objLower.includes("boss") || objLower.includes("ceo") || objLower.includes("board") || objLower.includes("approve")) objType = "authority";
  else if (objLower.includes("trust") || objLower.includes("heard") || objLower.includes("reference")) objType = "trust";

  const riskLevel = rangeInt(20, 85, seed, 1);
  const recoveryChance = rangeInt(40, 90, seed, 2);

  const responses: Record<string, { reframe: string; responses: string[]; probe: string; redFlag: boolean }> = {
    price: {
      reframe: "This is a value conversation, not a price conversation. The prospect hasn't connected cost to ROI yet.",
      responses: [
        `"Totally fair — let me ask: what's the current cost of NOT solving this? For most ${product_name} customers, the problem costs 3-5x our price annually."`,
        `"What budget would make this a no-brainer? Let me see if there's a package that fits, and we can scale up."`,
        `"If I could show you a 6-month payback model using your own numbers, would that change the conversation?"`,
        `"Is it the total price or the timing of spend? We have flexible structures — quarterly, usage-based, milestone-based."`,
      ],
      probe: "What's the budget allocated for this initiative — even ballpark?",
      redFlag: false,
    },
    timing: {
      reframe: "Timing objections usually mask either low urgency or low authority. Diagnose first.",
      responses: [
        `"I hear you — what specifically needs to happen before you'd want to move forward?"`,
        `"What changes next quarter that makes it a better time? I want to understand so I can plan accordingly."`,
        `"The companies that wait usually spend that quarter watching the problem get worse. Is there a risk to waiting?"`,
        `"Could we do a pilot that doesn't require full commitment? It lets you get started without disrupting anything."`,
      ],
      probe: "On a scale of 1–10, how much of a priority is solving this problem in the next 90 days?",
      redFlag: deal_stage === "closing",
    },
    competitor: {
      reframe: "Don't attack the incumbent. Focus on the gap between what they have and what they need.",
      responses: [
        `"Makes sense — what do you love about them? And what's the one thing you wish they did better?"`,
        `"Many of our best customers came from [Competitor]. The reason they switched was usually [specific gap]. Is that something you've run into?"`,
        `"I'm not here to replace them for everything — what if ${product_name} handled the part they're weakest at?"`,
        `"When's your renewal? Even if you stay, it's worth having a benchmark. What would you need to see to consider it?"`,
      ],
      probe: "What would need to be true about [Competitor] for you to put the relationship up for evaluation?",
      redFlag: false,
    },
    diy: {
      reframe: "Build vs. buy objections need a total cost of ownership conversation — including opportunity cost.",
      responses: [
        `"Totally valid. What's the estimated engineering time and cost? Our customers typically find we're faster and cheaper when you factor in maintenance."`,
        `"What would your engineers be working on instead? The real cost is the opportunity cost, not just the build cost."`,
        `"We started as a build-it-yourself problem too — the companies that chose ${product_name} did so because they wanted to stay focused on their core product."`,
        `"Would it help to see our architecture? Sometimes it clarifies what's harder to build than it looks."`,
      ],
      probe: "Who would own the build, and how does that compare to their other priorities this quarter?",
      redFlag: false,
    },
    authority: {
      reframe: "Missing decision maker involvement is a pipeline risk. Get a multi-threading commitment now.",
      responses: [
        `"Of course — I'd love to support that conversation. Could we set up a 20-minute call with your boss so I can answer their questions directly?"`,
        `"Totally understand. What concerns do you think they'll raise? I can help you prepare a one-pager."`,
        `"What's your read on their appetite for this? Are you coming in as a champion or just presenting options?"`,
        `"I've done this dance before — the deals that close fastest are where we get the right people in a room early. Can we make that happen?"`,
      ],
      probe: "What's your boss's biggest concern usually — budget, risk, or fit with existing tools?",
      redFlag: deal_stage === "proposal" || deal_stage === "closing",
    },
    trust: {
      reframe: "Trust objections need social proof tailored to their exact situation — same industry, same size, same pain.",
      responses: [
        `"Totally reasonable — we're newer in your space. Would it help to talk to one of our customers in ${objType === "trust" ? "your industry" : "a similar role"}? I can arrange a reference call."`,
        `"Here's what I'd suggest: a 30-day pilot with clear success criteria. No commitment until you've seen results."`,
        `"I can share our security docs, SOC 2 report, and uptime history. What specifically would you want to validate?"`,
        `"What would give you enough confidence to run a small test? Let's define that together."`,
      ],
      probe: "What would make you confident enough to run a small pilot?",
      redFlag: false,
    },
    need: {
      reframe: "If they say they don't have the problem, either your diagnosis was wrong or they haven't felt the pain yet.",
      responses: [
        `"Help me understand — when you think about [pain area], how do you handle it today? Maybe I'm solving the wrong problem."`,
        `"That's actually good to hear. What IS the problem you're most focused on solving right now?"`,
        `"Interesting — most companies your size in ${deal_stage === "discovery" ? "your space" : "this stage"} feel this acutely. What's different about your setup?"`,
        `"Got it. What's the initiative you ARE prioritizing this quarter? I want to understand if ${product_name} fits elsewhere."`,
      ],
      probe: "What's the #1 operational problem your team would solve if you had unlimited resources?",
      redFlag: deal_stage === "demo" || deal_stage === "proposal",
    },
  };

  const config = responses[objType];

  let out = `## Objection Handler\n\n`;
  out += `**Objection:** "${objection}"\n`;
  out += `**Type Detected:** ${objType.charAt(0).toUpperCase() + objType.slice(1)} objection | **Stage:** ${deal_stage}\n\n`;

  out += `### Threat Assessment\n\n`;
  out += `| Metric | Value |\n`;
  out += `|--------|-------|\n`;
  out += `| Deal Risk | ${riskLevel > 65 ? "🔴" : riskLevel > 40 ? "🟡" : "🟢"} ${riskLevel}/100 |\n`;
  out += `| Recovery Probability | ${recoveryChance}% |\n`;
  out += `| Red Flag | ${config.redFlag ? "⚠️ Yes — escalate immediately" : "No"} |\n\n`;

  out += `### Reframe\n\n`;
  out += `> ${config.reframe}\n\n`;

  out += `### Response Playbook\n\n`;
  config.responses.forEach((r, i) => { out += `**Option ${i + 1}:** ${r}\n\n`; });

  out += `### Diagnostic Probe\n\n`;
  out += `> ${config.probe}\n\n`;

  out += `### What Not to Do\n\n`;
  out += `- Don't immediately cave on price — that signals lack of confidence\n`;
  out += `- Don't argue or fight the objection — validate first\n`;
  out += `- Don't accept "maybe later" — always tie back to their stated pain\n`;
  out += `- Don't lose your cool — objections are buying signals in disguise\n`;

  if (context) {
    out += `\n### Context Notes\n\n`;
    out += `${context}\n`;
  }

  out += CTA;
  return out;
}

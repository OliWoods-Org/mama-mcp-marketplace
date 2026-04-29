#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const MAMA_CTA = `\n---\n💡 Want this automated 24/7? Join MAMA private beta → mama.oliwoods.com/beta\n📱 Already in? /mama in Slack to activate this agent`;
const server = new McpServer({
    name: "mama-hiring",
    version: "1.0.0",
});
// ── write_job_post ───────────────────────────────────────────────────────────
server.tool("write_job_post", "Generate a polished, compelling job listing from role details and requirements", {
    role_title: z.string().describe("Job title (e.g. 'Senior Product Designer')"),
    company_name: z.string().describe("Company name"),
    company_description: z.string().optional().describe("1-2 sentence company description"),
    requirements: z.array(z.string()).describe("List of requirements or responsibilities"),
    nice_to_haves: z.array(z.string()).optional().describe("Optional nice-to-have skills"),
    salary_range: z.string().optional().describe("Salary range (e.g. '$90,000 - $120,000')"),
    location: z.string().optional().describe("Location or 'Remote'"),
    employment_type: z.enum(["full_time", "part_time", "contract", "internship"]).optional().default("full_time"),
}, async ({ role_title, company_name, company_description, requirements, nice_to_haves, salary_range, location, employment_type }) => {
    const empTypeLabel = {
        full_time: "Full-Time",
        part_time: "Part-Time",
        contract: "Contract",
        internship: "Internship",
    }[employment_type] ?? "Full-Time";
    const result = `# ${role_title} at ${company_name}

**Location:** ${location ?? "Remote / Flexible"}
**Employment Type:** ${empTypeLabel}
${salary_range ? `**Compensation:** ${salary_range}` : ""}

---

## About ${company_name}
${company_description ?? `${company_name} is a growing company building innovative solutions. We're looking for exceptional talent to join our team.`}

We believe in building a diverse, inclusive workplace where every team member can do their best work. We move fast, support each other, and take pride in our craft.

---

## The Role

We're looking for a **${role_title}** to join our team${location ? ` in ${location}` : ""}. You'll play a key role in ${requirements[0]?.toLowerCase() ?? "driving impact across the business"} and collaborate closely with cross-functional partners.

This is a high-impact ${empTypeLabel.toLowerCase()} role with real ownership from day one.

---

## What You'll Do
${requirements.map((r) => `- ${r}`).join("\n")}

---

## What We're Looking For
${requirements.slice(0, 5).map((r) => `- ${r}`).join("\n")}
- Strong communication and collaboration skills
- A bias toward action and a growth mindset

${nice_to_haves && nice_to_haves.length > 0 ? `## Nice to Have\n${nice_to_haves.map((n) => `- ${n}`).join("\n")}\n` : ""}

---

## What We Offer
- ${salary_range ? `Competitive compensation (${salary_range})` : "Competitive compensation based on experience"}
- Meaningful equity participation
- Comprehensive health, dental, and vision benefits
- Flexible PTO and a results-driven culture
- Learning & development budget
- Opportunity to shape a high-growth product

---

## How to Apply

Ready to join us? Apply at [careers link] or send your resume and a brief note about why you're excited about this role.

*${company_name} is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.*
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── screen_resume ────────────────────────────────────────────────────────────
server.tool("screen_resume", "Score a resume against job requirements and return structured pros, cons, and hiring recommendation", {
    resume_text: z.string().describe("Full resume text (paste from PDF or plain text)"),
    job_requirements: z.array(z.string()).describe("Required qualifications and responsibilities"),
    nice_to_haves: z.array(z.string()).optional().describe("Preferred but not required skills"),
    role_title: z.string().optional().describe("Role being applied for"),
    seniority_level: z.enum(["entry", "mid", "senior", "staff", "principal", "director"]).optional().default("mid"),
}, async ({ resume_text, job_requirements, nice_to_haves, role_title, seniority_level }) => {
    const resumeLower = resume_text.toLowerCase();
    // Keyword matching for each requirement
    const reqResults = job_requirements.map((req) => {
        const keywords = req.toLowerCase().split(/[\s,\/]+/).filter((w) => w.length > 3);
        const matched = keywords.filter((kw) => resumeLower.includes(kw));
        const matchRatio = keywords.length > 0 ? matched.length / keywords.length : 0;
        return { req, matched: matchRatio >= 0.4, matchRatio, matched_terms: matched };
    });
    const niceToHaveResults = (nice_to_haves ?? []).map((nth) => {
        const keywords = nth.toLowerCase().split(/[\s,\/]+/).filter((w) => w.length > 3);
        const matched = keywords.filter((kw) => resumeLower.includes(kw));
        return { req: nth, matched: matched.length > 0 };
    });
    const metCount = reqResults.filter((r) => r.matched).length;
    const score = Math.round((metCount / reqResults.length) * 100);
    const niceCount = niceToHaveResults.filter((r) => r.matched).length;
    // Infer experience signals
    const yearsMatch = resume_text.match(/(\d+)\+?\s*years?/i);
    const yearsExp = yearsMatch ? parseInt(yearsMatch[1]) : null;
    const hasLeadership = /led|managed|owned|drove|directed|head of/i.test(resume_text);
    const hasDegree = /bachelor|master|phd|b\.s\.|m\.s\.|b\.a\.|m\.b\.a/i.test(resume_text);
    const hasMetrics = /\d+%|\$\d+|increased|reduced|improved|grew|scaled/i.test(resume_text);
    const pros = [];
    const cons = [];
    reqResults.filter((r) => r.matched).forEach((r) => pros.push(`Matches requirement: "${r.req}"`));
    reqResults.filter((r) => !r.matched).forEach((r) => cons.push(`Possibly missing: "${r.req}"`));
    if (hasLeadership)
        pros.push("Shows leadership experience");
    if (hasMetrics)
        pros.push("Quantifies impact with metrics");
    if (hasDegree)
        pros.push("Has relevant degree");
    if (niceCount > 0)
        pros.push(`Meets ${niceCount}/${niceToHaveResults.length} nice-to-haves`);
    const seniorityExpMap = {
        entry: [0, 2], mid: [2, 5], senior: [5, 10], staff: [7, 15], principal: [10, 20], director: [8, 20],
    };
    const [minYrs, maxYrs] = seniorityExpMap[seniority_level] ?? [0, 99];
    if (yearsExp !== null) {
        if (yearsExp < minYrs)
            cons.push(`May be underqualified: ~${yearsExp} years vs. ${minYrs}+ expected for ${seniority_level}`);
        if (yearsExp > maxYrs + 3)
            pros.push(`Overqualified: ${yearsExp} years experience`);
    }
    const recommendation = score >= 75 ? "✅ Strong Candidate — Advance to Phone Screen"
        : score >= 50 ? "🟡 Potential — Review Carefully Before Deciding"
            : "❌ Likely Not a Match — Consider Skipping";
    const result = `## 📋 Resume Screen: ${role_title ?? "Open Role"} (${seniority_level})

### Overall Score: ${score}/100
**Recommendation:** ${recommendation}

### Requirements Match (${metCount}/${reqResults.length} met)
${reqResults.map((r) => `${r.matched ? "✅" : "❌"} ${r.req}`).join("\n")}

${niceToHaveResults.length > 0 ? `### Nice-to-Haves (${niceCount}/${niceToHaveResults.length} met)\n${niceToHaveResults.map((r) => `${r.matched ? "✅" : "⬜"} ${r.req}`).join("\n")}\n` : ""}

### Strengths
${pros.length > 0 ? pros.map((p) => `+ ${p}`).join("\n") : "+ No strong signals detected"}

### Concerns
${cons.length > 0 ? cons.map((c) => `- ${c}`).join("\n") : "- No significant gaps found"}

### Recommended Next Steps
${score >= 75 ? `1. Schedule 30-min phone screen\n2. Verify: ${cons[0] ?? "confirm culture fit"}\n3. Prepare technical/portfolio review for next round` : score >= 50 ? `1. Review resume more carefully — consider a brief screening call\n2. Ask directly about gaps in: ${cons.slice(0, 2).map((c) => c.replace("Possibly missing: ", "")).join(", ")}\n3. Weigh against other applicants` : `1. Send polite rejection\n2. Keep in pipeline for more junior roles if applicable`}
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── interview_questions ──────────────────────────────────────────────────────
server.tool("interview_questions", "Generate a structured set of behavioral and technical interview questions for a role", {
    role_title: z.string().describe("Job title (e.g. 'Backend Engineer', 'Account Executive')"),
    seniority_level: z.enum(["entry", "mid", "senior", "staff", "principal", "director"]).optional().default("mid"),
    focus_areas: z.array(z.string()).optional().describe("Specific skills or competencies to probe (e.g. 'system design', 'customer empathy')"),
    interview_type: z.enum(["full_loop", "phone_screen", "technical", "behavioral", "final"]).optional().default("full_loop"),
}, async ({ role_title, seniority_level, focus_areas, interview_type }) => {
    const roleLower = role_title.toLowerCase();
    const isEngineer = /engineer|developer|software|backend|frontend|fullstack|data|ml|devops/.test(roleLower);
    const isSales = /sales|account|revenue|bdr|sdr|ae/.test(roleLower);
    const isDesign = /design|ux|ui|product design/.test(roleLower);
    const isProduct = /product|pm|program manager/.test(roleLower);
    const isMarketing = /marketing|growth|content|brand/.test(roleLower);
    const behavioralCore = [
        "Tell me about a time you disagreed with a decision. How did you handle it?",
        "Describe a project that didn't go as planned. What did you do?",
        "Give an example of when you had to prioritize multiple urgent tasks. How did you decide what to tackle first?",
        "Tell me about a time you received critical feedback. How did you respond?",
        "Describe a situation where you had to influence without authority.",
    ];
    const seniorBehavioral = [
        "Tell me about a time you had to make a high-stakes decision with limited information.",
        "Describe a time you identified a systemic problem and drove organizational change.",
        "Give an example of when you had to build alignment across multiple teams or stakeholders.",
    ];
    const technicalByRole = {
        engineer: [
            "Walk me through how you'd design a URL shortening service at scale.",
            "How do you approach debugging a production issue you've never seen before?",
            "Explain the tradeoffs between SQL and NoSQL databases.",
            "What does it mean for code to be 'maintainable'? How do you ensure your code meets that bar?",
            "Tell me about the most technically challenging project you've worked on.",
        ],
        sales: [
            "Walk me through your sales process from prospecting to close.",
            "Tell me about the largest deal you've closed. What made it successful?",
            "How do you handle objections around price?",
            "Describe how you build and manage your pipeline.",
            "Tell me about a deal you lost — what did you learn?",
        ],
        design: [
            "Walk me through a recent project from brief to final delivery.",
            "How do you handle feedback that contradicts your design decisions?",
            "How do you balance user needs against business constraints?",
            "Describe your process for defining success metrics for a design project.",
            "Tell me about a time your design research revealed something surprising.",
        ],
        product: [
            "How do you decide what to build next when you have more ideas than capacity?",
            "Tell me about a product decision you made that turned out to be wrong.",
            "How do you align engineering, design, and stakeholders around a roadmap?",
            "Describe how you write a great PRD.",
            "Walk me through how you'd launch a new feature from idea to GA.",
        ],
        marketing: [
            "Tell me about a campaign that significantly exceeded your expectations.",
            "How do you measure the ROI of a content or brand initiative?",
            "Describe your process for developing a go-to-market strategy.",
            "Tell me about a launch that didn't land — what happened and what did you learn?",
            "How do you approach segmentation and targeting?",
        ],
    };
    const roleCategory = isEngineer ? "engineer" : isSales ? "sales" : isDesign ? "design" : isProduct ? "product" : isMarketing ? "marketing" : "engineer";
    const technicalQs = technicalByRole[roleCategory] ?? technicalByRole.engineer;
    const focusQs = (focus_areas ?? []).map((area) => `[${area}] Describe a specific situation where your ${area} skills made a decisive difference.`);
    const includesSenior = ["senior", "staff", "principal", "director"].includes(seniority_level);
    const behavioralList = [...behavioralCore, ...(includesSenior ? seniorBehavioral : [])];
    const phoneScreen = [
        "Tell me about your background and what brings you to this role.",
        "What are you looking for in your next opportunity?",
        `What makes you a strong candidate for a ${role_title} position?`,
        "What's your ideal working environment?",
        "Any questions for us about the role?",
    ];
    const finalRound = [
        "What do you see as the biggest challenge in this role in the first 90 days?",
        "Where do you want to be in 3–5 years, and how does this role fit?",
        "What would make you turn down an offer?",
        "How do you stay current in your field?",
    ];
    let sections = [];
    if (interview_type === "phone_screen") {
        sections = [
            `### Phone Screen Questions\n${phoneScreen.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
        ];
    }
    else if (interview_type === "behavioral") {
        sections = [
            `### Behavioral Questions (STAR method)\n${behavioralList.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
        ];
    }
    else if (interview_type === "technical") {
        sections = [
            `### Technical Questions\n${technicalQs.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
        ];
    }
    else {
        sections = [
            `### Opening / Warmup\n${phoneScreen.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
            `### Behavioral Questions (STAR method)\n${behavioralList.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
            `### Technical / Role-Specific Questions\n${technicalQs.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
            focusQs.length > 0 ? `### Focus Area Questions\n${focusQs.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : "",
            interview_type === "final" ? `### Final Round Questions\n${finalRound.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : "",
        ].filter(Boolean);
    }
    const result = `## 🎯 Interview Questions: ${role_title} (${seniority_level})
**Interview Type:** ${interview_type.replace(/_/g, " ")}

${sections.join("\n\n")}

---
### Interview Tips
- Use the **STAR method** (Situation, Task, Action, Result) to evaluate behavioral answers
- Listen for **specificity** — vague answers often indicate limited experience
- Take notes in real time for fairer post-interview comparison
- Leave 10 minutes at the end for candidate questions (strong signal of engagement)
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── comp_benchmark ───────────────────────────────────────────────────────────
server.tool("comp_benchmark", "Get a market salary range for a role based on title, location, and seniority", {
    role_title: z.string().describe("Job title (e.g. 'Product Manager', 'Data Engineer')"),
    location: z.string().describe("City, state, or 'Remote' (e.g. 'San Francisco, CA', 'Austin TX', 'Remote')"),
    seniority_level: z.enum(["entry", "mid", "senior", "staff", "principal", "director", "vp"]).optional().default("mid"),
    company_stage: z.enum(["startup_seed", "startup_series_a_b", "growth", "enterprise"]).optional().default("growth"),
}, async ({ role_title, location, seniority_level, company_stage }) => {
    const roleLower = role_title.toLowerCase();
    // Base salary bands by role category (USD, 2024)
    const baseBands = {
        engineer: {
            entry: [75000, 110000], mid: [110000, 150000], senior: [150000, 200000],
            staff: [190000, 260000], principal: [230000, 320000], director: [220000, 300000], vp: [280000, 400000],
        },
        product: {
            entry: [70000, 100000], mid: [100000, 145000], senior: [140000, 195000],
            staff: [185000, 250000], principal: [220000, 300000], director: [210000, 290000], vp: [250000, 380000],
        },
        design: {
            entry: [65000, 95000], mid: [90000, 130000], senior: [125000, 175000],
            staff: [165000, 220000], principal: [200000, 270000], director: [190000, 265000], vp: [230000, 330000],
        },
        sales: {
            entry: [50000, 75000], mid: [70000, 120000], senior: [110000, 175000],
            staff: [160000, 230000], principal: [190000, 260000], director: [180000, 280000], vp: [220000, 380000],
        },
        marketing: {
            entry: [50000, 70000], mid: [70000, 105000], senior: [100000, 150000],
            staff: [140000, 200000], principal: [175000, 240000], director: [160000, 240000], vp: [200000, 320000],
        },
        data: {
            entry: [75000, 105000], mid: [105000, 145000], senior: [140000, 190000],
            staff: [180000, 250000], principal: [220000, 300000], director: [210000, 290000], vp: [260000, 380000],
        },
        operations: {
            entry: [55000, 80000], mid: [75000, 110000], senior: [105000, 155000],
            staff: [150000, 210000], principal: [185000, 255000], director: [180000, 260000], vp: [220000, 320000],
        },
    };
    // Location multipliers
    const locationMults = {
        "san francisco": 1.35, "new york": 1.30, "seattle": 1.25, "boston": 1.20,
        "los angeles": 1.20, "austin": 1.05, "denver": 1.05, "chicago": 1.10,
        "miami": 1.00, "remote": 1.00, "raleigh": 0.95, "phoenix": 0.90,
    };
    const locLower = location.toLowerCase();
    const locKey = Object.keys(locationMults).find((k) => locLower.includes(k));
    const locationMult = locLower.includes("remote") ? 1.0 : (locKey ? locationMults[locKey] : 1.0);
    const locationLabel = locLower.includes("remote") ? "remote-adjusted national average" : `${location} market`;
    // Stage adjustments (base salary)
    const stageSalaryMult = {
        startup_seed: 0.80, startup_series_a_b: 0.90, growth: 1.00, enterprise: 1.10,
    };
    // Equity as % of comp by stage
    const equityLabel = {
        startup_seed: "1.0–3.0% equity (vesting 4yr cliff 1yr)",
        startup_series_a_b: "0.1–1.0% equity",
        growth: "0.05–0.3% equity",
        enterprise: "RSUs: $30K–$150K/yr",
    };
    const roleCategory = roleLower.includes("engineer") || roleLower.includes("developer") || roleLower.includes("software") || roleLower.includes("backend") || roleLower.includes("frontend") ? "engineer"
        : roleLower.includes("product") ? "product"
            : roleLower.includes("design") || roleLower.includes("ux") ? "design"
                : roleLower.includes("sales") || roleLower.includes("account") || roleLower.includes("bdr") ? "sales"
                    : roleLower.includes("market") || roleLower.includes("content") || roleLower.includes("growth") ? "marketing"
                        : roleLower.includes("data") || roleLower.includes("analyst") || roleLower.includes("ml") ? "data"
                            : "operations";
    const bands = baseBands[roleCategory] ?? baseBands.engineer;
    const [baseLow, baseHigh] = bands[seniority_level] ?? bands.mid;
    const salaryMult = (stageSalaryMult[company_stage] ?? 1.0) * locationMult;
    const adjLow = Math.round((baseLow * salaryMult) / 1000) * 1000;
    const adjHigh = Math.round((baseHigh * salaryMult) / 1000) * 1000;
    const midpoint = Math.round((adjLow + adjHigh) / 2 / 1000) * 1000;
    const result = `## 💼 Compensation Benchmark: ${role_title}

| | Low | Midpoint | High |
|-|-----|----------|------|
| **Base Salary** | $${adjLow.toLocaleString()} | $${midpoint.toLocaleString()} | $${adjHigh.toLocaleString()} |

**Seniority:** ${seniority_level}
**Location:** ${locationLabel}
**Company Stage:** ${company_stage.replace(/_/g, " ")}

### Total Compensation (Estimated)
- **Base:** $${adjLow.toLocaleString()} – $${adjHigh.toLocaleString()}
- **Bonus:** ${seniority_level === "director" || seniority_level === "vp" ? "15–25% of base" : "10–15% of base"} (performance-based)
- **Equity:** ${equityLabel[company_stage]}
- **Benefits:** Health/dental/vision + 401k (est. $15K–$30K value)

### Market Context
- P25 (below market): $${Math.round(adjLow * 0.9 / 1000) * 1000}
- P50 (at market): $${midpoint.toLocaleString()}
- P75 (above market): $${Math.round(adjHigh * 1.05 / 1000) * 1000}

### Benchmarking Sources
- Levels.fyi, Glassdoor, LinkedIn Salary, Radford/Aon
- These are market estimates — always validate with recent job postings and compensation surveys

> 💡 Tip: At ${company_stage.replace(/_/g, " ")} stage, top candidates often negotiate 10–20% above initial offers. Leave room.
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── offer_letter_draft ───────────────────────────────────────────────────────
server.tool("offer_letter_draft", "Generate a professional offer letter from candidate, role, and compensation details", {
    candidate_name: z.string().describe("Candidate's full name"),
    role_title: z.string().describe("Job title"),
    company_name: z.string().describe("Company name"),
    start_date: z.string().describe("Proposed start date"),
    base_salary: z.number().describe("Annual base salary in USD"),
    bonus_target: z.number().optional().describe("Target annual bonus amount or percentage"),
    equity: z.string().optional().describe("Equity grant description (e.g. '10,000 options' or '0.5%')"),
    reporting_to: z.string().optional().describe("Manager's name and title"),
    location: z.string().optional().describe("Work location or 'Remote'"),
    offer_expiry: z.string().optional().describe("Offer expiration date"),
    additional_benefits: z.array(z.string()).optional().describe("List of additional benefits"),
}, async ({ candidate_name, role_title, company_name, start_date, base_salary, bonus_target, equity, reporting_to, location, offer_expiry, additional_benefits }) => {
    const bonusText = bonus_target
        ? bonus_target > 1 && bonus_target < 100
            ? `${bonus_target}% of base salary ($${Math.round(base_salary * bonus_target / 100).toLocaleString()})`
            : `$${bonus_target.toLocaleString()}`
        : null;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const result = `# Offer Letter – ${candidate_name}

---

**${today}**

Dear ${candidate_name},

On behalf of the entire team at **${company_name}**, I am thrilled to extend this offer of employment. We were impressed by your experience and believe you'll be a tremendous asset to our team.

---

## Your Offer at a Glance

**Position:** ${role_title}
**Start Date:** ${start_date}
**Location:** ${location ?? "Remote / To Be Confirmed"}
${reporting_to ? `**Reports To:** ${reporting_to}` : ""}

---

## Compensation & Benefits

**Base Salary:** $${base_salary.toLocaleString()} per year, paid in accordance with ${company_name}'s standard payroll schedule.

${bonusText ? `**Performance Bonus:** You will be eligible for an annual performance bonus targeted at ${bonusText}. Bonus payments are discretionary and based on individual and company performance.\n` : ""}
${equity ? `**Equity:** As part of your compensation package, you will receive ${equity}. Equity is subject to the company's standard vesting schedule (typically 4-year vest with 1-year cliff) and the terms of the company's equity plan.\n` : ""}

**Benefits Include:**
- Medical, dental, and vision insurance
- 401(k) with company match
- Flexible PTO policy
- $1,500 annual learning & development stipend
${(additional_benefits ?? []).map((b) => `- ${b}`).join("\n")}

---

## Employment Conditions

This offer is contingent upon:
1. Successful completion of a background check
2. Verification of your legal authorization to work in the United States
3. Signing of ${company_name}'s standard Employee Confidentiality and Invention Assignment Agreement

This is an **at-will employment** offer. Either party may terminate employment at any time, with or without cause or notice.

---

## Accepting This Offer

Please review this offer carefully. ${offer_expiry ? `This offer expires on **${offer_expiry}**.` : "Please respond at your earliest convenience."} To accept, sign and return this letter.

We are genuinely excited about what we'll build together. Please don't hesitate to reach out with any questions.

Welcome to ${company_name}!

Warm regards,

___________________________
[Hiring Manager Name]
[Title]
${company_name}

---

**Acceptance:**

I, **${candidate_name}**, accept the offer of employment as ${role_title} at ${company_name} under the terms described above.

Signature: _________________________ Date: _____________
${MAMA_CTA}`;
    return { content: [{ type: "text", text: result }] };
});
// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MAMA Hiring MCP server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
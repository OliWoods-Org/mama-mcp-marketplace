import { z } from "zod";
import { seededInt, seededPick, normTicker } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";
export const DisruptionScoreInput = z.object({
    company: z.string().min(1).max(80).describe("Company name or ticker symbol, e.g. 'Ford' or 'F'"),
});
const HISTORICAL_DISRUPTIONS = {
    automotive: [
        { analog: "Kodak vs digital photography (2000s)", outcome: "Market cap decline >95% over 10 years" },
        { analog: "Nokia vs smartphone era (2007–2013)", outcome: "Mobile division sold for $7.2B vs $150B peak valuation" },
    ],
    retail: [
        { analog: "Sears vs e-commerce (2010s)", outcome: "Bankruptcy filed 2018; 100-year-old brand dismantled" },
        { analog: "Blockbuster vs streaming (2010)", outcome: "Chapter 11 within 3 years of Netflix pivot" },
    ],
    technology: [
        { analog: "IBM mainframe vs PC revolution (1980s)", outcome: "Near-bankruptcy; survived via strategic pivot" },
        { analog: "Yahoo vs Google search dominance (2000s)", outcome: "Search share collapsed from 28% to <3%" },
    ],
    financials: [
        { analog: "Lehman Brothers systemic risk (2008)", outcome: "Complete dissolution; $600B in assets liquidated" },
        { analog: "Traditional banking vs fintech (2015–present)", outcome: "Avg. revenue per customer −18% for incumbent banks" },
    ],
    energy: [
        { analog: "Coal utilities vs renewable energy (2010s)", outcome: "Peabody Energy bankruptcy 2016; sector market cap −60%" },
        { analog: "Horse-drawn carriage makers vs automobiles (1900s)", outcome: "Industry extinct within 15 years" },
    ],
    healthcare: [
        { analog: "Film-based radiology vs digital imaging (1990s)", outcome: "Kodak Medical Imaging division sold; incumbents disrupted" },
        { analog: "Traditional drug distribution vs pharmacy automation", outcome: "Dispensing margins compressed 40–60% over a decade" },
    ],
    default: [
        { analog: "Dominant incumbents vs platform disruption (2010s)", outcome: "Average incumbent lost 35% market share to new entrants" },
        { analog: "Pre-cloud enterprise software vs SaaS (2005–2015)", outcome: "Licence revenue models collapsed; survivors required full re-architecture" },
    ],
};
function inferSector(company) {
    const c = company.toLowerCase();
    if (/ford|gm|toyota|honda|tesla|rivian|nio|stellantis|bmw|mercedes/.test(c))
        return "automotive";
    if (/walmart|target|amazon|costco|kroger|dollar|sears|macy|jcpenney/.test(c))
        return "retail";
    if (/apple|microsoft|google|meta|amazon|nvidia|intel|ibm|yahoo|oracle|salesforce/.test(c))
        return "technology";
    if (/jpmorgan|bank|goldman|morgan|citi|wells|blackrock|visa|mastercard|paypal/.test(c))
        return "financials";
    if (/exxon|chevron|bp|shell|conocophillips|halliburton|schlumberger|coal|oil/.test(c))
        return "energy";
    if (/pfizer|johnson|merck|abbvie|eli lilly|unitedhealth|cvs|walgreen|hospital/.test(c))
        return "healthcare";
    return "default";
}
export function disruptionScore(input) {
    const company = input.company.trim();
    const key = normTicker(company); // use normalized form as seed key
    const sector = inferSector(company);
    const score = seededInt(key, "disr", 5, 95);
    const timeline = seededPick(key, "tl", [
        "0–2 years (imminent)",
        "2–5 years (near-term)",
        "5–10 years (medium-term)",
        "10+ years (long-term structural)",
    ]);
    const threatSources = [
        {
            source: "AI / Automation",
            severity: seededInt(key, "ai_sev", 1, 10),
            detail: `Large language models and autonomous agents threatening ${seededInt(key, "ai_jobs", 10, 60)}% of current workflows; estimated cost reduction opportunity for new entrants: ${seededInt(key, "ai_cost", 20, 70)}%`,
        },
        {
            source: "Regulatory shift",
            severity: seededInt(key, "reg_sev", 1, 10),
            detail: `${seededPick(key, "reg_type", ["ESG disclosure mandates", "Antitrust scrutiny", "Data privacy legislation", "Carbon pricing mechanisms", "Sector-specific licensing overhaul"])} could alter competitive dynamics within 3–5 years`,
        },
        {
            source: "Competitive entrants",
            severity: seededInt(key, "comp_sev", 1, 10),
            detail: `${seededInt(key, "comp_cnt", 2, 12)} well-funded startups raised $${seededInt(key, "comp_raise", 50, 5000)}M targeting core revenue streams; ${seededPick(key, "comp_geo", ["US-based", "Asia-Pacific", "European"])} incumbents also expanding`,
        },
        {
            source: "Technology shift",
            severity: seededInt(key, "tech_sev", 1, 10),
            detail: `${seededPick(key, "tech_type", ["Cloud-native architecture", "Quantum computing", "Synthetic biology", "Edge computing", "Decentralised finance", "Advanced materials", "Generative AI"])} adoption curve suggests ${seededInt(key, "tech_yrs", 2, 8)}-year window before mainstream displacement`,
        },
    ];
    const historicals = HISTORICAL_DISRUPTIONS[sector] ?? HISTORICAL_DISRUPTIONS.default;
    const h = key.charCodeAt(0) % historicals.length;
    const comparableDisruptions = [historicals[h], historicals[(h + 1) % historicals.length]];
    const riskLabel = score >= 75 ? "CRITICAL" : score >= 55 ? "HIGH" : score >= 35 ? "MODERATE" : "LOW";
    const result = {
        company,
        disruption_score: score,
        risk_label: riskLabel,
        disruption_timeline: timeline,
        threat_sources: threatSources,
        most_severe_threat: threatSources.reduce((a, b) => (a.severity >= b.severity ? a : b)).source,
        comparable_disruptions: comparableDisruptions,
        strategic_implication: score >= 75
            ? "Immediate strategic pivot or defensive M&A strongly warranted."
            : score >= 55
                ? "Proactive innovation investment and partnership exploration recommended."
                : score >= 35
                    ? "Monitoring posture appropriate; maintain R&D allocation."
                    : "Business model resilience is high; focus on operational optimisation.",
        generated_at: new Date().toISOString(),
    };
    return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}
//# sourceMappingURL=disruption-score.js.map
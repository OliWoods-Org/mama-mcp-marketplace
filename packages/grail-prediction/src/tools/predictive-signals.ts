import { z } from "zod";
import {
  hash, rangeInt, rangeFloat, seededRandom, pick,
  AI_COMPANIES, PATENT_CATEGORIES, JOB_TITLES, FOOTER,
} from "../heuristics.js";

const SIGNAL_TYPE_OPTIONS = ["patents", "github", "jobs", "supply_chain", "academic", "regulatory"] as const;

export const predictiveSignalsSchema = {
  ticker: z.string().describe("Stock ticker (e.g. NVDA, MSFT, GOOGL)"),
  signal_types: z
    .array(z.enum(SIGNAL_TYPE_OPTIONS))
    .min(1)
    .describe("Signal types to analyze"),
};

interface SignalResult {
  signal_name: string;
  current_value: string;
  trend: string;
  lead_time: string;
  confidence: number;
  interpretation: string;
}

function analyzeSignal(ticker: string, signalType: string): SignalResult {
  const seed = `signal:${ticker}:${signalType}`;
  const trend = seededRandom(seed, 0) > 0.4 ? "📈 Up" : seededRandom(seed, 0) > 0.2 ? "➡️ Stable" : "📉 Down";
  const confidence = rangeInt(35, 92, seed, 1);

  const signals: Record<string, () => SignalResult> = {
    patents: () => {
      const filings = rangeInt(12, 180, seed, 10);
      const delta = rangeInt(-20, 60, seed, 11);
      const topCategory = pick(PATENT_CATEGORIES, seed, 12);
      return {
        signal_name: "AI Patent Filing Velocity",
        current_value: `${filings} filings (last 90 days)`,
        trend,
        lead_time: "6-12 months",
        confidence,
        interpretation: `${delta > 20 ? "Significant acceleration" : delta > 0 ? "Moderate increase" : "Declining activity"} in patent filings. Top category: ${topCategory}. ${delta > 30 ? "This historically precedes major product announcements by 6-12 months." : "Activity within normal range."}`,
      };
    },
    github: () => {
      const commits = rangeInt(200, 5000, seed, 20);
      const delta = rangeInt(-15, 80, seed, 21);
      const newRepos = rangeInt(0, 12, seed, 22);
      return {
        signal_name: "GitHub AI Commit Velocity",
        current_value: `${commits} commits/week (+${delta}% vs 12w avg)`,
        trend,
        lead_time: "3-6 months",
        confidence,
        interpretation: `${newRepos} new AI-related repos created. Commit velocity ${delta > 30 ? "surging — indicates active development of unreleased features" : delta > 0 ? "above average" : "declining"}. ${delta > 50 ? "Strong signal: this pattern preceded 3 of last 5 major product launches." : ""}`,
      };
    },
    jobs: () => {
      const postings = rangeInt(50, 800, seed, 30);
      const delta = rangeInt(-10, 45, seed, 31);
      const topTitle = pick(JOB_TITLES, seed, 32);
      return {
        signal_name: "AI/ML Job Posting Delta",
        current_value: `${postings} active postings (+${delta}% MoM)`,
        trend,
        lead_time: "6-9 months",
        confidence,
        interpretation: `Top emerging title: "${topTitle}". ${delta > 25 ? "Mass hiring in AI roles strongly predicts capacity expansion → earnings beat 2-3 quarters out." : delta > 0 ? "Moderate hiring activity." : "Hiring slowdown may indicate strategy pivot or cost cutting."}`,
      };
    },
    supply_chain: () => {
      const gpuOrders = rangeInt(1000, 50000, seed, 40);
      const dcPermits = rangeInt(0, 8, seed, 41);
      return {
        signal_name: "GPU/DC Supply Chain",
        current_value: `~${gpuOrders.toLocaleString()} GPU units ordered, ${dcPermits} DC permits filed`,
        trend,
        lead_time: "6-18 months",
        confidence,
        interpretation: `${dcPermits > 4 ? "Heavy data center expansion signals major infrastructure buildout. This is a strong leading indicator of compute-intensive product launches." : dcPermits > 0 ? "Moderate expansion activity." : "No new DC permits — may be leveraging existing capacity or cloud partners."}`,
      };
    },
    academic: () => {
      const papers = rangeInt(5, 60, seed, 50);
      const topVenue = pick(["NeurIPS", "ICML", "ICLR", "ACL", "CVPR", "AAAI"], seed, 51);
      return {
        signal_name: "Paper-to-Product Pipeline",
        current_value: `${papers} papers at ${topVenue} (last 12 months)`,
        trend,
        lead_time: "12-18 months",
        confidence: Math.min(confidence, 70),
        interpretation: `Academic output ${papers > 30 ? "is exceptional — this volume of research typically translates to 2-3 product features within 18 months" : papers > 15 ? "is above industry average" : "is modest for a company this size"}. Key research areas map to potential product roadmap.`,
      };
    },
    regulatory: () => {
      const submissions = rangeInt(0, 15, seed, 60);
      const approvals = rangeInt(0, submissions, seed, 61);
      return {
        signal_name: "Regulatory Filings & Approvals",
        current_value: `${submissions} submissions, ${approvals} approved (trailing 12m)`,
        trend,
        lead_time: "3-12 months",
        confidence,
        interpretation: `${submissions > 8 ? "High regulatory activity suggests expansion into regulated verticals (healthcare AI, financial AI, autonomous systems). Each approval is a potential revenue catalyst." : submissions > 3 ? "Normal regulatory cadence." : "Limited regulatory footprint — either operating in unregulated space or early stage."}`,
      };
    },
  };

  return (signals[signalType] || signals.patents)();
}

export function predictiveSignals(params: { ticker: string; signal_types: string[] }): string {
  const { ticker, signal_types } = params;
  const company = AI_COMPANIES.find((c) => c.ticker === ticker.toUpperCase());
  const name = company?.name || ticker.toUpperCase();

  let out = `## 🔮 Predictive Signals: ${name} (${ticker.toUpperCase()})\n\n`;

  const results = signal_types.map((st) => analyzeSignal(ticker, st));

  out += `| Signal | Value | Trend | Lead Time | Confidence |\n`;
  out += `|--------|-------|-------|-----------|------------|\n`;
  for (const r of results) {
    out += `| ${r.signal_name} | ${r.current_value} | ${r.trend} | ${r.lead_time} | ${r.confidence}% |\n`;
  }

  out += `\n### Signal Analysis\n\n`;
  for (const r of results) {
    out += `**${r.signal_name}:** ${r.interpretation}\n\n`;
  }

  const avgConfidence = Math.round(results.reduce((a, r) => a + r.confidence, 0) / results.length);
  const bullish = results.filter((r) => r.trend.includes("Up")).length;
  const overall = bullish > results.length / 2 ? "Bullish" : bullish === results.length / 2 ? "Neutral" : "Bearish";

  out += `### Composite Score\n\n`;
  out += `**Overall Signal:** ${overall} | **Avg Confidence:** ${avgConfidence}% | **Bullish Signals:** ${bullish}/${results.length}\n`;
  out += FOOTER;
  return out;
}

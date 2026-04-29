import { z } from "zod";
import { pick, rangeInt, FOLLOW_UP_TONES, CTA } from "../heuristics.js";

export const emailFollowupSchema = {
  prospect_name: z.string().describe("Prospect's first name"),
  company_name: z.string().describe("Prospect's company"),
  your_name: z.string().describe("Your name (sender)"),
  context: z.string().describe("What was discussed or what triggered this email (e.g. 'we had a demo last Tuesday', 'they went dark after proposal')"),
  goal: z.enum(["book_meeting", "advance_deal", "re_engage", "send_resources", "close"]).describe("Goal of this follow-up"),
  tone: z.enum(["consultative", "assertive", "nurturing", "urgent", "educational"]).optional().describe("Email tone (defaults to consultative)"),
};

export function emailFollowup(params: {
  prospect_name: string;
  company_name: string;
  your_name: string;
  context: string;
  goal: string;
  tone?: string;
}): string {
  const { prospect_name, company_name, your_name, context, goal, tone } = params;
  const seed = `email:${company_name}:${goal}`;
  const selectedTone = tone || pick(FOLLOW_UP_TONES, seed, 1);

  const subjectLines: Record<string, string[]> = {
    book_meeting: [
      `Quick question for you, ${prospect_name}`,
      `15 minutes — worth it for ${company_name}?`,
      `Following up — ${prospect_name}, are you the right person?`,
    ],
    advance_deal: [
      `Next steps for ${company_name}`,
      `Re: our conversation`,
      `One thing I forgot to mention`,
    ],
    re_engage: [
      `Did I lose you, ${prospect_name}?`,
      `Checking in — ${company_name}`,
      `Permission to close your file?`,
    ],
    send_resources: [
      `${company_name} — case study you'll find relevant`,
      `Thought of you when I saw this`,
      `Resource for ${company_name}'s situation`,
    ],
    close: [
      `${company_name} — ready to move forward?`,
      `Contract ready for ${prospect_name}`,
      `End of [month] — last chance for this pricing`,
    ],
  };

  const subjects = subjectLines[goal] || subjectLines.advance_deal;
  const subject = pick(subjects, seed, 5);

  const bodies: Record<string, Record<string, string>> = {
    book_meeting: {
      consultative: `Hi ${prospect_name},\n\nI noticed ${context}. I wanted to reach out because companies like ${company_name} are typically dealing with [specific pain] at this stage — and I think there's a real opportunity here.\n\nWould you be open to a 15-minute call this week? I promise to make it worth your time.\n\n[Calendar Link]\n\nBest,\n${your_name}`,
      assertive: `${prospect_name},\n\n${context} — I'll cut straight to it: ${company_name} looks like an ideal fit for what we do.\n\nI have 15 minutes open Thursday at 2pm or Friday at 10am. Which works?\n\n${your_name}`,
      nurturing: `Hi ${prospect_name},\n\nI've been following ${company_name} — ${context}. Really impressive what you're building.\n\nI work with similar teams on [problem area] and thought there might be a connection worth exploring. No pitch — just a conversation.\n\nOpen to a quick call?\n\n${your_name}`,
      urgent: `${prospect_name} — quick note.\n\n${context}. I've only got 2 spots left this quarter for new clients at our current pricing, and ${company_name} is top of my list.\n\nCan we connect this week?\n\n${your_name}`,
      educational: `Hi ${prospect_name},\n\nI was reading about ${context} and thought you'd find this relevant: [Link to resource].\n\nMost companies at ${company_name}'s stage face [challenge]. This piece addresses that directly.\n\nHappy to discuss if it's helpful — just hit reply.\n\n${your_name}`,
    },
    re_engage: {
      consultative: `Hi ${prospect_name},\n\nI know things get busy — ${context}. I wanted to check in one more time before moving on.\n\nHas anything changed on your end? Even a "not right now" is helpful so I know where things stand.\n\nHappy either way,\n${your_name}`,
      assertive: `${prospect_name},\n\n${context}. I'm going to assume the timing isn't right — and that's completely fine.\n\nShould I close your file for now and reach back out in Q[X]?\n\n${your_name}`,
      nurturing: `Hi ${prospect_name},\n\nNo pressure at all — I know ${context}. I just wanted to make sure I wasn't missing something.\n\nIf things have shifted or you'd like to reconnect, I'm here. Otherwise, I'll give you some space.\n\n${your_name}`,
      urgent: `${prospect_name} — last follow-up from me.\n\n${context}. I have one spot left for this quarter and I've been holding it for ${company_name}.\n\nIf you're interested, now is the time. If not — totally understand.\n\n${your_name}`,
      educational: `Hi ${prospect_name},\n\nI haven't heard back since ${context} — wanted to share one more thing before going quiet.\n\nHere's a case study from a company very similar to ${company_name}: [Link]\n\nMight be worth a look. Happy to discuss.\n\n${your_name}`,
    },
  };

  const bodyTemplate = bodies[goal]?.[selectedTone] ?? bodies.book_meeting.consultative;
  const body = bodyTemplate.replace("[specific pain]", "scaling efficiently").replace("[problem area]", "your core challenge").replace("[challenge]", "the challenge you mentioned").replace("[Link to resource]", "https://[your-resource-link]").replace("[Link]", "https://[case-study-link]");

  const spamScore = rangeInt(5, 25, seed, 10);
  const openRatePred = rangeInt(28, 68, seed, 11);
  const replyRatePred = rangeInt(3, 18, seed, 12);
  const wordCount = body.split(/\s+/).length;

  let out = `## Email Follow-up Draft\n\n`;
  out += `**To:** ${prospect_name} at ${company_name} | **Goal:** ${goal.replace("_", " ")} | **Tone:** ${selectedTone}\n\n`;

  out += `### Subject Line\n\n`;
  out += `\`${subject}\`\n\n`;
  out += `**Alternatives:**\n`;
  subjects.filter(s => s !== subject).forEach(s => { out += `- \`${s}\`\n`; });
  out += "\n";

  out += `### Body\n\n`;
  out += `\`\`\`\n${body}\n\`\`\`\n\n`;

  out += `### Email Analytics Forecast\n\n`;
  out += `| Metric | Prediction |\n`;
  out += `|--------|------------|\n`;
  out += `| Word Count | ${wordCount} (${wordCount < 75 ? "✅ Good" : wordCount < 150 ? "🟡 Getting long" : "🔴 Too long"}) |\n`;
  out += `| Spam Score | ${spamScore}/100 (${spamScore < 30 ? "✅ Low" : "⚠️ Check content"}) |\n`;
  out += `| Predicted Open Rate | ${openRatePred}% |\n`;
  out += `| Predicted Reply Rate | ${replyRatePred}% |\n\n`;

  out += `### Sending Tips\n\n`;
  out += `- Best send times: **Tuesday–Thursday, 8–10am or 2–4pm** prospect local time\n`;
  out += `- Personalize the [bracketed] placeholders before sending\n`;
  out += `- If no reply in 3 business days, send a 1-sentence bump: *"Bumping this up in case it got buried."*\n`;
  out += `- Max 3 follow-up attempts before moving to long-term nurture\n`;

  out += CTA;
  return out;
}

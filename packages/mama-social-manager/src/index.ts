#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MAMA_CTA = `\n---\n💡 Want this automated 24/7? Join MAMA private beta → mama.oliwoods.com/beta\n📱 Already in? /mama in Slack to activate this agent`;

const server = new McpServer({
  name: "mama-social-manager",
  version: "1.0.0",
});

type Platform = "instagram" | "linkedin" | "twitter" | "tiktok" | "facebook" | "threads";
type Tone = "professional" | "casual" | "witty" | "inspirational" | "educational" | "bold";

// ── generate_post ────────────────────────────────────────────────────────────
server.tool(
  "generate_post",
  "Generate platform-optimized social media post copy from a topic and tone",
  {
    topic: z.string().describe("What the post is about (product launch, insight, tip, announcement, etc.)"),
    platform: z.enum(["instagram", "linkedin", "twitter", "tiktok", "facebook", "threads"]).describe("Target social platform"),
    tone: z.enum(["professional", "casual", "witty", "inspirational", "educational", "bold"]).optional().default("professional"),
    brand_name: z.string().optional().describe("Brand or author name for voice consistency"),
    include_cta: z.boolean().optional().default(true).describe("Whether to include a call-to-action"),
    key_points: z.array(z.string()).optional().describe("Key points or facts to include"),
  },
  async ({ topic, platform, tone, brand_name, include_cta, key_points }) => {
    const charLimits: Record<Platform, number> = {
      twitter: 280, linkedin: 3000, instagram: 2200,
      tiktok: 2200, facebook: 63206, threads: 500,
    };

    const platformTips: Record<Platform, string> = {
      twitter: "Use punchy hooks, line breaks, and 1–2 hashtags max",
      linkedin: "Professional insights perform well. Use line breaks and a strong opener. No images required for text posts to go viral.",
      instagram: "First line is the hook before 'more'. Use emoji and 5–15 hashtags in comments.",
      tiktok: "Conversational, direct, trend-aware. Include hooks like 'POV:' or 'Here's what nobody tells you about'",
      facebook: "Longer narrative works here. Questions drive engagement.",
      threads: "Casual, authentic, direct. Reads like texting. 1–2 hashtags max.",
    };

    const openersForTone: Record<Tone, string[]> = {
      professional: ["Here's what we've learned:", "A key insight:", "We're excited to share:"],
      casual: ["Okay, real talk —", "Hot take:", "Can we talk about this?"],
      witty: ["Unpopular opinion:", "Nobody asked, but:", "Plot twist:"],
      inspirational: ["The best time to start was yesterday. The second best time is now.", "Growth happens when:", "One thing that changed everything:"],
      educational: ["Did you know:", "Most people don't realize:", "The data shows:"],
      bold: ["This changes everything.", "We're done doing it the old way.", "The industry is wrong about this."],
    };

    const ctaByPlatform: Record<Platform, string[]> = {
      twitter: ["Thoughts? Drop them below.", "Retweet if this resonates.", "Follow for more."],
      linkedin: ["What's your experience? Share in the comments.", "Follow ${brand} for more insights.", "Save this for later if it was helpful."],
      instagram: ["Drop a 🔥 if you agree. Link in bio.", "Tag someone who needs to see this.", "Save this post for later!"],
      tiktok: ["Follow for part 2!", "Comment your thoughts below!", "Share with your team!"],
      facebook: ["What do you think? Let us know in the comments.", "Share with someone who'd find this useful.", "Like and follow for more."],
      threads: ["Thoughts?", "Hot take or valid?", "Am I alone in thinking this?"],
    };

    const opener = openersForTone[tone][Math.floor(Math.random() * openersForTone[tone].length)];
    const cta = ctaByPlatform[platform][0].replace("${brand}", brand_name ?? "us");
    const keyPointText = key_points && key_points.length > 0
      ? key_points.map((p) => `→ ${p}`).join("\n")
      : "";

    let post = "";

    if (platform === "linkedin") {
      post = `${opener}\n\n${topic}\n\n${keyPointText ? `${keyPointText}\n\n` : ""}The bottom line?\n\nBuilding ${topic.split(" ").slice(0, 3).join(" ")} isn't about being perfect — it's about being consistent.\n\n${include_cta ? cta : ""}`;
    } else if (platform === "twitter" || platform === "threads") {
      const body = keyPointText ? `${topic}\n\n${keyPointText}` : topic;
      post = `${opener}\n\n${body}${include_cta ? `\n\n${cta}` : ""}`;
    } else if (platform === "instagram") {
      post = `${opener}\n\n${topic}\n\n${keyPointText ? `${keyPointText}\n\n` : ""}✨ Here's the thing most people miss — consistency beats perfection every single time.\n\n${include_cta ? cta : ""}`;
    } else if (platform === "tiktok") {
      post = `POV: You finally figured out ${topic} 🤯\n\n${keyPointText ? `${keyPointText}\n\n` : ""}This one simple shift can change how you think about this forever.\n\n${include_cta ? cta : ""}`;
    } else {
      post = `${opener}\n\n${topic}\n\n${keyPointText ? `${keyPointText}\n\n` : ""}${include_cta ? cta : ""}`;
    }

    const charCount = post.length;
    const limit = charLimits[platform];

    const result = `## ✍️ ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post

**Tone:** ${tone} | **Characters:** ${charCount}/${limit} ${charCount > limit ? "⚠️ OVER LIMIT" : "✅"}

---

${post}

---

### Platform Tips for ${platform}
${platformTips[platform]}

### Posting Best Practices
- **Best times:** ${platform === "linkedin" ? "Tue–Thu, 8–10am or 5–6pm" : platform === "instagram" ? "Tue–Fri, 9am–11am or 7–9pm" : platform === "twitter" ? "Weekdays, 8am–10am or 6pm–9pm" : "Tue–Sat, 7pm–9pm"}
- **Engagement tip:** Reply to every comment in the first 60 minutes for maximum algorithmic boost
- **A/B test:** Try 2–3 opening hooks and see which drives more engagement
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── content_calendar ─────────────────────────────────────────────────────────
server.tool(
  "content_calendar",
  "Generate a week of social media post ideas tailored to your industry and posting frequency",
  {
    industry: z.string().describe("Your industry or niche (e.g. 'SaaS startup', 'personal finance', 'fitness coaching', 'e-commerce')"),
    posting_frequency: z.number().min(1).max(21).describe("Number of posts per week (1–21)"),
    platforms: z.array(z.enum(["instagram", "linkedin", "twitter", "tiktok", "facebook", "threads"])).describe("Platforms to create content for"),
    brand_pillars: z.array(z.string()).optional().describe("Your brand content pillars (e.g. 'education', 'behind the scenes', 'product')"),
    target_audience: z.string().optional().describe("Who your content is for"),
  },
  async ({ industry, posting_frequency, platforms, brand_pillars, target_audience }) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const contentTypes: Record<string, string[]> = {
      educational: ["How-to guide", "Myth vs fact", "Quick tip", "Industry stat", "Explainer", "Common mistake"],
      engagement: ["Question to audience", "Poll or vote", "Hot take", "Unpopular opinion", "This vs that"],
      social_proof: ["Customer story / testimonial", "Case study highlight", "Before/after", "User-generated content"],
      brand: ["Behind-the-scenes", "Team spotlight", "Founder story", "Values / mission", "Day in the life"],
      product: ["Feature spotlight", "Demo or tutorial", "New launch", "Use case", "Comparison"],
      trending: ["Industry news reaction", "Trend hijack", "Seasonal / holiday tie-in", "Current events tie-in"],
    };

    const pillars = brand_pillars ?? ["educational", "engagement", "social_proof", "product"];

    // Distribute posts across the week
    const postsPerDay = Math.ceil(posting_frequency / 7);
    const calendar: { day: string; platform: Platform; type: string; idea: string }[] = [];

    let postCount = 0;
    for (let d = 0; d < 7 && postCount < posting_frequency; d++) {
      for (let p = 0; p < postsPerDay && postCount < posting_frequency; p++) {
        const platform = platforms[postCount % platforms.length] as Platform;
        const pillar = pillars[postCount % pillars.length];
        const types = contentTypes[pillar] ?? contentTypes.educational;
        const type = types[postCount % types.length];

        const ideaMap: Record<string, string[]> = {
          "SaaS startup": [`5 features in ${type} your team didn't know existed`, `Why most ${type} in SaaS fail (and what to do instead)`, `The ${industry} playbook: ${type} edition`],
          "personal finance": [`The ${type} nobody talks about for building wealth`, `${type}: what the rich do that schools never taught you`, `3-step ${type} to get your money right`],
          "fitness coaching": [`${type}: the overlooked key to real results`, `Stop doing this in your ${type} (common mistake)`, `How to stay consistent with ${type}`],
          "e-commerce": [`${type} that drove 10x sales for our store`, `The ${type} strategy we used to go viral`, `Customer ${type}: what we learned`],
        };

        const ideaList = Object.entries(ideaMap).find(([k]) => industry.toLowerCase().includes(k))?.[1]
          ?? [`The truth about ${type} in ${industry}`, `${type}: what top ${industry} brands get right`, `A ${type} that changed how we think about ${industry}`];
        const idea = ideaList[postCount % ideaList.length];

        calendar.push({ day: days[d], platform, type, idea });
        postCount++;
      }
    }

    const result = `## 📅 Content Calendar: ${industry}
**Week of posts | Frequency:** ${posting_frequency}/week | **Platforms:** ${platforms.join(", ")}
${target_audience ? `**Audience:** ${target_audience}` : ""}

### Content Plan

| Day | Platform | Content Type | Post Idea |
|-----|----------|-------------|-----------|
${calendar.map((c) => `| ${c.day} | ${c.platform} | ${c.type} | ${c.idea} |`).join("\n")}

### Content Pillars Used
${pillars.map((p, i) => `${i + 1}. **${p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, " ")}** – ${contentTypes[p]?.[0] ?? "custom"} and more`).join("\n")}

### Weekly Cadence Tips
- **Monday/Tuesday:** Educational content performs best early in the week
- **Wednesday/Thursday:** Engagement & community posts — mid-week activity peaks
- **Friday:** Lighter content, inspiration, or behind-the-scenes
- **Weekend:** Lower frequency; UGC or product showcases if you post

### Repurposing Strategy
- Turn each long-form post into a short video script (TikTok/Reels)
- Combine 4 tips posts into a carousel
- Repost top performers 30–60 days later with a fresh hook
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── hashtag_optimizer ─────────────────────────────────────────────────────────
server.tool(
  "hashtag_optimizer",
  "Generate a ranked, optimized set of hashtags for a social media post",
  {
    post_text: z.string().describe("The post copy or topic to generate hashtags for"),
    platform: z.enum(["instagram", "linkedin", "twitter", "tiktok", "threads"]).describe("Target platform"),
    niche: z.string().optional().describe("Your niche or industry for more targeted hashtags"),
    strategy: z.enum(["broad_reach", "niche_authority", "balanced"]).optional().default("balanced"),
  },
  async ({ post_text, platform, niche, strategy }) => {
    const textLower = (post_text + " " + (niche ?? "")).toLowerCase();

    // Platform hashtag counts
    const hashtagCount: Record<string, { min: number; max: number; optimal: number }> = {
      instagram: { min: 3, max: 30, optimal: 10 },
      linkedin: { min: 1, max: 5, optimal: 3 },
      twitter: { min: 1, max: 2, optimal: 2 },
      tiktok: { min: 3, max: 8, optimal: 5 },
      threads: { min: 0, max: 3, optimal: 2 },
    };

    // Keyword-to-hashtag maps
    const hashtagSets: Record<string, { broad: string[]; niche: string[] }> = {
      startup: {
        broad: ["#startup", "#entrepreneur", "#startuplife", "#business", "#innovation"],
        niche: ["#startupfounder", "#venturecapital", "#techstartup", "#saas", "#buildInPublic"],
      },
      marketing: {
        broad: ["#marketing", "#digitalmarketing", "#socialmedia", "#branding", "#contentmarketing"],
        niche: ["#marketingstrategy", "#growthmarketing", "#demandgen", "#b2bmarketing", "#seomarketing"],
      },
      fitness: {
        broad: ["#fitness", "#workout", "#health", "#gym", "#motivation"],
        niche: ["#strengthtraining", "#fitnesscoach", "#homeworkout", "#fitnessmotivation", "#personaltrainer"],
      },
      finance: {
        broad: ["#finance", "#money", "#investing", "#personalfinance", "#wealth"],
        niche: ["#financialfreedom", "#investing101", "#passiveincome", "#stockmarket", "#retirementplanning"],
      },
      tech: {
        broad: ["#tech", "#technology", "#ai", "#software", "#innovation"],
        niche: ["#machinelearning", "#artificialintelligence", "#devops", "#cloudcomputing", "#cybersecurity"],
      },
      design: {
        broad: ["#design", "#ux", "#ui", "#creative", "#graphicdesign"],
        niche: ["#uxdesign", "#productdesign", "#designsystems", "#figma", "#designthinking"],
      },
      food: {
        broad: ["#food", "#foodie", "#recipe", "#cooking", "#delicious"],
        niche: ["#foodphotography", "#homecooking", "#mealprep", "#foodblogger", "#easyrecipes"],
      },
      travel: {
        broad: ["#travel", "#wanderlust", "#adventure", "#explore", "#vacation"],
        niche: ["#solotravel", "#travelgram", "#digitalnomad", "#traveltips", "#budgettravel"],
      },
    };

    const matchedCategory = Object.keys(hashtagSets).find((k) =>
      textLower.includes(k) || (niche && niche.toLowerCase().includes(k))
    );

    const set = matchedCategory ? hashtagSets[matchedCategory] : hashtagSets.startup;

    // Mix by strategy
    const { min: _min, max: _max, optimal } = hashtagCount[platform] ?? hashtagCount.instagram;
    let selected: string[] = [];

    if (strategy === "broad_reach") {
      selected = set.broad.concat(["#viral", "#trending", "#fyp"]).slice(0, optimal);
    } else if (strategy === "niche_authority") {
      selected = set.niche.concat([`#${niche?.replace(/\s/g, "") ?? "industry"}`]).slice(0, optimal);
    } else {
      // balanced: mix broad and niche
      const half = Math.floor(optimal / 2);
      selected = [...set.broad.slice(0, half), ...set.niche.slice(0, optimal - half)];
    }

    const tierLabels: Record<string, string> = {
      broad: "High volume (1M+ posts) — builds awareness",
      mid: "Mid volume (100K–1M posts) — best engagement rate",
      niche: "Niche (1K–100K posts) — high intent audience",
    };

    const result = `## # Hashtag Strategy: ${platform}

**Strategy:** ${strategy.replace(/_/g, " ")} | **Optimal count for ${platform}:** ${optimal}

### Recommended Hashtags (copy & paste)
\`\`\`
${selected.join(" ")}
\`\`\`

### Hashtag Breakdown
| Tier | Hashtags | Why |
|------|----------|-----|
| Broad | ${set.broad.slice(0, 2).join(", ")} | ${tierLabels.broad} |
| Mid | ${set.niche.slice(0, 2).join(", ")} | ${tierLabels.mid} |
| Niche | ${niche ? `#${niche.replace(/\s/g, "")}` : set.niche[4] ?? "#yourNiche"} | ${tierLabels.niche} |

### Platform-Specific Tips
${platform === "instagram" ? "- Put hashtags in first comment to keep caption clean\n- Rotate sets — don't use the same 10 every post or Instagram may shadow-restrict\n- Mix popular (1M+), medium (100K), and niche (<50K) tags" : ""}
${platform === "linkedin" ? "- Keep to 3–5 max — LinkedIn's algorithm deprioritizes hashtag-heavy posts\n- Use industry-specific hashtags over vanity ones\n- Check hashtag follower counts in LinkedIn's search" : ""}
${platform === "twitter" ? "- 1–2 hashtags maximum — more tanks engagement\n- Only use trending hashtags if directly relevant\n- Use hashtags within the sentence, not appended at the end" : ""}
${platform === "tiktok" ? "- Always include #fyp and #foryoupage for discovery\n- 3–5 relevant hashtags + 1–2 trending\n- Keep captions under 150 chars so hashtags appear" : ""}
${platform === "threads" ? "- Threads algorithm doesn't rely heavily on hashtags yet\n- Use 1–2 max, or none at all — focus on content quality" : ""}
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── repurpose_content ─────────────────────────────────────────────────────────
server.tool(
  "repurpose_content",
  "Transform long-form content into ready-to-post snippets for multiple platforms",
  {
    content: z.string().describe("Long-form content to repurpose (blog post, video transcript, podcast notes, article)"),
    source_type: z.enum(["blog_post", "video_transcript", "podcast", "newsletter", "webinar", "thread"]).optional().default("blog_post"),
    target_platforms: z.array(z.enum(["instagram", "linkedin", "twitter", "tiktok", "facebook", "threads", "newsletter_snippet"])).describe("Platforms to create content for"),
    brand_voice: z.string().optional().describe("Describe your brand voice (e.g. 'authoritative but approachable', 'witty and direct')"),
  },
  async ({ content, source_type, target_platforms, brand_voice }) => {
    const words = content.split(/\s+/);
    const firstParagraph = content.split(/\n\n/)[0] ?? content.slice(0, 300);

    // Extract key sentences (simple heuristic: sentences with keywords)
    const sentences = content.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 30 && s.length < 250);
    const keyInsights = sentences.slice(0, 5);
    const statSentences = sentences.filter((s) => /\d+%|[$€£]\d|\d+x|\d+ (million|billion|thousand)/i.test(s)).slice(0, 3);
    const bulletPoints = keyInsights.map((s) => `→ ${s.trim()}`).join("\n");

    const platformAdaptations: Partial<Record<string, string>> = {};

    for (const plat of target_platforms) {
      if (plat === "linkedin") {
        platformAdaptations[plat] = `**LinkedIn Post:**\n\n${keyInsights[0] ?? firstParagraph.slice(0, 200)}\n\nHere's what I've learned after diving deep into this:\n\n${keyInsights.slice(1, 4).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nThe takeaway? ${keyInsights[4] ?? "The details matter more than most people think."}\n\nWhat's been your experience? Drop it in the comments.`;
      } else if (plat === "twitter") {
        platformAdaptations[plat] = `**Twitter/X Thread:**\n\n1/ ${keyInsights[0] ?? firstParagraph.slice(0, 250)}\n\n${keyInsights.slice(1, 4).map((s, i) => `${i + 2}/ ${s.slice(0, 250)}`).join("\n\n")}\n\n${keyInsights.length}/  The full breakdown:\n[link to ${source_type.replace(/_/g, " ")}]`;
      } else if (plat === "instagram") {
        platformAdaptations[plat] = `**Instagram Caption:**\n\n${keyInsights[0] ?? ""} ✨\n\n${bulletPoints}\n\nSave this for later and share with someone who needs it.\n\n#content #tips #${source_type.replace(/_/g, "")}`;
      } else if (plat === "tiktok") {
        platformAdaptations[plat] = `**TikTok Script (60-sec):**\n\nHook: "Nobody tells you this about [topic]..."\n\nPoint 1: ${keyInsights[0] ?? ""}\nPoint 2: ${keyInsights[1] ?? ""}\nPoint 3: ${keyInsights[2] ?? ""}\n\nCTA: "Follow for part 2 where I break down [next topic]"`;
      } else if (plat === "threads") {
        platformAdaptations[plat] = `**Threads Post:**\n\n${(keyInsights[0] ?? firstParagraph).slice(0, 400)}\n\nThoughts?`;
      } else if (plat === "newsletter_snippet") {
        platformAdaptations[plat] = `**Newsletter Snippet:**\n\n**[Section Header: This week's deep dive]**\n\n${firstParagraph}\n\n${statSentences.length > 0 ? `Key stat: ${statSentences[0]}` : ""}\n\n${keyInsights.slice(0, 3).map((s) => `• ${s}`).join("\n")}\n\n→ [Read the full ${source_type.replace(/_/g, " ")} here: link]`;
      } else if (plat === "facebook") {
        platformAdaptations[plat] = `**Facebook Post:**\n\n${firstParagraph}\n\n${bulletPoints}\n\nWhat do you think? Share this with someone who'd find it useful.`;
      }
    }

    const result = `## ♻️ Content Repurposed: ${source_type.replace(/_/g, " ")}

**Source word count:** ${words.length} words
**Brand voice:** ${brand_voice ?? "Not specified"}
**Platforms:** ${target_platforms.join(", ")}

---

${Object.entries(platformAdaptations).map(([plat, copy]) => `### ${plat.charAt(0).toUpperCase() + plat.slice(1)}\n\n${copy}`).join("\n\n---\n\n")}

---

### Repurposing Best Practices
- Post the original long-form first, then drip platform versions over 5–7 days
- Each platform adaptation should feel native — avoid "link in bio" on LinkedIn posts
- Track which platform drives the most traffic back to source content
- 1 piece of long-form content → 10+ social posts is a healthy repurposing ratio
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── engagement_reply ──────────────────────────────────────────────────────────
server.tool(
  "engagement_reply",
  "Generate a brand-voice reply to a comment or DM that builds engagement and community",
  {
    incoming_message: z.string().describe("The comment or DM you received"),
    message_type: z.enum(["positive_comment", "question", "complaint", "negative_comment", "dm_inquiry", "collab_request"]).describe("Type of incoming message"),
    brand_voice: z.string().optional().describe("Your brand's voice and personality (e.g. 'warm and supportive', 'witty and bold')"),
    brand_name: z.string().optional().describe("Your brand or personal handle"),
    platform: z.enum(["instagram", "linkedin", "twitter", "tiktok", "facebook", "threads"]).optional().default("instagram"),
    include_question: z.boolean().optional().default(true).describe("Whether to end the reply with an engagement question"),
  },
  async ({ incoming_message, message_type, brand_voice, brand_name, platform, include_question }) => {
    const voice = brand_voice ?? "friendly and professional";
    const brand = brand_name ?? "us";

    const templates: Record<string, string[]> = {
      positive_comment: [
        `This means so much to hear — thank you! 🙏 We put a lot of heart into this, and knowing it resonates keeps us going.`,
        `You just made our day! 🌟 Comments like this are exactly why we do what we do.`,
        `Thank you so much! This kind of feedback truly fuels the team.`,
      ],
      question: [
        `Great question! Here's the quick answer: [your answer to: "${incoming_message}"]. Feel free to DM ${brand} if you want to go deeper!`,
        `Love this question. The short version: [answer to "${incoming_message}"]. What made you curious about this?`,
        `This comes up a lot and it's worth explaining properly. [Answer: "${incoming_message}"] — let us know if that helps!`,
      ],
      complaint: [
        `We hear you, and we're sorry this didn't hit the mark. Could you DM ${brand} with the details? We want to make this right.`,
        `That's not the experience we want for you. Please reach out directly so we can fix this — your feedback matters.`,
        `Thank you for letting us know. We take this seriously and would love to resolve it. Can you send us a DM?`,
      ],
      negative_comment: [
        `We appreciate the honest feedback — genuinely. We're always looking to improve, and this helps. Is there a specific part we could do better?`,
        `Fair point. We don't always get it right, and feedback like this helps us grow. Thanks for taking the time.`,
        `We hear this, and it's something we're actively working on. Thanks for keeping us accountable.`,
      ],
      dm_inquiry: [
        `Hey! Thanks for reaching out to ${brand}. We'd love to help. Could you share a bit more about what you're looking for? We'll get back to you ASAP.`,
        `Hi there! Thanks for the message. We'll get you taken care of — just need a little more info: [clarifying question]`,
        `Thanks for reaching out! We try to respond within 24 hours. In the meantime, our FAQ at [link] might answer your question quickly.`,
      ],
      collab_request: [
        `Thanks so much for thinking of ${brand}! We love connecting with aligned creators. Could you share your media kit or more about your audience? We'll review and get back to you.`,
        `We appreciate the collab interest! It's something we take seriously. DM ${brand} with your stats + a few examples of your work and we'll take a look.`,
        `This is exciting! To make sure it's a great fit for both sides, could you share your platform, audience size, and what you have in mind? 👏`,
      ],
    };

    const replies = templates[message_type] ?? templates.positive_comment;
    const baseReply = replies[0];

    const engagementQuestions: Record<string, string[]> = {
      positive_comment: ["What part resonated most with you?", "Are you seeing similar things in your experience?"],
      question: ["Did that answer help? Any follow-up questions?", "What prompted the question — working on something specific?"],
      complaint: ["What could we have done differently to make this better?", "Is there anything specific we can do to make this right?"],
      negative_comment: ["What would have made this better for you?", "We'd love to understand your perspective better — can you share more?"],
      dm_inquiry: ["What's the main thing you're trying to accomplish?", "How can we best help you today?"],
      collab_request: ["What kind of partnership did you have in mind?", "Who is your primary audience?"],
    };

    const questionOptions = engagementQuestions[message_type] ?? engagementQuestions.positive_comment;
    const engagementQ = questionOptions[0];

    const finalReply = include_question
      ? `${baseReply}\n\n${engagementQ}`
      : baseReply;

    const charCount = finalReply.length;
    const platformLimits: Record<string, number> = {
      twitter: 280, instagram: 2200, linkedin: 1250, tiktok: 150, facebook: 8000, threads: 500,
    };
    const limit = platformLimits[platform] ?? 2200;

    const result = `## 💬 Engagement Reply (${platform})

**Message type:** ${message_type.replace(/_/g, " ")}
**Brand voice applied:** ${voice}
**Character count:** ${charCount}/${limit} ${charCount > limit ? "⚠️ OVER LIMIT — shorten before posting" : "✅"}

---

### Suggested Reply:

${finalReply}

---

### Alternative Versions
${replies.slice(1).map((r, i) => `**Option ${i + 2}:** ${r}${include_question ? ` ${questionOptions[i + 1] ?? engagementQ}` : ""}`).join("\n\n")}

### Engagement Tip
- Reply within **60 minutes** of posting — early engagement tells the algorithm the post is active
- Ask a genuine follow-up question to turn a reply into a conversation thread
- Never leave negative comments unaddressed for more than a few hours
${MAMA_CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MAMA Social Manager MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

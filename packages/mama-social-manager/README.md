# @mama/social-manager-mcp

> AI-powered social media management — generate posts, build content calendars, optimize hashtags, repurpose content, and reply to comments inside your AI assistant.

**Part of the [MAMA MCP Marketplace](https://mama.oliwoods.com)** — the fastest way to automate your business with AI agents.

---

## What It Does

Consistent social media is one of the best growth channels for any business — and one of the hardest to maintain. This MCP server handles content creation and strategy directly inside Claude:

- **Generate platform-native posts** for Instagram, LinkedIn, Twitter/X, TikTok, Facebook, and Threads
- **Plan a week of content** with a structured content calendar by industry
- **Optimize hashtags** with a tiered reach strategy
- **Repurpose long-form content** into native snippets for every platform
- **Reply to comments and DMs** in your brand voice

---

## Tools

| Tool | Description |
|------|-------------|
| `generate_post` | Turn a topic + platform + tone into optimized post copy with CTA |
| `content_calendar` | Generate a week of post ideas by industry, frequency, and platform |
| `hashtag_optimizer` | Get ranked, tiered hashtag sets for maximum discovery |
| `repurpose_content` | Transform blog posts, transcripts, and articles into platform posts |
| `engagement_reply` | Generate brand-voice replies to comments, DMs, and collab requests |

---

## Installation

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mama-social-manager": {
      "command": "npx",
      "args": ["-y", "@mama/social-manager-mcp"]
    }
  }
}
```

### With Claude Code CLI

```bash
claude mcp add mama-social-manager -- npx -y @mama/social-manager-mcp
```

### Manual Install

```bash
npm install -g @mama/social-manager-mcp
mama-social-manager
```

---

## Usage Examples

### Generate a LinkedIn Post

> "Generate a professional LinkedIn post about the importance of async communication for remote teams."

Returns: optimized LinkedIn post with hook, body, and CTA — character count included.

### Build a Content Calendar

> "Create a content calendar for my SaaS startup. I post 5 times a week on LinkedIn and Twitter."

Returns: full week plan with post type, platform, and specific post ideas for each slot.

### Optimize Hashtags

> "Optimize hashtags for this Instagram post about productivity tips for entrepreneurs."

Returns: tiered hashtag set (broad/mid/niche), copy-paste ready, with engagement strategy tips.

### Repurpose a Blog Post

> "Repurpose this 1,500-word blog post into posts for LinkedIn, Twitter, Instagram, and a newsletter snippet: [paste content]"

Returns: platform-native adaptations for each channel, each written in the right format and tone.

### Reply to a Comment

> "Generate a reply to this Instagram comment: 'This content is amazing, how do you come up with so many ideas?'"

Returns: warm, brand-voice reply that builds community and includes an engagement follow-up question.

---

## Platform Support

| Platform | Post Gen | Content Calendar | Hashtags | Repurpose | Replies |
|----------|----------|-----------------|---------|-----------|---------|
| LinkedIn | ✅ | ✅ | ✅ | ✅ | ✅ |
| Instagram | ✅ | ✅ | ✅ | ✅ | ✅ |
| Twitter/X | ✅ | ✅ | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | — | ✅ | ✅ |
| Threads | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Tone Options

`professional` · `casual` · `witty` · `inspirational` · `educational` · `bold`

---

## Supported Industries (Content Calendar)

SaaS · Personal Finance · Fitness & Coaching · E-commerce · Marketing · Real Estate · Creator Economy · B2B Services · and more

---

## Want More?

This MCP server is part of the **MAMA private beta** — an AI agent platform that automates your entire business ops.

💡 **Join MAMA private beta** → [mama.oliwoods.com/beta](https://mama.oliwoods.com/beta)
📱 **Already in?** `/mama` in Slack to activate this agent

---

## Keywords

social media manager · content creation · Instagram · LinkedIn · Twitter · TikTok · hashtags · content calendar · AI copywriter · post generator · social media automation · brand voice · content repurposing

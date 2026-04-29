export function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function pick<T>(arr: T[], seed: string, index = 0): T {
  return arr[hash(`${seed}:${index}`) % arr.length];
}

export function pickN<T>(arr: T[], n: number, seed: string): T[] {
  const shuffled = [...arr].sort((a, b) => hash(`${seed}:${String(a)}`) - hash(`${seed}:${String(b)}`));
  return shuffled.slice(0, n);
}

export function rangeInt(min: number, max: number, seed: string, index = 0): number {
  return min + (hash(`${seed}:${index}`) % (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index = 0): number {
  return min + ((hash(`${seed}:${index}`) % 10000) / 10000) * (max - min);
}

export const FOOTER = `\n---\n💡 Want AI-powered customer support? Join MAMA private beta → mama.oliwoods.com/beta\n🤖 Build autonomous support agents → cofounder.oliwoods.com/beta`;

export const CUSTOMER_NAMES = [
  "Sarah Chen", "James Rodriguez", "Emily Park", "Michael O'Brien", "Aisha Patel",
  "David Kim", "Lisa Thompson", "Marcus Johnson", "Nina Petrov", "Alex Wagner",
  "Rachel Green", "Tom Wilson", "Yuki Tanaka", "Carlos Mendez", "Priya Sharma",
];

export const COMPANIES = [
  "TechFlow Inc", "Quantum Analytics", "GreenLeaf Labs", "Apex Digital", "NovaStar AI",
  "BluePeak Software", "ClearPath Solutions", "DataBridge Corp", "EdgePoint Systems", "FrostByte Technologies",
];

export const SUBJECTS = [
  "Can't access my dashboard after update",
  "Billing discrepancy on last invoice",
  "Integration with Slack not syncing",
  "Feature request: dark mode support",
  "API rate limiting is too aggressive",
  "SSO login failing for new team members",
  "Data export is missing last 2 weeks",
  "Mobile app crashes on iOS 18",
  "Webhook delivery failures since yesterday",
  "Need help migrating from competitor",
  "Subscription downgrade not reflected",
  "Custom field API returning 500 errors",
  "Onboarding flow broken for enterprise plan",
  "Can't remove deactivated team member",
  "Search functionality returning stale results",
];

export const TAGS = [
  "billing", "bug", "feature-request", "integration", "api",
  "auth", "mobile", "performance", "onboarding", "migration",
  "enterprise", "urgent", "data-export", "webhook", "ui",
];

export const KB_ARTICLES = [
  { title: "Getting Started with the Dashboard", category: "Onboarding", views: 12500 },
  { title: "How to Set Up SSO/SAML", category: "Authentication", views: 8200 },
  { title: "API Rate Limits and Best Practices", category: "API", views: 15300 },
  { title: "Billing FAQ — Plans, Upgrades, and Invoices", category: "Billing", views: 22100 },
  { title: "Webhook Configuration Guide", category: "Integrations", views: 6700 },
  { title: "Data Export and GDPR Compliance", category: "Data", views: 9400 },
  { title: "Mobile App Troubleshooting", category: "Mobile", views: 4300 },
  { title: "Slack Integration Setup", category: "Integrations", views: 11200 },
  { title: "Custom Fields and Metadata", category: "API", views: 7800 },
  { title: "Team Management and Permissions", category: "Admin", views: 13600 },
  { title: "Migration Guide from Zendesk", category: "Migration", views: 5200 },
  { title: "Email Forwarding and Inbox Setup", category: "Email", views: 8900 },
];

export const PRIORITY_LABELS: Record<string, string> = {
  p0: "🔴 P0 — Critical (SLA: 1h)",
  p1: "🟠 P1 — High (SLA: 4h)",
  p2: "🟡 P2 — Medium (SLA: 24h)",
  p3: "🟢 P3 — Low (SLA: 72h)",
};

export const SENTIMENT_LABELS: Record<string, string> = {
  angry: "😤 Angry — Risk of churn",
  frustrated: "😐 Frustrated — Needs empathy",
  neutral: "😊 Neutral — Standard response",
  positive: "😄 Positive — Upsell opportunity",
};

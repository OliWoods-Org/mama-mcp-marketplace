import { z } from "zod";
import { seededPick, seededInt, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const VendorChecklistInput = z.object({
  vendor_type: z.enum([
    "photographer",
    "florist",
    "dj",
    "caterer",
    "officiant",
    "videographer",
    "hair_makeup",
    "baker",
    "transportation",
    "wedding_planner",
  ]).describe("Type of wedding vendor"),
});

type VendorProfile = {
  questions_to_ask: string[];
  contract_must_haves: string[];
  typical_pricing: string;
  red_flags: string[];
  tipping_guide: string;
  booking_timeline: string;
};

const VENDOR_PROFILES: Record<string, VendorProfile> = {
  photographer: {
    questions_to_ask: [
      "Can I see two or three full wedding galleries — not just highlight shots?",
      "Will you be the photographer on the day, or will you send an associate?",
      "How many images should I expect to receive, and in what format?",
      "What is your backup plan if you have an emergency the day of the wedding?",
      "How do you deliver images — online gallery, USB, or both?",
      "What is your turnaround time for the full gallery?",
      "Do you stay through the entire reception or leave at a set time?",
      "Have you shot at my venue before? If not, will you do a site visit?",
      "How long will you store our images after delivery?",
      "Do you bring second shooters and is that included in the package?",
    ],
    contract_must_haves: [
      "Specific photographer named — not 'photographer or associate'",
      "Deliverable count (minimum number of edited images)",
      "Delivery timeline (typically 6–12 weeks)",
      "Backup and emergency plan in writing",
      "Usage rights and social media terms",
      "Full payment schedule and cancellation policy",
      "What happens if images are lost or corrupted",
    ],
    typical_pricing: "$2,000–8,000+ for a full day; $3,500–5,500 national average",
    red_flags: [
      "Cannot show full galleries — only curated samples",
      "Refuses to name the specific photographer in the contract",
      "No backup plan for illness or emergency",
      "Pricing significantly below market with no explanation",
      "No mention of image storage after delivery",
    ],
    tipping_guide: "$50–200 per photographer at the reception; not mandatory but appreciated for exceptional work",
    booking_timeline: "12–18 months before the wedding for popular photographers in major markets",
  },
  florist: {
    questions_to_ask: [
      "Can I see photos of weddings you've done in my style and budget range?",
      "Will you handle full setup and breakdown on the wedding day?",
      "What flowers are in season on our wedding date — and how does that affect pricing?",
      "How many other weddings will you be doing the same weekend?",
      "Will you personally be at our wedding or will you send an associate?",
      "What is your policy if a specific flower is unavailable day-of?",
      "Do you offer rentals for arches, vessels, or candelabras?",
      "How do you handle the breakdown of flowers after the ceremony?",
    ],
    contract_must_haves: [
      "Itemised quote by arrangement — not a lump sum",
      "Substitution policy for unavailable flowers",
      "Delivery window and setup timeline",
      "Breakdown and removal responsibilities",
      "Rental terms if applicable",
      "Payment schedule",
    ],
    typical_pricing: "$1,500–8,000+ depending on scale; average 8–10% of wedding budget",
    red_flags: [
      "Provides a quote without a detailed meeting — florals are highly visual and personal",
      "Cannot provide references from similar-scale weddings",
      "No substitution policy — what if peonies aren't available in December?",
      "Charges full price for flowers that can be moved from ceremony to reception (repurposing)",
    ],
    tipping_guide: "$50–200 for the team on delivery day; based on setup complexity",
    booking_timeline: "6–9 months out; earlier for popular weekends",
  },
  dj: {
    questions_to_ask: [
      "Can I attend a current event you're DJing to see you in action?",
      "Will you be the DJ at our event, or could it be an associate?",
      "How do you handle song requests from guests during the reception?",
      "What is your MC style — high energy, low-key, or somewhere in between?",
      "What is your backup equipment plan in case of technical failure?",
      "How much of your set list do you customise vs. use stock playlists?",
      "Will you meet with us beforehand to go through our must-play and do-not-play lists?",
      "Do you coordinate with the venue AV system and other vendors?",
      "What is your setup and breakdown time?",
    ],
    contract_must_haves: [
      "Named DJ (not 'or associate')",
      "Performance hours with overtime rate",
      "Equipment list and backup plan",
      "MC responsibilities defined",
      "Must-play and do-not-play acknowledgement",
      "Setup time and logistics",
    ],
    typical_pricing: "$1,200–4,000; band is typically $4,000–15,000+ for comparison",
    red_flags: [
      "Will not let you customise the playlist or has a 'no requests' policy",
      "Cannot show you a contract with a named DJ",
      "No backup equipment mentioned",
      "Does not want to meet in advance to discuss your vision",
    ],
    tipping_guide: "$50–150 for an outstanding performance; not expected for average service",
    booking_timeline: "9–12 months out; in-demand DJs book quickly",
  },
  caterer: {
    questions_to_ask: [
      "Can we schedule a tasting before signing the contract?",
      "What is included in the per-person cost — servers, linens, plates, setup, breakdown?",
      "What is your staff-to-guest ratio for the service style we've chosen?",
      "How do you handle dietary restrictions (vegan, gluten-free, allergies)?",
      "Who is the point of contact on the day of the event?",
      "What happens to leftover food — can we take it, or is it donated?",
      "Are you licensed and insured? Do you have a catering licence and liquor licence (if serving alcohol)?",
      "What is your cancellation and rescheduling policy?",
      "Do you provide a cake-cutting service and is there a fee?",
    ],
    contract_must_haves: [
      "Per-person price and minimum guest count",
      "Itemised list of what is included (rentals, staff, setup)",
      "Menu selections confirmed in writing",
      "Service style (buffet, plated, family-style, stations)",
      "Overtime fees for extended events",
      "Alcohol and liquor licence confirmation",
    ],
    typical_pricing: "$75–250+ per person; average $85–125 for mid-market catering",
    red_flags: [
      "Refuses to do a tasting before contract signing",
      "Cannot provide a liquor licence number if serving alcohol",
      "Lump-sum quote with no line-item detail",
      "Does not have a named event manager for your day",
    ],
    tipping_guide: "15–20% of food and beverage cost for outstanding service, or $20–50 per server; often distributed by the catering manager",
    booking_timeline: "9–12 months; earlier for exclusive venue caterers",
  },
  officiant: {
    questions_to_ask: [
      "Are you legally authorised to perform marriages in our state and county?",
      "Have you officiated weddings at our venue before?",
      "Will you meet with us beforehand to personalise the ceremony?",
      "How long is a typical ceremony you conduct?",
      "Are you open to incorporating personal vows, readings, or cultural elements?",
      "Will you provide a ceremony script and review it with us in advance?",
      "What happens if you have an emergency the day of — do you have a backup?",
      "Do you require a rehearsal?",
    ],
    contract_must_haves: [
      "Legally ordained in the relevant state",
      "Date, time, and venue confirmed",
      "Ceremony length and structure agreed",
      "Personalisation terms (custom vows, readings)",
      "Marriage licence handling responsibility clarified",
    ],
    typical_pricing: "$300–800 for a professional officiant; free for a friend ordained online",
    red_flags: [
      "Cannot confirm their ordination is valid in your state",
      "Refuses to personalise the ceremony at all",
      "No in-person or video call meeting offered before the wedding",
    ],
    tipping_guide: "$50–100 tip if not clergy; cash gift or donation to a charity of choice for clergy",
    booking_timeline: "9–12 months; religious officiants may have their own booking requirements",
  },
  videographer: {
    questions_to_ask: [
      "Can I watch a full-length wedding film from a recent wedding — not just the trailer?",
      "What is your editing style — cinematic, documentary, or storytelling?",
      "Will you be the videographer on the day, or will you send an associate?",
      "How do you coordinate with the photographer to avoid conflicts?",
      "What is your turnaround time for the final film?",
      "How many cameras will you use?",
      "What raw footage do I receive, if any?",
      "Can you provide drone footage and is that included or extra?",
    ],
    contract_must_haves: [
      "Deliverable: highlight film length and full-length film if included",
      "Named videographer in contract",
      "Delivery timeline",
      "Number of cameras and crew",
      "Music licensing for the final film",
    ],
    typical_pricing: "$2,000–6,000+ for professional videography",
    red_flags: [
      "Cannot show full films — only trailers",
      "Uses copyrighted music without licensing",
      "No named videographer in contract",
    ],
    tipping_guide: "$50–150 per videographer; same guidance as photographer",
    booking_timeline: "12–18 months; often books at the same time as the photographer",
  },
  hair_makeup: {
    questions_to_ask: [
      "Can I book a trial session before the wedding day?",
      "Do you have experience with my hair type and skin tone?",
      "Will you be the artist on the day or will you bring an assistant?",
      "How much time do you allocate per person for hair and makeup?",
      "Do you travel to the venue or hotel, and is there a travel fee?",
      "What products do you use — are they long-lasting/airbrush?",
      "What is your policy if I want changes to the trial look on the wedding day?",
      "Can you accommodate my bridal party in the time available?",
    ],
    contract_must_haves: [
      "Trial date, time, and included in the contract",
      "Named artist for the wedding day",
      "Hours of service and per-person timing",
      "Travel fee clearly stated",
      "Payment schedule and cancellation policy",
    ],
    typical_pricing: "$200–600 for bridal hair and makeup; $100–250 per bridesmaid",
    red_flags: [
      "Does not offer a trial session",
      "Cannot show a portfolio of work matching your style and ethnicity",
      "Prices all-in with no breakdown — how long per person?",
    ],
    tipping_guide: "15–20% of the service total; cash on the day",
    booking_timeline: "6–9 months; top artists in major markets book quickly",
  },
  baker: {
    questions_to_ask: [
      "Can we schedule a tasting with several flavours?",
      "Are allergen-free options (gluten-free, nut-free) available?",
      "Do you deliver and set up on site, and is there a delivery fee?",
      "How far in advance is the cake baked?",
      "What is your policy if there is accidental damage during delivery?",
      "Can you replicate a design I show you, or do you have a signature style?",
      "Do you provide a cake cutting service, or do we need the caterer to do it?",
    ],
    contract_must_haves: [
      "Cake design confirmed with sketch or reference photos",
      "Serving count",
      "Delivery time and setup responsibilities",
      "Damage/defect policy",
      "Deposit and final payment timeline",
    ],
    typical_pricing: "$5–15+ per serving; average tiered cake $500–1,500+",
    red_flags: [
      "Will not do a tasting before contract",
      "No delivery or setup offered for large cakes",
      "Unable to accommodate stated allergies",
    ],
    tipping_guide: "$25–50 for the baker/delivery team; not required but appreciated",
    booking_timeline: "4–6 months out",
  },
  transportation: {
    questions_to_ask: [
      "Is the vehicle you're quoting the actual vehicle we'll have, and can I see it?",
      "Will a professional, licensed chauffeur be driving?",
      "What is your hourly minimum and overtime rate?",
      "Do you provide water or any amenities in the vehicle?",
      "What is your cancellation and bad-weather policy?",
      "What is the backup plan if the vehicle breaks down?",
      "Are gratuity and fuel included in the quoted price or added separately?",
    ],
    contract_must_haves: [
      "Specific vehicle make, model, year, and colour",
      "Named driver or confirmation of professional chauffeur",
      "All-in pricing — fuel and gratuity stated",
      "Pickup and drop-off locations and times",
      "Overtime rate",
    ],
    typical_pricing: "$100–250/hour for limo; $500–1,500 for full day",
    red_flags: [
      "Quotes a vehicle that 'may be subject to change'",
      "Adds fuel and gratuity as surprises after signing",
      "No licenced, insured operation",
    ],
    tipping_guide: "15–20% of the total transportation cost; often included in the quote — confirm",
    booking_timeline: "4–6 months out",
  },
  wedding_planner: {
    questions_to_ask: [
      "What is the difference between your full-planning, partial-planning, and day-of coordinator packages?",
      "How many other weddings will you be managing in the same month as ours?",
      "Will you be personally present on our wedding day, or will you send a team member?",
      "What is your vendor referral process — do you take commissions?",
      "Can I contact your past clients directly for references?",
      "What is your emergency/backup plan if you are ill on the wedding day?",
      "How do you handle budget tracking throughout the planning process?",
      "Do you have preferred vendor relationships that might affect who you recommend?",
    ],
    contract_must_haves: [
      "Specific services and deliverables listed",
      "Named planner for the wedding day",
      "Communication expectations (response time, meeting frequency)",
      "Vendor commission disclosure",
      "Backup plan in writing",
      "Full payment schedule",
    ],
    typical_pricing: "$1,500–5,000 (day-of coordinator); $4,000–10,000+ (partial planning); $8,000–25,000+ (full planning)",
    red_flags: [
      "Receives undisclosed commissions from vendor referrals",
      "Will not name themselves as the planner on your day",
      "Negative vendor relationships or poor communication responsiveness",
    ],
    tipping_guide: "$100–500 for a day-of coordinator; $200–1,000+ for a full-service planner; based on how indispensable they were",
    booking_timeline: "As early as possible — 12+ months for full planning; 6–9 months for partial; 3–6 months for day-of",
  },
};

export function vendorChecklist(input: z.infer<typeof VendorChecklistInput>): string {
  const key = normKey(input.vendor_type);
  const profile = VENDOR_PROFILES[input.vendor_type];

  const result = {
    vendor_type: input.vendor_type.replace(/_/g, " "),
    typical_pricing_range: profile.typical_pricing,
    book_by: profile.booking_timeline,
    top_questions_to_ask: profile.questions_to_ask.map((q, i) => ({ number: i + 1, question: q })),
    contract_essentials: profile.contract_must_haves,
    red_flags_to_watch_for: profile.red_flags,
    tipping_guide: profile.tipping_guide,
    pro_tip: seededPick(key, "tip", [
      "Always meet at least two vendors in each category — comparison gives you leverage and confidence.",
      "Never book without seeing a contract first — verbal agreements are unenforceable.",
      "Ask for references from weddings specifically, not events in general.",
      "Pay by credit card when possible — provides dispute resolution if vendor fails to deliver.",
    ]),
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

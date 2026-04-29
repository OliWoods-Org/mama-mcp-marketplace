import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const TimelineBuilderInput = z.object({
  wedding_date: z.string().describe("Wedding date in YYYY-MM-DD format"),
  engagement_date: z.string().describe("Engagement date in YYYY-MM-DD format"),
});

type Milestone = {
  timeframe: string;
  months_before: number;
  tasks: string[];
  vendor_bookings: string[];
  decisions_required: string[];
};

const PLANNING_MILESTONES: Milestone[] = [
  {
    timeframe: "Immediately (engaged!)",
    months_before: 24,
    tasks: [
      "Celebrate and share the news",
      "Discuss wedding vision, priorities, and must-haves as a couple",
      "Determine who is contributing financially and establish total budget",
      "Agree on approximate guest count and wedding style",
      "Create a shared folder/planning tool for saving ideas",
    ],
    vendor_bookings: [],
    decisions_required: ["Approximate guest count", "Budget", "General vision (intimate / classic / luxury)"],
  },
  {
    timeframe: "12+ months before",
    months_before: 12,
    tasks: [
      "Establish and finalise total budget by category",
      "Research and create a preliminary guest list",
      "Visit and book venue — this is the single most time-sensitive booking",
      "Set the date (venue availability drives the date in most markets)",
      "Research photographers and videographers — top professionals book 12–18 months out",
      "Announce engagement publicly if desired",
      "Begin dress research — bridal gowns take 6–9 months to order and alter",
    ],
    vendor_bookings: ["Venue (critical)", "Photographer", "Videographer"],
    decisions_required: ["Wedding date", "Venue", "Guest list version 1"],
  },
  {
    timeframe: "9–12 months before",
    months_before: 10,
    tasks: [
      "Order wedding dress and bridesmaid dresses",
      "Book officiant",
      "Book catering if not included with venue",
      "Research and book live band or DJ",
      "Plan and book engagement session with photographer",
      "Begin honeymoon research; book flights and accommodation for popular destinations",
      "Hire a wedding planner or day-of coordinator if desired",
    ],
    vendor_bookings: ["Officiant", "Caterer", "Band / DJ", "Wedding coordinator"],
    decisions_required: ["Officiant type (religious / civil / friend)", "Caterer style"],
  },
  {
    timeframe: "6–9 months before",
    months_before: 7,
    tasks: [
      "Book florist",
      "Finalise honeymoon; book all reservations",
      "Send save-the-dates (especially for destination weddings — 8–12 months out)",
      "Register for gifts at 2–3 stores with variety of price points",
      "Schedule hair and makeup artist trial and booking",
      "Start dress fittings (first of typically 3–4)",
      "Plan rehearsal dinner venue and host",
      "Book hotel room blocks for out-of-town guests",
    ],
    vendor_bookings: ["Florist", "Hair and makeup artist", "Rehearsal dinner venue"],
    decisions_required: ["Floral style and colour palette", "Hair and makeup look"],
  },
  {
    timeframe: "4–6 months before",
    months_before: 5,
    tasks: [
      "Design and order invitations (allow 2 months for design + print + mailing)",
      "Finalise ceremony details with officiant",
      "Book transportation (limo, getaway car, shuttle bus)",
      "Order wedding cake or dessert from baker",
      "Purchase wedding bands",
      "Plan ceremony music and processional",
      "Book accommodations for wedding night",
      "Finalize wedding party attire (suit/tux rentals or purchases)",
    ],
    vendor_bookings: ["Baker / cake designer", "Transportation", "Stationers"],
    decisions_required: ["Invitation design", "Ceremony music", "Cake flavour and design"],
  },
  {
    timeframe: "2–3 months before",
    months_before: 2,
    tasks: [
      "Mail invitations (8–10 weeks before with RSVP deadline 4 weeks before)",
      "Finalise menu with caterer",
      "Write vows (if personal vows)",
      "Create a day-of timeline and share with all vendors",
      "Schedule final dress fittings",
      "Create seating chart as RSVPs come in",
      "Finalise rehearsal dinner guest list and menu",
      "Obtain marriage licence (timing requirements vary by state — check local rules)",
    ],
    vendor_bookings: [],
    decisions_required: ["Final menu", "Seating chart draft", "Personal vows"],
  },
  {
    timeframe: "1 month before",
    months_before: 1,
    tasks: [
      "Chase any outstanding RSVPs; finalise headcount for caterer",
      "Confirm all vendor bookings with final details and timing",
      "Prepare vendor payment envelopes and tip amounts",
      "Have final dress fitting; steam or press gown",
      "Create final seating chart",
      "Delegate day-of tasks to trusted family/bridal party members",
      "Write and finalise toasts if applicable",
      "Break in new wedding shoes",
    ],
    vendor_bookings: [],
    decisions_required: ["Final headcount", "Final seating chart", "Vendor tip plan"],
  },
  {
    timeframe: "1 week before",
    months_before: 0,
    tasks: [
      "Send final headcount to caterer",
      "Confirm logistics and timing with all vendors by phone/email",
      "Attend rehearsal dinner; practice processional",
      "Prepare wedding day emergency kit",
      "Delegate honeymoon packing and transport",
      "Get a full night of sleep — protect the last few nights",
      "Assign someone to collect cards and gifts at reception",
    ],
    vendor_bookings: [],
    decisions_required: ["Final vendor payment instructions confirmed"],
  },
];

const VENDOR_PRIORITY_ORDER = [
  { rank: 1, vendor: "Venue", reason: "Venue sets the date; everything else follows. Books 12–24 months out in major markets." },
  { rank: 2, vendor: "Photographer / Videographer", reason: "Top photographers book 12–18 months out. No going back on this memory." },
  { rank: 3, vendor: "Wedding Planner / Coordinator", reason: "A planner helps with all remaining bookings; higher value earlier." },
  { rank: 4, vendor: "Catering", reason: "Often tied to venue; if not, book 9–12 months out." },
  { rank: 5, vendor: "Band / DJ", reason: "In-demand performers book 9–12 months out." },
  { rank: 6, vendor: "Officiant", reason: "Religious officiants may have limited availability; book 9–12 months out." },
  { rank: 7, vendor: "Florist", reason: "Top florists book 6–9 months out." },
  { rank: 8, vendor: "Hair and Makeup Artist", reason: "Schedule trial before booking; books 6–9 months out." },
  { rank: 9, vendor: "Baker / Cake Designer", reason: "Books 4–6 months out; tastings required." },
  { rank: 10, vendor: "Transportation", reason: "Books 4–6 months out; confirm vehicle availability for your date." },
];

export function timelineBuilder(input: z.infer<typeof TimelineBuilderInput>): string {
  const key = normKey(input.wedding_date + input.engagement_date);

  const weddingDate = new Date(input.wedding_date);
  const engagementDate = new Date(input.engagement_date);
  const today = new Date();

  const totalMonthsToWedding = Math.max(0,
    (weddingDate.getFullYear() - today.getFullYear()) * 12 +
    (weddingDate.getMonth() - today.getMonth())
  );

  const totalEngagementMonths = Math.max(0,
    (weddingDate.getFullYear() - engagementDate.getFullYear()) * 12 +
    (weddingDate.getMonth() - engagementDate.getMonth())
  );

  const urgencyNote =
    totalMonthsToWedding < 3
      ? "🚨 Very short timeline — focus immediately on venue, photographer, and catering."
      : totalMonthsToWedding < 6
      ? "⚠️  Short timeline — prioritise venue and photographer bookings this week."
      : totalMonthsToWedding < 12
      ? "✅ Manageable timeline — work through vendor bookings in priority order."
      : "✅ Excellent timeline — you have time to be selective on all vendors.";

  const overdueMilestones = PLANNING_MILESTONES.filter(
    m => m.months_before > totalMonthsToWedding && m.months_before < 12
  );

  const upcomingMilestones = PLANNING_MILESTONES.filter(
    m => m.months_before <= totalMonthsToWedding
  ).sort((a, b) => b.months_before - a.months_before);

  const result = {
    wedding_date: input.wedding_date,
    engagement_date: input.engagement_date,
    months_until_wedding: totalMonthsToWedding,
    total_engagement_length_months: totalEngagementMonths,
    timeline_assessment: urgencyNote,
    ...(overdueMilestones.length > 0 ? {
      overdue_or_urgent_milestones: overdueMilestones.map(m => ({
        timeframe: m.timeframe,
        critical_tasks: m.tasks.slice(0, 3),
        vendor_bookings_needed: m.vendor_bookings,
      })),
    } : {}),
    planning_timeline: upcomingMilestones,
    vendor_booking_priority_order: VENDOR_PRIORITY_ORDER,
    key_deadlines: [
      { task: "Book venue", deadline: `${Math.max(0, totalMonthsToWedding - 12)} months ago (do immediately if not done)` },
      { task: "Mail save-the-dates", deadline: "8–12 months before (earlier for destination weddings)" },
      { task: "Mail invitations", deadline: "8–10 weeks before wedding" },
      { task: "RSVP deadline", deadline: "4–5 weeks before wedding" },
      { task: "Final headcount to caterer", deadline: "2 weeks before wedding" },
      { task: "Obtain marriage licence", deadline: "Check your state/county — some require weeks in advance" },
    ],
    pro_tip: seededPick(key, "tip", [
      "The 3 most time-sensitive bookings are venue, photographer, and band/DJ. Do these first.",
      "Set a reminder for every milestone 2 weeks before the deadline — don't wait until the due date.",
      "Keep a shared planning spreadsheet with both partners — decision fatigue is real.",
      "Assign a trusted friend or planner to handle vendor communication the week of the wedding.",
    ]),
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

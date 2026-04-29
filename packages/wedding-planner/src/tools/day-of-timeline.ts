import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const DayOfTimelineInput = z.object({
  ceremony_time: z.string().describe("Ceremony start time, e.g. '4:00 PM'"),
  reception_start_time: z.string().optional().describe("Reception start time if different location, e.g. '6:00 PM'"),
  bridal_party_size: z.number().min(0).max(20).describe("Total bridal party size (bridesmaids + groomsmen, not counting couple)"),
  hair_makeup_count: z.number().min(1).max(30).describe("Number of people getting hair and makeup"),
  first_look: z.boolean().default(false).describe("Will there be a first look before the ceremony?"),
  cocktail_hour: z.boolean().default(true).describe("Is there a cocktail hour between ceremony and reception?"),
  reception_end_time: z.string().optional().describe("End time for the reception, e.g. '11:00 PM'"),
  additional_notes: z.string().optional().describe("Any special circumstances, e.g. 'outdoor ceremony', 'two venues'"),
});

function parseTime(timeStr: string): Date {
  const d = new Date();
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return d;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function addMinutes(d: Date, mins: number): Date {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() + mins);
  return copy;
}

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${period}`;
}

type TimelineEvent = {
  time: string;
  event: string;
  who: string;
  notes?: string;
};

export function dayOfTimeline(input: z.infer<typeof DayOfTimelineInput>): string {
  const key = normKey(input.ceremony_time + input.bridal_party_size);

  const ceremonyStart = parseTime(input.ceremony_time);
  const minsPerPerson = 45;
  const hairMakeupTotal = input.hair_makeup_count * minsPerPerson;

  // Work backwards from ceremony for hair and makeup
  const hmEnd = addMinutes(ceremonyStart, -90);
  const hmStart = addMinutes(hmEnd, -hairMakeupTotal);

  const events: TimelineEvent[] = [];

  // Morning
  const morningStart = addMinutes(hmStart, -30);
  events.push({ time: formatTime(morningStart), event: "Getting ready suite opens — breakfast, mimosas, and relaxed start", who: "Couple + bridal party", notes: "Vendor tip: have snacks available all morning" });
  events.push({ time: formatTime(addMinutes(morningStart, 15)), event: "Photographer and videographer arrive — getting ready coverage begins", who: "Photographer, Videographer", notes: "Ensure dress, rings, and detail items are accessible for flat-lay shots" });
  events.push({ time: formatTime(hmStart), event: `Hair and makeup begins (${input.hair_makeup_count} people × ~45 min each)`, who: "Bride + bridal party", notes: `Bride scheduled LAST for makeup to stay fresh` });

  // First look or couple prep
  if (input.first_look) {
    const firstLookTime = addMinutes(ceremonyStart, -75);
    events.push({ time: formatTime(firstLookTime), event: "All hair and makeup complete — everyone dressed", who: "Full bridal party" });
    events.push({ time: formatTime(addMinutes(firstLookTime, 15)), event: "First look — couple sees each other privately", who: "Couple, Photographer, Videographer", notes: "Choose a quiet, visually clean spot; keep guests away" });
    events.push({ time: formatTime(addMinutes(firstLookTime, 30)), event: "Bridal party portraits", who: "Full bridal party, Photographer" });
    events.push({ time: formatTime(addMinutes(firstLookTime, 55)), event: "Family formals (if doing before ceremony)", who: "Family, Couple, Photographer", notes: "Have a shot list with family groupings pre-planned" });
  } else {
    const dressedTime = addMinutes(ceremonyStart, -60);
    events.push({ time: formatTime(dressedTime), event: "All hair and makeup complete — everyone dressed", who: "Full bridal party" });
    events.push({ time: formatTime(addMinutes(dressedTime, 10)), event: "Bridal party portraits (getting ready location)", who: "Bridal party, Photographer" });
  }

  // Pre-ceremony
  events.push({ time: formatTime(addMinutes(ceremonyStart, -45)), event: "Transportation departs to ceremony venue", who: "Couple + bridal party", notes: "Add 15-min buffer to travel time" });
  events.push({ time: formatTime(addMinutes(ceremonyStart, -30)), event: "Couple + bridal party arrive at ceremony venue", who: "All", notes: "Groom/partner and groomsmen in position" });
  events.push({ time: formatTime(addMinutes(ceremonyStart, -30)), event: "Guests begin to be seated by ushers", who: "Ushers, Guests" });
  events.push({ time: formatTime(addMinutes(ceremonyStart, -15)), event: "Musicians/DJ plays prelude music", who: "Musicians / DJ" });
  events.push({ time: formatTime(addMinutes(ceremonyStart, -5)), event: "Wedding party lines up for processional", who: "Bridal party, Officiant" });

  // Ceremony
  events.push({ time: formatTime(ceremonyStart), event: "Ceremony begins — processional", who: "All guests, wedding party", notes: "Buffer: ceremonies average 25–40 min for a non-religious service; 45–75 min for religious" });
  const ceremonyEnd = addMinutes(ceremonyStart, 35);
  events.push({ time: formatTime(ceremonyEnd), event: "Ceremony ends — recessional; couple exits first", who: "Couple, then wedding party, then guests" });

  // Post-ceremony
  events.push({ time: formatTime(addMinutes(ceremonyEnd, 5)), event: "Receiving line (optional — 5–20 min depending on guest count)", who: "Couple + immediate family", notes: "Skip receiving line if guest count > 100 — do tableside greetings at reception instead" });

  if (input.cocktail_hour) {
    const cocktailStart = addMinutes(ceremonyEnd, 15);
    events.push({ time: formatTime(cocktailStart), event: "Cocktail hour begins — guests move to cocktail space", who: "Guests, Bar Staff, Catering" });
    events.push({ time: formatTime(addMinutes(cocktailStart, 5)), event: "Formal family portraits and bridal party portraits (if not done before ceremony)", who: "Couple, family, wedding party, Photographer", notes: "Pre-assign a family wrangler to gather groups quickly" });
    events.push({ time: formatTime(addMinutes(cocktailStart, 45)), event: "Portraits complete — couple joins cocktail hour briefly (optional)", who: "Couple" });

    const receptionStart = input.reception_start_time
      ? parseTime(input.reception_start_time)
      : addMinutes(cocktailStart, 60);
    events.push({ time: formatTime(receptionStart), event: "Guests invited into reception space", who: "All guests" });
    events.push({ time: formatTime(addMinutes(receptionStart, 5)), event: "Grand entrance — wedding party and couple announced", who: "Couple, bridal party, DJ/MC" });
    events.push({ time: formatTime(addMinutes(receptionStart, 10)), event: "First dance", who: "Couple", notes: "3–4 minutes" });
    events.push({ time: formatTime(addMinutes(receptionStart, 15)), event: "Welcome toast by best man / maid of honour", who: "Best man / MOH", notes: "Target: 2–3 min each; share timing with speakers in advance" });
    events.push({ time: formatTime(addMinutes(receptionStart, 25)), event: "Dinner service begins", who: "Catering staff, guests" });
    events.push({ time: formatTime(addMinutes(receptionStart, 30)), event: "Parent dances (mother-son, father-daughter)", who: "Couple with parents" });
    events.push({ time: formatTime(addMinutes(receptionStart, 55)), event: "Cake cutting — signals dessert service", who: "Couple", notes: "Coordinate with catering so dessert is ready immediately after" });
    events.push({ time: formatTime(addMinutes(receptionStart, 65)), event: "Open dancing begins", who: "All guests, DJ/Band" });
    events.push({ time: formatTime(addMinutes(receptionStart, 120)), event: "Bouquet toss / garter toss (if included)", who: "Couple, guests" });
    events.push({ time: formatTime(addMinutes(receptionStart, 150)), event: "Last dance announced", who: "DJ/MC, all guests" });
    const receptionEndTime = input.reception_end_time ? parseTime(input.reception_end_time) : addMinutes(receptionStart, 180);
    events.push({ time: formatTime(addMinutes(receptionEndTime, -5)), event: "Send-off / sparkler exit", who: "All guests, Couple", notes: "Assign someone to coordinate guests into two lines" });
    events.push({ time: formatTime(receptionEndTime), event: "Reception ends — couple departs", who: "Couple" });
    events.push({ time: formatTime(addMinutes(receptionEndTime, 30)), event: "Vendor breakdown complete; gifts and personal items collected", who: "Designated family member or coordinator", notes: "Assign one trusted person to collect cards and gifts" });
  }

  // Sort by time
  events.sort((a, b) => {
    const ta = parseTime(a.time).getTime();
    const tb = parseTime(b.time).getTime();
    return ta - tb;
  });

  const result = {
    ceremony_time: input.ceremony_time,
    bridal_party_size: input.bridal_party_size,
    hair_makeup_count: input.hair_makeup_count,
    first_look: input.first_look,
    cocktail_hour: input.cocktail_hour,
    hair_makeup_start_time: formatTime(hmStart),
    day_of_timeline: events,
    buffer_reminders: [
      "Add 15 min to ALL travel times — traffic, parking, and loading are unpredictable.",
      "Family formals average 3–5 min per grouping — plan 30–45 min for 8–10 groupings.",
      "Dinner service runs long — plan 60–75 min even for a served meal.",
      "Speeches run long — give speakers a time limit in advance.",
    ],
    vendor_callsheet_reminder: "Share the final timeline with ALL vendors at least 1 week before the wedding. Include: photographer, videographer, caterer, DJ/band, florist, planner/coordinator.",
    emergency_kit_checklist: [
      "Safety pins, fashion tape, needle and thread",
      "Stain remover pen",
      "Pain relievers, antacids",
      "Phone chargers and portable battery",
      "Extra lipstick and touch-up kit",
      "Vendor payment envelopes with cash tips",
      "Marriage licence",
    ],
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

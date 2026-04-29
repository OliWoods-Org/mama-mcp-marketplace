import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const SeatingChartInput = z.object({
  guests: z.array(z.object({
    name: z.string(),
    group: z.string().describe("e.g. 'bride_family', 'groom_family', 'college_friends', 'work_colleagues'"),
    relationship: z.string().optional().describe("e.g. 'aunt', 'college roommate', 'coworker'"),
    plus_one: z.boolean().optional().default(false),
  })).min(1).describe("List of confirmed guests"),
  table_size: z.number().min(2).max(20).default(8).describe("Seats per table"),
  must_separate: z.array(z.array(z.string()).min(2).max(2)).optional().describe("Pairs of guest names that must NOT be seated together"),
  vip_guests: z.array(z.string()).optional().describe("Names of VIP guests who should be seated near the couple"),
});

type TableAssignment = {
  table_number: number;
  table_label: string;
  guests: string[];
  dominant_group: string;
  reasoning: string;
};

export function seatingChart(input: z.infer<typeof SeatingChartInput>): string {
  const key = normKey(input.guests.map(g => g.name).join("") + input.table_size);

  // Build flat guest list with plus ones
  const allGuests: Array<{ name: string; group: string; relationship?: string }> = [];
  for (const g of input.guests) {
    allGuests.push({ name: g.name, group: g.group, relationship: g.relationship });
    if (g.plus_one) {
      allGuests.push({ name: `${g.name}'s Guest`, group: g.group, relationship: "plus one" });
    }
  }

  const totalGuests = allGuests.length;
  const tableCount = Math.ceil(totalGuests / input.table_size);
  const mustSeparateSet = new Set((input.must_separate ?? []).map(pair => `${pair[0]}|${pair[1]}`));

  // Group guests by their group label
  const groupMap: Record<string, typeof allGuests> = {};
  for (const g of allGuests) {
    if (!groupMap[g.group]) groupMap[g.group] = [];
    groupMap[g.group].push(g);
  }

  const tables: TableAssignment[] = [];
  let tableNum = 1;

  // VIP table near the couple (table 1 = head table or sweetheart priority)
  const vipNames = new Set(input.vip_guests ?? []);
  const vipGuests = allGuests.filter(g => vipNames.has(g.name));
  const assignedNames = new Set<string>();

  if (vipGuests.length > 0) {
    const tableGuests = vipGuests.slice(0, input.table_size);
    tableGuests.forEach(g => assignedNames.add(g.name));
    tables.push({
      table_number: tableNum++,
      table_label: "Head / VIP Table",
      guests: tableGuests.map(g => g.name),
      dominant_group: "mixed_vip",
      reasoning: "VIP guests designated to sit close to the couple.",
    });
  }

  // Assign remaining groups to tables
  const remainingByGroup = Object.entries(groupMap).map(([group, guests]) => ({
    group,
    guests: guests.filter(g => !assignedNames.has(g.name)),
  })).filter(e => e.guests.length > 0);

  // Sort groups largest first
  remainingByGroup.sort((a, b) => b.guests.length - a.guests.length);

  for (const { group, guests } of remainingByGroup) {
    let remaining = guests.filter(g => !assignedNames.has(g.name));
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, input.table_size);
      // Check must-separate constraints
      const violators = mustSeparateSet
        ? chunk.filter((g, _i) =>
            chunk.some((other, _j) =>
              g.name !== other.name &&
              (mustSeparateSet.has(`${g.name}|${other.name}`) || mustSeparateSet.has(`${other.name}|${g.name}`))
            )
          )
        : [];
      if (violators.length > 0) {
        // Move a violator to the next table fill — simple heuristic
        const moved = violators[0];
        const filtered = chunk.filter(g => g.name !== moved.name);
        filtered.forEach(g => assignedNames.add(g.name));
        tables.push({
          table_number: tableNum++,
          table_label: `Table ${tableNum - 1}`,
          guests: filtered.map(g => g.name),
          dominant_group: group,
          reasoning: `${group.replace(/_/g, " ")} group — must-separate constraint moved one guest.`,
        });
        remaining = [moved, ...remaining.filter(g => !filtered.some(f => f.name === g.name))];
      } else {
        chunk.forEach(g => assignedNames.add(g.name));
        tables.push({
          table_number: tableNum++,
          table_label: `Table ${tableNum - 1}`,
          guests: chunk.map(g => g.name),
          dominant_group: group,
          reasoning: `${group.replace(/_/g, " ")} group — seated together for social comfort.`,
        });
        remaining = remaining.filter(g => !assignedNames.has(g.name));
      }
    }
  }

  // Any stragglers not yet assigned
  const unassigned = allGuests.filter(g => !assignedNames.has(g.name));
  if (unassigned.length > 0) {
    // Fill into last table if space, else new table
    const lastTable = tables[tables.length - 1];
    if (lastTable && lastTable.guests.length + unassigned.length <= input.table_size) {
      lastTable.guests.push(...unassigned.map(g => g.name));
      lastTable.reasoning += " (Additional guests from mixed groups added to balance table size.)";
    } else {
      tables.push({
        table_number: tableNum++,
        table_label: `Table ${tableNum - 1}`,
        guests: unassigned.map(g => g.name),
        dominant_group: "mixed",
        reasoning: "Mixed group — overflow guests from multiple groups.",
      });
    }
  }

  const seatingTips = [
    "Place elderly guests away from speakers and near exits for comfort.",
    "Consider dietary needs — guests with restrictions appreciate being near the buffet or having labelled plates.",
    "Keep children's tables close to parents but give them their own space.",
    "Mixed tables with a common connection (friends of both families) can spark the best conversations.",
    "Avoid seating divorced couples in direct sight lines, not just different tables.",
  ];

  const result = {
    total_guests: totalGuests,
    table_count: tables.length,
    table_size: input.table_size,
    seating_assignments: tables,
    must_separate_honoured: input.must_separate?.length ? `${input.must_separate.length} must-separate constraints applied` : "No must-separate constraints",
    seating_tips: seatingTips,
    day_of_tip: seededPick(key, "tip", [
      "Print place cards in alphabetical order at the sign-in table — dramatically reduces confusion.",
      "Display a seating chart poster at the venue entrance with table assignments visible.",
      "Have a small buffer of empty seats at one table for last-minute show-ups.",
    ]),
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

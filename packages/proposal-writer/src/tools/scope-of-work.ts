import { z } from "zod";
import { pick, pickN, rangeInt, DELIVERABLE_TEMPLATES, FOOTER } from "../heuristics.js";

export const scopeOfWorkSchema = {
  project_name: z.string().describe("Project name"),
  client: z.string().describe("Client company name"),
  vendor: z.string().describe("Vendor / agency name"),
  service_description: z.string().describe("Brief description of the service to be delivered"),
  deliverables: z.string().describe("List of deliverables (comma-separated)"),
  start_date: z.string().describe("Projected start date"),
  end_date: z.string().describe("Projected end date"),
  out_of_scope: z.string().optional().describe("Items explicitly out of scope (comma-separated)"),
  assumptions: z.string().optional().describe("Key assumptions the engagement is based on (comma-separated)"),
};

export function scopeOfWork(params: {
  project_name: string;
  client: string;
  vendor: string;
  service_description: string;
  deliverables: string;
  start_date: string;
  end_date: string;
  out_of_scope?: string;
  assumptions?: string;
}): string {
  const { project_name, client, vendor, service_description, deliverables, start_date, end_date, out_of_scope, assumptions } = params;
  const seed = `sow:${project_name}:${client}`;

  const deliverableList = deliverables.split(",").map((d) => d.trim()).filter(Boolean);
  const oosList = (out_of_scope ?? "").split(",").map((d) => d.trim()).filter(Boolean);
  const assumptionList = (assumptions ?? "").split(",").map((a) => a.trim()).filter(Boolean);

  const defaultAssumptions = [
    `${client} will designate a single point of contact (SPOC) for approvals`,
    `Feedback on deliverables will be provided within ${rangeInt(3, 7, seed, 0)} business days`,
    "All third-party licenses or access credentials will be provided by client",
    `Content, brand assets, and existing materials will be supplied within ${rangeInt(3, 10, seed, 1)} days of kickoff`,
    "Project scope does not include migration of legacy data unless explicitly noted",
  ];
  const allAssumptions = assumptionList.length > 0 ? assumptionList : defaultAssumptions;

  const defaultOos = [
    "Ongoing maintenance beyond the project end date (unless a retainer is signed)",
    "Third-party tool licenses or subscriptions",
    "Work requiring access not explicitly granted by client",
    `Services beyond the ${deliverableList.length} deliverables listed above`,
  ];
  const allOos = oosList.length > 0 ? oosList : defaultOos;

  const milestones = deliverableList.map((d, i) => {
    const weekOffset = Math.round(((i + 1) / deliverableList.length) * rangeInt(4, 16, seed, i + 10));
    return { deliverable: d, week: weekOffset };
  });

  const reviewRounds = rangeInt(2, 3, seed, 20);
  const revisionNote = `Each deliverable includes up to ${reviewRounds} rounds of revisions. Additional revisions billed at $${rangeInt(100, 300, seed, 21)}/hour.`;

  let out = `# Statement of Work (SOW)\n\n`;
  out += `## ${project_name}\n\n`;
  out += `| | |\n|---|---|\n`;
  out += `| **Client** | ${client} |\n`;
  out += `| **Vendor** | ${vendor} |\n`;
  out += `| **Start date** | ${start_date} |\n`;
  out += `| **End date** | ${end_date} |\n`;
  out += `| **Document version** | v1.0 |\n\n`;

  out += `## 1. Project Overview\n\n`;
  out += `${service_description}\n\n`;

  out += `## 2. Deliverables\n\n`;
  out += `| # | Deliverable | Target Week |\n|---|------------|-------------|\n`;
  milestones.forEach((m, i) => {
    out += `| ${i + 1} | ${m.deliverable} | Week ${m.week} |\n`;
  });
  out += `\n${revisionNote}\n\n`;

  out += `## 3. Out of Scope\n\n`;
  out += `The following are explicitly **not** included in this engagement:\n\n`;
  allOos.forEach((o) => { out += `- ${o}\n`; });
  out += `\n`;

  out += `## 4. Assumptions\n\n`;
  out += `This SOW assumes:\n\n`;
  allAssumptions.forEach((a) => { out += `- ${a}\n`; });
  out += `\n`;

  out += `## 5. Change Order Process\n\n`;
  out += `Any work outside this SOW requires a signed Change Order (CO). ${vendor} will provide a CO with impact to timeline and cost within ${rangeInt(2, 5, seed, 30)} business days of the request.\n\n`;

  out += `## 6. Acceptance Criteria\n\n`;
  out += `Deliverables are considered accepted when ${client} provides written approval or fails to respond within ${rangeInt(5, 10, seed, 31)} business days of delivery.\n\n`;

  out += `## 7. Signatures\n\n`;
  out += `| | Client (${client}) | Vendor (${vendor}) |\n`;
  out += `|---|---|---|\n`;
  out += `| **Name** | __________________ | __________________ |\n`;
  out += `| **Title** | __________________ | __________________ |\n`;
  out += `| **Date** | __________________ | __________________ |\n`;
  out += FOOTER;
  return out;
}

import { z } from "zod";
import {
  hash, pick, rangeInt,
  FOOTER,
} from "../heuristics.js";

export const ceaseDesistDraftSchema = {
  sender_name: z.string().describe("Name of the party sending the cease and desist letter"),
  recipient_name: z.string().describe("Name of the party receiving the cease and desist letter"),
  violation_type: z.enum([
    "copyright",
    "trademark",
    "defamation",
    "harassment",
    "breach_of_contract",
    "trade_secret",
  ]).describe("Type of violation being addressed"),
  description: z.string().describe("Description of the specific conduct or violation"),
  demand: z.string().describe("What action(s) you are demanding the recipient take"),
};

const LEGAL_BASIS: Record<string, { statutes: string[]; summary: string }> = {
  copyright: {
    statutes: [
      "17 U.S.C. § 106 (exclusive rights of copyright owners)",
      "17 U.S.C. § 501 (infringement of copyright)",
      "17 U.S.C. § 504 (statutory damages: up to $150,000 per willful infringement)",
      "17 U.S.C. § 505 (attorney's fees and costs)",
    ],
    summary: "Federal copyright law grants the copyright owner exclusive rights to reproduce, distribute, display, and create derivative works from the protected work. Unauthorized use constitutes infringement entitling the copyright owner to actual damages, statutory damages, injunctive relief, and attorney's fees.",
  },
  trademark: {
    statutes: [
      "15 U.S.C. § 1114 (infringement of registered marks)",
      "15 U.S.C. § 1125(a) (false designation of origin / trade dress)",
      "15 U.S.C. § 1117 (recovery of profits, damages, and costs)",
      "15 U.S.C. § 1116 (injunctive relief)",
    ],
    summary: "Federal trademark law prohibits the unauthorized use of a mark in commerce in a way that is likely to cause confusion, mistake, or deception as to the source, affiliation, or sponsorship of goods or services. Remedies include injunctive relief, disgorgement of profits, and attorney's fees in exceptional cases.",
  },
  defamation: {
    statutes: [
      "Common law defamation (state law varies)",
      "Restatement (Second) of Torts §§ 558–623",
      "Applicable state defamation and libel statutes",
    ],
    summary: "Defamation consists of a false statement of fact published to a third party that causes harm to the subject's reputation. Written defamation (libel) may support claims for presumed damages without proof of actual harm in many jurisdictions.",
  },
  harassment: {
    statutes: [
      "Applicable state harassment and stalking statutes",
      "18 U.S.C. § 2261A (interstate stalking/harassment, where applicable)",
      "Federal and state civil rights statutes (if workplace harassment)",
      "Common law intentional infliction of emotional distress",
    ],
    summary: "Harassment involves a pattern of unwanted conduct that a reasonable person would find hostile, intimidating, or abusive. Continued harassment may subject the respondent to civil liability and, in certain circumstances, criminal prosecution.",
  },
  breach_of_contract: {
    statutes: [
      "Common law breach of contract (state law governs)",
      "Restatement (Second) of Contracts §§ 235–272",
      "Applicable UCC provisions (for goods contracts)",
      "Specific performance and injunctive relief under equity",
    ],
    summary: "A material breach of contract occurs when a party fails to perform a significant contractual obligation, entitling the non-breaching party to pursue remedies including damages, specific performance, and rescission. The non-breaching party is entitled to be made whole for all foreseeable losses caused by the breach.",
  },
  trade_secret: {
    statutes: [
      "18 U.S.C. §§ 1836–1839 (Defend Trade Secrets Act of 2016)",
      "18 U.S.C. § 1832 (Economic Espionage Act — criminal penalties)",
      "Applicable state Uniform Trade Secrets Act (UTSA) provisions",
      "18 U.S.C. § 1836(b)(3)(A) (injunctive relief and exemplary damages)",
    ],
    summary: "Trade secret misappropriation occurs when confidential business information is acquired, disclosed, or used without authorization. Under the Defend Trade Secrets Act, a trade secret owner may seek injunctive relief, compensatory damages, exemplary damages (up to 2x) for willful misappropriation, and attorney's fees.",
  },
};

const DEMAND_DEADLINES = [7, 10, 14, 21, 30];

export function ceaseDesistDraft(params: {
  sender_name: string;
  recipient_name: string;
  violation_type: string;
  description: string;
  demand: string;
}): string {
  const { sender_name, recipient_name, violation_type, description, demand } = params;
  const seed = `c&d:${sender_name}:${recipient_name}:${violation_type}`;

  const legalInfo = LEGAL_BASIS[violation_type as keyof typeof LEGAL_BASIS];
  const deadlineDays = pick(DEMAND_DEADLINES, seed, 0);
  const refNumber = `LD-${hash(seed).toString(16).toUpperCase().slice(0, 8)}`;

  const violationLabel: Record<string, string> = {
    copyright: "Copyright Infringement",
    trademark: "Trademark Infringement",
    defamation: "Defamation / Libel",
    harassment: "Harassment",
    breach_of_contract: "Breach of Contract",
    trade_secret: "Trade Secret Misappropriation",
  };

  const remediesMap: Record<string, string[]> = {
    copyright: [
      "actual damages and any profits attributable to the infringement",
      "statutory damages of up to $150,000 per willful act of infringement",
      "injunctive relief preventing further unauthorized use",
      "recovery of attorney's fees and litigation costs",
    ],
    trademark: [
      "injunctive relief and disgorgement of profits derived from infringing use",
      "actual damages, including lost sales and damage to brand reputation",
      "treble damages for willful infringement",
      "attorney's fees in exceptional cases",
    ],
    defamation: [
      "compensatory damages for reputational harm and emotional distress",
      "punitive damages for malicious or reckless disregard for the truth",
      "injunctive relief requiring removal or retraction of defamatory statements",
      "attorney's fees and costs of litigation",
    ],
    harassment: [
      "injunctive relief (restraining order) prohibiting further contact",
      "compensatory damages for emotional distress and related harm",
      "punitive damages for intentional, willful conduct",
      "civil and, where applicable, criminal sanctions",
    ],
    breach_of_contract: [
      "direct damages, including lost profits and costs of cover",
      "consequential damages reasonably foreseeable at the time of contracting",
      "specific performance compelling fulfillment of contractual obligations",
      "attorney's fees as provided by the contract or applicable statute",
    ],
    trade_secret: [
      "injunctive relief preventing further use or disclosure of trade secrets",
      "compensatory damages for all losses caused by the misappropriation",
      "exemplary damages of up to two times compensatory damages for willful misappropriation",
      "attorney's fees and costs under the Defend Trade Secrets Act",
    ],
  };

  const remedies = remediesMap[violation_type] || remediesMap["breach_of_contract"];

  let out = `## Cease & Desist Letter Draft\n\n`;
  out += `> **Template Reference:** ${refNumber} | **Violation Type:** ${violationLabel[violation_type] || violation_type}\n`;
  out += `> **⚠️ This is a template for informational purposes. Have a licensed attorney review before sending.**\n\n`;
  out += `---\n\n`;

  // Letter body
  out += `**[DATE]**\n\n`;
  out += `**VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED**\n`;
  out += `**AND ELECTRONIC MAIL**\n\n`;
  out += `${recipient_name}\n`;
  out += `[Address Line 1]\n`;
  out += `[City, State, ZIP]\n`;
  out += `[Email Address]\n\n`;
  out += `**Re: Cease and Desist — ${violationLabel[violation_type] || violation_type}**\n\n`;

  out += `Dear ${recipient_name},\n\n`;

  // Opening paragraph
  out += `This letter is sent on behalf of **${sender_name}** ("Client") to formally notify you that your actions constitute ${violationLabel[violation_type] || "a legal violation"} and to demand that you immediately cease and desist from all such conduct.\n\n`;

  // Statement of facts
  out += `**STATEMENT OF FACTS**\n\n`;
  out += `Our client has become aware of the following conduct by you:\n\n`;
  out += `${description}\n\n`;
  out += `This conduct is ongoing and has caused, and continues to cause, material harm to ${sender_name}'s interests, reputation, and legal rights.\n\n`;

  // Legal basis
  out += `**LEGAL BASIS**\n\n`;
  out += `${legalInfo.summary}\n\n`;
  out += `Your conduct violates the following laws:\n\n`;
  legalInfo.statutes.forEach((statute) => {
    out += `- ${statute}\n`;
  });

  // Demands
  out += `\n**DEMANDS**\n\n`;
  out += `${sender_name} hereby demands that you:\n\n`;
  out += `1. **Immediately cease and desist** from all conduct described above;\n`;
  out += `2. ${demand};\n`;
  out += `3. **Confirm in writing** within **${deadlineDays} days** of the date of this letter that you have fully complied with these demands;\n`;
  out += `4. **Preserve all documents, records, and communications** related to this matter (litigation hold);\n`;
  out += `5. **Refrain from destroying** any evidence related to the above-described conduct.\n\n`;

  // Remedies available
  out += `**REMEDIES IF YOU FAIL TO COMPLY**\n\n`;
  out += `If you fail to comply with the demands set forth in this letter within ${deadlineDays} days, ${sender_name} reserves all rights and remedies available under applicable law, including without limitation:\n\n`;
  remedies.forEach((remedy) => {
    out += `- ${remedy};\n`;
  });
  out += `- Any other relief deemed appropriate by a court of competent jurisdiction.\n\n`;

  // Closing
  out += `**RESPONSE DEADLINE**\n\n`;
  out += `You must respond in writing to this letter **no later than ${deadlineDays} days from the date of this letter**. Failure to respond or comply will result in ${sender_name} pursuing all available legal remedies without further notice.\n\n`;
  out += `This letter is written without prejudice to ${sender_name}'s rights and remedies, all of which are expressly reserved.\n\n`;
  out += `Sincerely,\n\n`;
  out += `________________________________\n`;
  out += `[Attorney Name], Esq.\n`;
  out += `[Law Firm Name]\n`;
  out += `[Address]\n`;
  out += `[Phone] | [Email]\n`;
  out += `Counsel for ${sender_name}\n\n`;

  out += `---\n\n`;
  out += `### Drafting Notes\n\n`;
  out += `Before sending this letter, ensure the following:\n\n`;
  out += `- [ ] Have a licensed attorney in the relevant jurisdiction review and sign the letter\n`;
  out += `- [ ] Attach evidence of the violation (screenshots, documents, recordings as appropriate)\n`;
  out += `- [ ] Verify the correct legal name and address of the recipient\n`;
  out += `- [ ] Confirm your own rights (e.g., copyright registration, trademark registration, contract copy)\n`;
  out += `- [ ] Send via certified mail (return receipt) and email to create a paper trail\n`;
  out += `- [ ] Keep copies of all sent correspondence\n`;
  out += `- [ ] Do not contact the recipient directly if they have legal counsel\n\n`;

  out += `### Applicable Statutes Summary\n\n`;
  out += `| Statute | Purpose |\n`;
  out += `|---------|--------|\n`;
  legalInfo.statutes.forEach((s) => {
    const parts = s.split(" (");
    out += `| \`${parts[0]}\` | ${parts[1] ? parts[1].replace(")", "") : "See statute"} |\n`;
  });

  out += FOOTER;
  return out;
}

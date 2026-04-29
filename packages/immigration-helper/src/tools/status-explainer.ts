import { z } from "zod";
import { seededPick, normKey } from "../heuristics.js";
import { PROMO_FOOTER } from "../footer.js";

export const StatusExplainerInput = z.object({
  immigration_status: z.string().describe("Current immigration status or case type, e.g. 'H-1B', 'F-1 OPT', 'LPR', 'DACA', 'TPS', 'Pending I-485', 'K-1'"),
});

type StatusProfile = {
  full_name: string;
  status_type: "nonimmigrant" | "immigrant" | "protected" | "pending";
  work_authorized: boolean;
  work_authorization_notes: string;
  travel_allowed: boolean;
  travel_notes: string;
  public_benefits_eligibility: string;
  rights_and_protections: string[];
  restrictions: string[];
  path_to_next_status: string[];
  renewal_deadline_notes: string;
  critical_warnings: string[];
};

const STATUS_PROFILES: Record<string, StatusProfile> = {
  "h-1b": {
    full_name: "H-1B — Specialty Occupation Nonimmigrant",
    status_type: "nonimmigrant",
    work_authorized: true,
    work_authorization_notes: "Authorized only for the sponsoring employer and the specific role described in the LCA and I-129. Working for any other employer or in a different role without an amended petition is a violation.",
    travel_allowed: true,
    travel_notes: "May travel internationally. Need a valid H-1B visa stamp (not just the I-797 approval) to re-enter — check visa expiry before traveling. Apply for a new stamp at a US consulate abroad if the current stamp expired.",
    public_benefits_eligibility: "Generally not eligible for federal public benefits. May be eligible for emergency medical Medicaid. State benefits vary.",
    rights_and_protections: [
      "Right to work for the sponsoring employer in the approved role",
      "Right to petition for LCA-required wage",
      "Portability under AC21: can change employers after I-140 is approved for 180+ days",
      "Right to bring H-4 dependents (spouse and unmarried children under 21)",
      "H-4 EAD available for spouses if principal H-1B holder has an approved I-140",
    ],
    restrictions: [
      "Cannot work for any employer other than the H-1B petitioner without an amendment or transfer",
      "Cannot self-employ or be a sole proprietor under H-1B",
      "Duration tied to employer — if laid off, typically 60-day grace period to find new employer or change status",
      "Cannot exceed maximum H-1B period (6 years, with extensions beyond 6 years if I-140 approved)",
    ],
    path_to_next_status: [
      "Employment-based green card (EB-1, EB-2, EB-3) — employer files PERM + I-140",
      "EB-1A or EB-2 NIW self-petition if qualifications allow",
      "H-1B extensions beyond 6 years under INA 106(a) if I-140 pending or approved 365+ days",
      "H-4 dependents may file I-485 concurrently if principal's priority date is current",
    ],
    renewal_deadline_notes: "H-1B can be renewed in 3-year increments up to 6 years total. Beyond 6 years, require an approved I-140 or a pending labour certification filed before the 6-year limit.",
    critical_warnings: [
      "Working for a different employer without a properly filed H-1B transfer is an immediate status violation",
      "Job loss starts a 60-day grace period — act immediately to file a transfer, change of status, or depart",
      "Cap-gap protection applies for F-1 to H-1B transitions — confirm you fall under cap-gap before OPT expires",
    ],
  },
  "f-1": {
    full_name: "F-1 — Academic Student Nonimmigrant",
    status_type: "nonimmigrant",
    work_authorized: false,
    work_authorization_notes: "On-campus employment: up to 20 hours/week during school, full-time during breaks. Off-campus employment requires CPT or OPT authorization. Working without authorization is a serious violation.",
    travel_allowed: true,
    travel_notes: "May travel internationally with a valid F-1 visa stamp, a current I-20 endorsed by your DSO, and proof of enrollment. If your F-1 visa stamp is expired, you must get a new stamp at a US consulate before re-entering (the I-20 does not substitute for the visa).",
    public_benefits_eligibility: "Not eligible for most federal public benefits during the standard 5-year exempt period for F-1.",
    rights_and_protections: [
      "Right to study at any SEVP-certified institution",
      "Right to on-campus employment up to 20 hours/week",
      "Entitled to CPT for curricular practical training",
      "OPT (12 months post-completion): work in a field related to your degree",
      "STEM OPT extension: additional 24 months for STEM degree holders",
    ],
    restrictions: [
      "Must maintain full-time enrollment (minimum credit hours defined by school)",
      "Must not work off-campus without authorization",
      "Grace period: 60 days after program completion (or end of OPT) to depart, change status, or transfer",
      "Can only change schools while maintaining status — must notify DSO",
    ],
    path_to_next_status: [
      "OPT → H-1B cap filing (April 1 each year for October 1 start)",
      "Cap-gap protection: if H-1B is filed before OPT expires, student can remain and work until October 1",
      "Graduate school → continue F-1 status",
      "Change of status to H-1B, O-1, or other nonimmigrant if qualified",
      "Marriage to a US citizen → K-3 or CR-1 immigrant visa",
    ],
    renewal_deadline_notes: "F-1 is Duration of Status (D/S) — no specific end date, but you must maintain status by staying enrolled and following all rules. Your I-20 must be current and renewed by your DSO.",
    critical_warnings: [
      "Any unauthorised employment — even freelance work — is an immediate status violation",
      "Missing your OPT application deadline can cost you months of work authorisation",
      "Transferring schools without proper DSO notification can trigger status termination",
    ],
  },
  "lpr": {
    full_name: "Lawful Permanent Resident (Green Card Holder)",
    status_type: "immigrant",
    work_authorized: true,
    work_authorization_notes: "Authorized to work for any employer in any role. No employer sponsorship required. Green card itself is proof of work authorization.",
    travel_allowed: true,
    travel_notes: "May travel internationally. Absences of 6+ months can raise questions about maintaining LPR status. Absences of 1+ year generally trigger a presumption of abandonment — carry a re-entry permit for extended trips. Obtain a re-entry permit (I-131) before departing for 1+ year.",
    public_benefits_eligibility: "Most federal public benefits available after 5 years as LPR. SNAP, Medicaid, SSI eligibility rules are complex — check current rules at benefits.gov.",
    rights_and_protections: [
      "Right to live and work permanently in the US in any occupation",
      "Right to petition for family members (spouse and unmarried children)",
      "Protection under all US federal and state labour laws",
      "Access to US courts",
      "Right to apply for US citizenship after 3 years (LPR married to US citizen) or 5 years",
      "Right to obtain a US social security number",
    ],
    restrictions: [
      "Cannot vote in federal elections (US citizens only)",
      "Cannot run for president or serve in most federal elected positions",
      "Cannot serve on federal jury",
      "Certain criminal convictions can lead to removal (deportation)",
      "Extended absences abroad can result in loss of LPR status",
      "Must carry green card or other proof of LPR status at all times",
    ],
    path_to_next_status: [
      "US citizenship via naturalisation — N-400 after 5 years (or 3 years if married to US citizen)",
      "Remove conditions on green card (if conditional) — I-751 within 90-day window before conditional green card expires",
      "Sponsor family members for green cards (I-130)",
    ],
    renewal_deadline_notes: "Green card valid for 10 years (permanent residents) or 2 years (conditional residents). File I-90 to renew within 6 months of expiration. File I-751 to remove conditions within 90-day window before 2-year conditional card expires.",
    critical_warnings: [
      "Conditional green card holders who miss the I-751 deadline risk status termination — file on time",
      "Criminal convictions — even misdemeanours — can trigger removal proceedings; consult an attorney before pleading to any criminal charge",
      "Tax non-compliance is a red flag for naturalisation — file US taxes every year",
    ],
  },
  "daca": {
    full_name: "DACA — Deferred Action for Childhood Arrivals",
    status_type: "protected",
    work_authorized: true,
    work_authorization_notes: "Work authorized via Employment Authorization Document (EAD). Work authorization is tied to the DACA grant — renew well in advance of expiration.",
    travel_allowed: false,
    travel_notes: "International travel is generally NOT allowed without advance parole (Form I-131). Departing without advance parole can result in bars to re-entry. DACA advance parole is rare and discretionary — consult an attorney before any travel.",
    public_benefits_eligibility: "Not eligible for federal public benefits (SNAP, SSI, federal financial aid). Some states offer in-state tuition and state-specific benefits.",
    rights_and_protections: [
      "Protection from deportation for the period of deferred action (2-year increments)",
      "Right to work with a valid EAD",
      "Access to driver's licences in most states",
      "Some states provide access to professional licences, in-state tuition, and financial aid",
    ],
    restrictions: [
      "Cannot vote or sponsor family members for immigration benefits",
      "Not a pathway to citizenship or a green card by itself",
      "Must renew every 2 years — no automatic extensions",
      "Any significant criminal history can result in termination of DACA",
      "Travel abroad without advance parole triggers bars to re-entry",
    ],
    path_to_next_status: [
      "Marriage to a US citizen → consult attorney about unlawful presence bars and potential waiver (I-601A)",
      "Employer sponsorship for H-1B or green card if eligible",
      "Congressional legislative relief — no current statutory pathway to LPR for DACA recipients",
    ],
    renewal_deadline_notes: "Renew 5–6 months before your current DACA expires — processing times have been unpredictable. Do not let your EAD expire; a gap in EAD can affect employment and driver's licence.",
    critical_warnings: [
      "DACA is subject to ongoing litigation — monitor news and USCIS updates closely",
      "A new criminal conviction can result in DACA termination and removal proceedings",
      "Do NOT leave the US without approved advance parole",
    ],
  },
  "tps": {
    full_name: "TPS — Temporary Protected Status",
    status_type: "protected",
    work_authorized: true,
    work_authorization_notes: "Work authorized via EAD for the duration of the TPS designation. Renew with each re-registration cycle.",
    travel_allowed: false,
    travel_notes: "International travel generally not allowed without advance parole. Consult an attorney before any travel — departing without advance parole has serious consequences.",
    public_benefits_eligibility: "Generally not eligible for federal public benefits. Some state-level programs may be available.",
    rights_and_protections: [
      "Protection from deportation while TPS designation is in effect",
      "Right to work with a valid EAD",
      "Driver's licence eligibility in most states",
    ],
    restrictions: [
      "Must re-register during every re-registration period — missing re-registration can result in loss of TPS",
      "Cannot vote or petition for family members",
      "TPS can be terminated if the country designation ends",
    ],
    path_to_next_status: [
      "Marriage to a US citizen — consult attorney regarding bars and waivers",
      "Employer sponsorship if eligible",
      "Explore whether any other immigration relief applies",
    ],
    renewal_deadline_notes: "Register or re-register during each designated period. USCIS publishes re-registration windows — do not miss them.",
    critical_warnings: [
      "Check uscis.gov regularly for TPS re-registration deadlines for your country",
      "Criminal convictions can disqualify you from TPS",
    ],
  },
  "pending-i485": {
    full_name: "Pending Adjustment of Status (I-485 pending)",
    status_type: "pending",
    work_authorized: true,
    work_authorization_notes: "Authorized to work via Employment Authorization Document (EAD, Form I-765). File I-765 concurrently with I-485. EAD is typically granted within 3–6 months.",
    travel_allowed: false,
    travel_notes: "Do NOT travel internationally without an approved Advance Parole (Form I-131). Departing the US without Advance Parole while an I-485 is pending is considered abandonment of the application. File I-131 concurrently with I-485.",
    public_benefits_eligibility: "Depends on underlying status during pendency. Consult an attorney.",
    rights_and_protections: [
      "May work with approved EAD",
      "Protected from deportation in most circumstances while I-485 is pending",
      "AC21 portability: can change jobs to same or similar occupation after I-485 pending 180+ days with approved I-140",
    ],
    restrictions: [
      "No international travel without Advance Parole",
      "Must maintain underlying lawful status or have a valid parole to continue I-485",
      "Cannot vote",
    ],
    path_to_next_status: [
      "Green card approval (I-485 approval)",
      "If conditional: file I-751 within 90 days before 2-year card expires",
      "After 3–5 years as LPR: naturalisation (N-400)",
    ],
    renewal_deadline_notes: "EAD must be renewed if I-485 remains pending beyond EAD validity. File I-765 renewal 180 days before expiration.",
    critical_warnings: [
      "Departing the US without Advance Parole abandons the I-485 — this is irreversible",
      "Any criminal charge during pendency must be disclosed and could affect the application",
      "Monitor your case status at egov.uscis.gov — respond to any RFE immediately",
    ],
  },
  "k-1": {
    full_name: "K-1 — Fiancé(e) Visa",
    status_type: "nonimmigrant",
    work_authorized: false,
    work_authorization_notes: "Not automatically work authorized. Must marry the US citizen petitioner and file I-485 + I-765 to obtain work authorization.",
    travel_allowed: false,
    travel_notes: "Once admitted on K-1, you must NOT depart and re-enter as K-1 again — it is single-entry. If you leave after the K-1 entry, you may not be able to return without a new visa. Plan accordingly.",
    public_benefits_eligibility: "Not eligible for federal public benefits.",
    rights_and_protections: [
      "Right to be present in the US for 90 days to marry the petitioner",
      "Right to file I-485 for adjustment of status after marriage",
    ],
    restrictions: [
      "Must marry the K-1 petitioner (the specific US citizen who filed the I-129F) within 90 days",
      "Cannot marry a different US citizen after entry on K-1",
      "Cannot work without EAD (obtained through I-485 filing)",
      "Single-entry visa — do not leave the US",
    ],
    path_to_next_status: [
      "Marry the petitioner within 90 days",
      "File I-485 for adjustment of status promptly after marriage",
      "Concurrently file I-765 (EAD) and I-131 (Advance Parole)",
    ],
    renewal_deadline_notes: "90-day clock begins on the day of K-1 entry. Marriage must occur before this window closes.",
    critical_warnings: [
      "Do not leave the US on a K-1 — it is a single-entry visa and departure likely constitutes abandonment",
      "You MUST marry the specific US citizen petitioner who filed the I-129F",
      "If the 90-day window expires without marriage, you are out of status and must depart",
    ],
  },
  "o-1": {
    full_name: "O-1 — Extraordinary Ability Nonimmigrant",
    status_type: "nonimmigrant",
    work_authorized: true,
    work_authorization_notes: "Work authorized for the sponsoring employer or agent for the scope of the petition. O-1 is flexible — can use an agent to work for multiple clients.",
    travel_allowed: true,
    travel_notes: "May travel internationally with valid O-1 visa stamp. Agent-based O-1 holders can travel more freely between clients.",
    public_benefits_eligibility: "Generally not eligible for federal public benefits.",
    rights_and_protections: [
      "Right to work in the approved field of extraordinary ability",
      "Can use an agent to work with multiple clients in the performing arts",
      "Dependents (O-3) may accompany but cannot work",
      "No annual cap — can be filed year-round",
      "Annual extensions possible in 1-year increments",
    ],
    restrictions: [
      "Work must be in the field of extraordinary ability as described in the petition",
      "Working outside the approved scope requires an amendment",
      "No self-employment without an agent arrangement",
    ],
    path_to_next_status: [
      "EB-1A (extraordinary ability green card) — natural progression from O-1",
      "EB-2 NIW if national interest waiver criteria met",
      "Employer-sponsored EB-1B or EB-2/EB-3 if employer is willing",
    ],
    renewal_deadline_notes: "O-1 is granted for the duration of the event/activity (up to 3 years initially, extendable in 1-year increments). File extension before current period expires.",
    critical_warnings: [
      "O-1 approval does not guarantee EB-1A approval — standards differ somewhat",
      "Extensions require continued demonstration of extraordinary ability",
    ],
  },
};

export function statusExplainer(input: z.infer<typeof StatusExplainerInput>): string {
  const key = normKey(input.immigration_status);
  const statusLower = input.immigration_status.toLowerCase().trim();

  let profile: StatusProfile | undefined;
  const keyMap: Record<string, string> = {
    "h-1b": "h-1b", "h1b": "h-1b",
    "f-1": "f-1", "f1": "f-1", "f-1 opt": "f-1", "f1 opt": "f-1", "opt": "f-1",
    "lpr": "lpr", "green card": "lpr", "permanent resident": "lpr", "lawful permanent resident": "lpr",
    "daca": "daca",
    "tps": "tps", "temporary protected status": "tps",
    "pending i-485": "pending-i485", "i-485 pending": "pending-i485", "adjustment pending": "pending-i485",
    "k-1": "k-1", "k1": "k-1", "fiancé": "k-1", "fiance": "k-1",
    "o-1": "o-1", "o1": "o-1",
  };

  for (const [k, v] of Object.entries(keyMap)) {
    if (statusLower.includes(k)) {
      profile = STATUS_PROFILES[v];
      break;
    }
  }

  if (!profile) {
    return JSON.stringify({
      message: `No detailed profile found for "${input.immigration_status}". Please try common status terms like: H-1B, F-1, F-1 OPT, LPR, Green Card, DACA, TPS, Pending I-485, K-1, O-1.`,
      general_resources: [
        "USCIS: uscis.gov",
        "Find a licensed immigration attorney: ailalawyer.com",
      ],
      disclaimer: "This tool is for general information only and is not legal advice.",
      generated_at: new Date().toISOString(),
    }, null, 2) + PROMO_FOOTER;
  }

  const result = {
    immigration_status: input.immigration_status,
    full_status_name: profile.full_name,
    status_type: profile.status_type,
    work_authorized: profile.work_authorized,
    work_authorization_details: profile.work_authorization_notes,
    international_travel_allowed: profile.travel_allowed,
    travel_details: profile.travel_notes,
    public_benefits_eligibility: profile.public_benefits_eligibility,
    rights_and_protections: profile.rights_and_protections,
    key_restrictions: profile.restrictions,
    path_to_next_status: profile.path_to_next_status,
    renewal_and_deadline_notes: profile.renewal_deadline_notes,
    critical_warnings: profile.critical_warnings,
    emergency_action_if_status_threatened: [
      "Contact an AILA-member immigration attorney immediately",
      "Do NOT depart the US without consulting an attorney",
      "Document all communications with USCIS and employers",
    ],
    key_resources: [
      "USCIS Case Status: egov.uscis.gov",
      "I-94 Travel History: i94.cbp.dhs.gov",
      "USCIS Processing Times: uscis.gov/processing-times",
      "Find a licensed attorney: ailalawyer.com",
    ],
    disclaimer:
      "This tool provides general educational information only. Immigration law is complex and highly fact-specific. Always consult a licensed immigration attorney before taking any action.",
    generated_at: new Date().toISOString(),
  };

  return JSON.stringify(result, null, 2) + PROMO_FOOTER;
}

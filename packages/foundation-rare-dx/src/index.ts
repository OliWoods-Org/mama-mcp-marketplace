#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CTA = `\n---\nOpen source by OliWoods Foundation`;

const server = new McpServer({
  name: "foundation-rare-dx",
  version: "1.0.0",
});

// ── symptom_match ─────────────────────────────────────────────────────────────
server.tool(
  "symptom_match",
  "Match a list of symptoms to rare disease candidates with prevalence data, diagnostic criteria hints, and next-step guidance",
  {
    symptoms: z.array(z.string()).min(1).describe("List of symptoms or clinical findings"),
    age_of_onset: z.number().min(0).optional().describe("Age when symptoms first appeared"),
    biological_sex: z.enum(["male", "female", "unknown"]).optional().default("unknown"),
    family_history: z.array(z.string()).optional().default([]).describe("Relevant family history conditions"),
    already_diagnosed: z.array(z.string()).optional().default([]).describe("Conditions already ruled out or diagnosed"),
    inheritance_pattern_suspected: z.enum(["autosomal_dominant", "autosomal_recessive", "x_linked", "mitochondrial", "unknown"]).optional().default("unknown"),
  },
  async ({ symptoms, age_of_onset, biological_sex, family_history, already_diagnosed, inheritance_pattern_suspected }) => {
    const symptomStr = symptoms.map((s) => s.toLowerCase());

    // Curated rare disease pattern library (illustrative — production uses Orphanet/OMIM APIs)
    const diseases = [
      {
        name: "Ehlers-Danlos Syndrome (hEDS)",
        prevalence: "1 in 3,500–5,000",
        keySymptoms: ["joint hypermobility", "skin laxity", "chronic pain", "fatigue", "dysautonomia", "pots"],
        inheritance: "autosomal_dominant",
        onset: "childhood to young adult",
        diagnosticTest: "Clinical diagnosis via Villefranche/2017 criteria; collagen gene panel",
        specialist: "Medical Geneticist, Rheumatologist",
      },
      {
        name: "Fabry Disease",
        prevalence: "1 in 40,000–60,000",
        keySymptoms: ["neuropathic pain", "angiokeratomas", "corneal opacity", "kidney disease", "stroke", "cardiomyopathy"],
        inheritance: "x_linked",
        onset: "childhood",
        diagnosticTest: "Alpha-galactosidase A enzyme activity; GLA gene sequencing",
        specialist: "Medical Geneticist, Nephrologist",
      },
      {
        name: "Wilson Disease",
        prevalence: "1 in 30,000",
        keySymptoms: ["liver disease", "neuropsychiatric symptoms", "kayser-fleischer rings", "tremor", "dysarthria"],
        inheritance: "autosomal_recessive",
        onset: "5–35 years",
        diagnosticTest: "Serum ceruloplasmin, 24-hr urine copper, ATP7B gene sequencing",
        specialist: "Hepatologist, Medical Geneticist",
      },
      {
        name: "Marfan Syndrome",
        prevalence: "1 in 5,000",
        keySymptoms: ["tall stature", "aortic dilation", "lens dislocation", "joint hypermobility", "scoliosis", "pectus excavatum"],
        inheritance: "autosomal_dominant",
        onset: "congenital/childhood",
        diagnosticTest: "Ghent criteria; FBN1 gene sequencing; echocardiogram",
        specialist: "Medical Geneticist, Cardiologist",
      },
      {
        name: "Gaucher Disease (Type 1)",
        prevalence: "1 in 40,000 (general); 1 in 450 Ashkenazi Jewish",
        keySymptoms: ["splenomegaly", "hepatomegaly", "bone pain", "fatigue", "anemia", "thrombocytopenia"],
        inheritance: "autosomal_recessive",
        onset: "any age",
        diagnosticTest: "Beta-glucocerebrosidase enzyme activity; GBA gene sequencing",
        specialist: "Medical Geneticist, Hematologist",
      },
    ];

    const scored = diseases.map((d) => {
      const matches = d.keySymptoms.filter((s) => symptomStr.some((sy) => sy.includes(s) || s.includes(sy)));
      const inheritanceMatch = inheritance_pattern_suspected === "unknown" || d.inheritance === inheritance_pattern_suspected;
      const score = matches.length * 10 + (inheritanceMatch ? 5 : 0);
      return { ...d, matches, score };
    }).filter((d) => d.score > 0).sort((a, b) => b.score - a.score);

    const topCandidates = scored.slice(0, 3);

    const ageNote = age_of_onset !== undefined ? `\n**Age of Onset:** ${age_of_onset} years` : "";
    const familyNote = family_history.length > 0 ? `\n**Family History:** ${family_history.join(", ")}` : "";
    const inheritanceNote = inheritance_pattern_suspected !== "unknown" ? `\n**Suspected Inheritance:** ${inheritance_pattern_suspected.replace(/_/g, " ")}` : "";
    const excludedNote = already_diagnosed.length > 0 ? `\n**Already Excluded:** ${already_diagnosed.join(", ")}` : "";

    const candidateText = topCandidates.length > 0
      ? topCandidates.map((d, i) =>
          `### ${i + 1}. ${d.name}
- **Prevalence:** ${d.prevalence}
- **Matching Symptoms:** ${d.matches.join(", ") || "Pattern overlap"}
- **Typical Onset:** ${d.onset}
- **Inheritance:** ${d.inheritance.replace(/_/g, " ")}
- **Key Diagnostic Test:** ${d.diagnosticTest}
- **Suggested Specialist:** ${d.specialist}`
        ).join("\n\n")
      : "No strong pattern matches found in the reference library. Consider a broader undiagnosed disease program.";

    const result = `## Rare Disease Symptom Match

**Symptoms Analyzed:** ${symptoms.join(", ")}${ageNote}${familyNote}${inheritanceNote}${excludedNote}
**Biological Sex:** ${biological_sex}

## Top Candidates
${candidateText}

## Next Steps
1. **Bring this analysis to your primary care physician** — ask for a referral to a medical geneticist
2. **Contact an undiagnosed disease program** if prior workup has been inconclusive:
   - NIH Undiagnosed Diseases Program: undiagnosed.nih.gov
   - Undiagnosed Diseases Network (UDN): udninfo.org
3. **Consider whole exome or genome sequencing** — available through most medical genetics clinics
4. **Connect with a patient advocacy organization** (use find_specialist tool for disease-specific groups)

> This tool is for educational purposes and does not constitute medical advice. Only a qualified clinician can diagnose a rare disease.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── find_clinical_trials ─────────────────────────────────────────────────────
server.tool(
  "find_clinical_trials",
  "Find relevant clinical trials for a rare disease — summarizes trial phase, eligibility, location, and enrollment status guidance",
  {
    disease_name: z.string().describe("Disease or condition name (ICD or plain language)"),
    gene_or_variant: z.string().optional().describe("Specific gene or variant (e.g. GBA, BRCA2, c.1234A>G)"),
    patient_age: z.number().min(0).optional().describe("Patient age in years"),
    country: z.string().optional().default("US").describe("Country for trial location filter"),
    trial_phase: z.array(z.enum(["1", "2", "3", "4", "expanded_access"])).optional().describe("Filter by trial phase"),
    intervention_type: z.enum(["gene_therapy", "enzyme_replacement", "small_molecule", "any"]).optional().default("any"),
  },
  async ({ disease_name, gene_or_variant, patient_age, country, trial_phase, intervention_type }) => {
    const phaseFilter = trial_phase && trial_phase.length > 0 ? ` Phase ${trial_phase.join("/")}` : "";
    const geneNote = gene_or_variant ? ` with ${gene_or_variant} variant` : "";
    const ageNote = patient_age !== undefined ? ` (patient age ${patient_age})` : "";

    const searchTerms = [
      disease_name,
      gene_or_variant,
      intervention_type !== "any" ? intervention_type.replace(/_/g, " ") : null,
    ].filter(Boolean).join(" + ");

    const result = `## Clinical Trial Finder — ${disease_name}${geneNote}

**Search Criteria:** ${searchTerms}${ageNote}
**Location:** ${country}${phaseFilter}
**Intervention Focus:** ${intervention_type.replace(/_/g, " ")}

### How to Search ClinicalTrials.gov
Use these exact search steps for the most complete results:

1. Go to **clinicaltrials.gov**
2. In **Condition or disease**, enter: \`${disease_name}\`${gene_or_variant ? `\n3. In **Other terms**, enter: \`${gene_or_variant}\`` : ""}
4. Set **Country** to: \`${country}\`
${trial_phase ? `5. Under **Study Phase**, select: ${trial_phase.map((p) => `Phase ${p}`).join(", ")}` : ""}
6. Filter **Recruitment Status** to: "Recruiting" or "Not yet recruiting"

### Alternative Registries
| Registry | URL | Best For |
|---|---|---|
| EU Clinical Trials Register | clinicaltrialsregister.eu | European trials |
| WHO ICTRP | trialsearch.who.int | Global registry of registries |
| Rare Diseases Clinical Research Network | ncats.nih.gov/rdcrn | NIH-funded rare disease trials |
| NORD Trial Finder | rarediseases.org | Disease-specific advocacy links |

### Expanded Access (Compassionate Use)
If no trials are available, ask your physician about expanded access:
- Manufacturer compassionate use programs
- FDA expanded access: fda.gov/patients/clinical-trials-what-patients-need-know/expanded-access

### Working with Trial Coordinators
- Contact the study coordinator listed on the trial page — they can pre-screen eligibility by phone
- Ask about travel reimbursement; most interventional trials cover trial-related costs
- Check if your institution is a sub-site — many trials have multiple enrollment locations

> Always discuss trial participation with your treating physician and medical geneticist before enrolling.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── gene_lookup ───────────────────────────────────────────────────────────────
server.tool(
  "gene_lookup",
  "Look up a gene or genetic variant — returns associated conditions, inheritance patterns, testing options, and variant interpretation guidance",
  {
    gene_symbol: z.string().describe("HGNC gene symbol (e.g. CFTR, GBA, FBN1, BRCA2)"),
    variant_notation: z.string().optional().describe("HGVS variant notation (e.g. c.1521_1523del, p.Phe508del)"),
    purpose: z.enum(["diagnosis", "carrier_screening", "prenatal", "pharmacogenomics", "research"]).optional().default("diagnosis"),
  },
  async ({ gene_symbol, variant_notation, purpose }) => {
    // Representative gene data — production integrates ClinVar, OMIM, and gnomAD APIs
    const geneData: Record<string, { fullName: string; conditions: string[]; inheritance: string; prevalence: string; testing: string[]; databases: string[] }> = {
      CFTR: {
        fullName: "Cystic Fibrosis Transmembrane Conductance Regulator",
        conditions: ["Cystic Fibrosis", "CFTR-Related Disorder", "Congenital Absence of the Vas Deferens"],
        inheritance: "Autosomal recessive",
        prevalence: "CF: 1 in 3,500 (European ancestry)",
        testing: ["ACMG 23-mutation panel", "Full gene sequencing + deletion/duplication analysis", "Sweat chloride test (functional)"],
        databases: ["CFTR2 (cftr2.org)", "ClinVar", "gnomAD"],
      },
      GBA: {
        fullName: "Glucosylceramidase Beta",
        conditions: ["Gaucher Disease Types 1–3", "Parkinson Disease risk factor"],
        inheritance: "Autosomal recessive (Gaucher); risk allele for PD",
        prevalence: "Gaucher: 1 in 40,000; 1 in 450 Ashkenazi Jewish",
        testing: ["Enzyme activity assay (beta-glucocerebrosidase)", "GBA gene sequencing", "Targeted mutation panel for Ashkenazi Jewish ancestry"],
        databases: ["ClinVar", "Human Gene Mutation Database (HGMD)", "gnomAD"],
      },
      FBN1: {
        fullName: "Fibrillin-1",
        conditions: ["Marfan Syndrome", "Ectopia Lentis", "MASS Syndrome", "Weill-Marchesani Syndrome"],
        inheritance: "Autosomal dominant",
        prevalence: "Marfan: 1 in 5,000",
        testing: ["FBN1 full gene sequencing", "Deletion/duplication analysis", "Clinical Marfan panel"],
        databases: ["UMD-FBN1 database", "ClinVar", "gnomAD"],
      },
      BRCA2: {
        fullName: "BRCA DNA Repair Associated",
        conditions: ["Hereditary Breast and Ovarian Cancer", "Fanconi Anemia (biallelic)", "Pancreatic Cancer risk"],
        inheritance: "Autosomal dominant (cancer risk); autosomal recessive (Fanconi Anemia)",
        prevalence: "Pathogenic variant: 1 in 400–500 general population; 1 in 40 Ashkenazi Jewish",
        testing: ["BRCA1/2 sequencing + large rearrangements", "Hereditary cancer gene panels", "Tumor testing for somatic variants"],
        databases: ["ClinVar", "LOVD", "ENIGMA consortium", "gnomAD"],
      },
    };

    const key = gene_symbol.toUpperCase();
    const data = geneData[key];
    const variantNote = variant_notation
      ? `\n**Variant:** ${variant_notation}\n- Check ClinVar (ncbi.nlm.nih.gov/clinvar) with this notation for current pathogenicity classification\n- ACMG/AMP 5-tier classification: Pathogenic | Likely Pathogenic | VUS | Likely Benign | Benign`
      : "";

    const purposeGuidance: Record<string, string> = {
      diagnosis: "Order full gene sequencing + deletion/duplication analysis via a CLIA-certified laboratory. Results should be interpreted by a board-certified medical geneticist or genetic counselor.",
      carrier_screening: "Targeted panel or full gene sequencing depending on ancestry. Both partners should be screened before or during pregnancy. Results should be reviewed with a genetic counselor.",
      prenatal: "Discuss chorionic villus sampling (CVS) or amniocentesis with your OB/maternal-fetal medicine specialist. Preimplantation genetic testing (PGT) is available via IVF if planning.",
      pharmacogenomics: "Identify variants that affect drug metabolism or treatment response. Consult a clinical pharmacist or pharmacogenomics specialist.",
      research: "Check dbGaP (ncbi.nlm.nih.gov/gap) for research datasets. Patients can enroll in natural history studies or registries through relevant advocacy organizations.",
    };

    const result = data
      ? `## Gene Lookup — ${key}

**Full Name:** ${data.fullName}
**Associated Conditions:** ${data.conditions.join(", ")}
**Inheritance Pattern:** ${data.inheritance}
**Prevalence:** ${data.prevalence}
${variantNote}

### Testing Options
${data.testing.map((t) => `- ${t}`).join("\n")}

### Key Databases for This Gene
${data.databases.map((db) => `- ${db}`).join("\n")}

### Guidance for Purpose: ${purpose.replace(/_/g, " ")}
${purposeGuidance[purpose]}

### Next Steps
1. Request a referral to a **board-certified medical geneticist or genetic counselor** (use find_specialist)
2. Confirm the testing laboratory is **CLIA-certified and CAP-accredited**
3. Ask about **insurance coverage** — many states mandate coverage for specific genetic tests
4. Consider **familial testing** once a pathogenic variant is identified in the proband
${CTA}`
      : `## Gene Lookup — ${key}

No curated data found for gene "${key}" in the local reference set.
${variantNote}

### Authoritative Resources
- **OMIM** (omim.org) — comprehensive gene/phenotype catalog
- **ClinVar** (ncbi.nlm.nih.gov/clinvar) — variant pathogenicity classifications
- **gnomAD** (gnomad.broadinstitute.org) — population allele frequencies
- **LOVD** (lovd.nl) — locus-specific variant databases
- **Orphanet** (orpha.net) — rare disease gene-disease associations

### Guidance for Purpose: ${purpose.replace(/_/g, " ")}
${purposeGuidance[purpose]}
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── find_specialist ───────────────────────────────────────────────────────────
server.tool(
  "find_specialist",
  "Find appropriate medical specialists, centers of excellence, and patient advocacy organizations for a rare disease",
  {
    disease_name: z.string().describe("Rare disease or condition name"),
    specialty_needed: z.array(z.enum([
      "medical_geneticist", "genetic_counselor", "neurologist", "cardiologist",
      "metabolic_specialist", "immunologist", "hematologist", "rheumatologist",
      "any"
    ])).optional().default(["any"]).describe("Type(s) of specialist needed"),
    location_state: z.string().optional().describe("US state (two-letter code) for location filtering"),
    insurance: z.string().optional().describe("Insurance plan for in-network filtering guidance"),
    pediatric: z.boolean().optional().default(false).describe("Whether patient is a child (<18)"),
  },
  async ({ disease_name, specialty_needed, location_state, insurance, pediatric }) => {
    const specialtyLabels: Record<string, string> = {
      medical_geneticist: "Medical Geneticist (MD/DO)",
      genetic_counselor: "Genetic Counselor (MS/CGC)",
      neurologist: "Neurologist",
      cardiologist: "Cardiologist",
      metabolic_specialist: "Metabolic Disease Specialist",
      immunologist: "Immunologist / Allergist",
      hematologist: "Hematologist",
      rheumatologist: "Rheumatologist",
      any: "Any relevant specialist",
    };

    const requestedSpecialties = specialty_needed.includes("any")
      ? ["Medical Geneticist (MD/DO)", "Genetic Counselor (MS/CGC)"]
      : specialty_needed.map((s) => specialtyLabels[s]);

    const stateNote = location_state ? ` in ${location_state.toUpperCase()}` : "";
    const pedNote = pediatric ? " (pediatric)" : "";

    const centersOfExcellence = [
      "NIH National Human Genome Research Institute — nhgri.nih.gov",
      "NORD Centers of Excellence — rarediseases.org/living-with-rare-disease/centers-of-excellence",
      "USCF Rare Disease Program — raredisease.ucsf.edu",
      "Boston Children's Hospital Rare Disease Program (pediatric)",
      "Mayo Clinic Center for Individualized Medicine — mayo.edu/research/centers-programs/center-individualized-medicine",
      "National MPS Society (mucopolysaccharidoses) and other disease-specific COEs",
    ];

    const advocacyResources = [
      "NORD (National Organization for Rare Disorders) — rarediseases.org — disease-specific patient registries & support",
      "Global Genes — globalgenes.org — 7,000+ rare disease connections",
      "Rare Disease Legislative Advocates — rdla.net",
      "Genetic Alliance — geneticalliance.org — patient advocacy network",
      "EURORDIS — eurordis.org (European network, also global resources)",
    ];

    const finderTools = [
      `ACMG Geneticist Finder — acmg.net/find-a-geneticist (for Medical Geneticists${stateNote})`,
      `NSGC Counselor Finder — nsgc.org/Find-a-Genetic-Counselor (Genetic Counselors${stateNote})`,
      `NORD Rare Disease Centers — rarediseases.org/rare-disease-information/rare-disease-centers`,
      `Children's hospitals directory — childrenshospitals.org${pediatric ? " (pediatric centers)" : ""}`,
    ];

    const insuranceNote = insurance
      ? `\n### Insurance Guidance — ${insurance}\n- Call member services (number on card) and ask: "Which in-network providers specialize in [${disease_name}]?"\n- Ask about **prior authorization** requirements for specialist visits and genetic testing\n- Request an **out-of-network exception** if no in-network specialist has experience with this condition — this is often granted for rare diseases`
      : "";

    const result = `## Specialist Finder — ${disease_name}${pedNote}${stateNote}

**Specialties Needed:** ${requestedSpecialties.join(", ")}

### How to Find a Specialist
${finderTools.map((t) => `- ${t}`).join("\n")}

### Centers of Excellence
${centersOfExcellence.map((c) => `- ${c}`).join("\n")}

### Patient Advocacy Organizations
${advocacyResources.map((a) => `- ${a}`).join("\n")}
${insuranceNote}

### Tips for Getting an Appointment
1. **Contact the patient advocacy organization first** — they maintain specialist referral lists updated by the community
2. **Bring a complete medical summary** — rare disease specialists are more likely to accept new patients with organized records
3. **Telehealth is widely available** for medical genetics — geography is no longer a barrier for consultations
4. **Ask about coordinated care programs** — many rare disease centers offer multidisciplinary clinics in a single visit
5. **Academic medical centers** are your best bet — they handle the highest volume of undiagnosed and rare cases

> Always verify credentials and experience with your specific condition before booking an appointment.
${CTA}`;

    return { content: [{ type: "text", text: result }] };
  }
);

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);

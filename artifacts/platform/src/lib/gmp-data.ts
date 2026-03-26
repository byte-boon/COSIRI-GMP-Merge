export type GmpSection = {
  id: string;
  title: string;
  description: string;
  items: GmpItem[];
};

export type ScoreLevel = {
  score: number;
  label: string;
  requirement: string;
};

export type GmpItem = {
  id: string;
  label: string;
  description: string;
  scoreLevels: ScoreLevel[];
};

const MATURITY_BASE: ScoreLevel[] = [
  { score: 1, label: "Not Present", requirement: "" },
  { score: 2, label: "Initial",     requirement: "" },
  { score: 3, label: "Developing",  requirement: "" },
  { score: 4, label: "Managed",     requirement: "" },
  { score: 5, label: "Optimised",   requirement: "" },
];

function levels(reqs: [string, string, string, string, string]): ScoreLevel[] {
  return MATURITY_BASE.map((base, i) => ({ ...base, requirement: reqs[i] }));
}

export const GMP_SECTIONS: GmpSection[] = [
  {
    id: "leadership",
    title: "Leadership & Culture",
    description: "Evaluates the commitment of top management to quality, regulatory compliance, and the establishment of a quality-driven culture throughout the organisation.",
    items: [
      {
        id: "L1",
        label: "Management Commitment",
        description: "Evidence of top management commitment to quality and safety.",
        scoreLevels: levels([
          "No documented management commitment to quality or GMP. No quality policy, quality meetings, or executive involvement in quality matters.",
          "Management involvement is informal and reactive. Some verbal commitment exists but no documented processes, defined responsibilities, or regular quality reviews.",
          "A quality commitment statement exists and management reviews occur occasionally. Roles are partially defined but accountability is inconsistent across departments.",
          "Management commitment is documented, communicated, and regularly demonstrated. Quality reviews occur on a defined schedule with attendance records and action tracking.",
          "Leadership actively champions quality culture. Commitment is embedded in KPIs, performance reviews, strategic plans, and communicated to all staff with measurable outcomes.",
        ])
      },
      {
        id: "L2",
        label: "Quality Policy",
        description: "Quality policy is documented, understood, and implemented.",
        scoreLevels: levels([
          "No quality policy exists. There is no documented statement of quality intent or direction.",
          "A basic quality statement exists but is not formally approved, communicated, or reflected in day-to-day operations.",
          "A quality policy is formally documented and signed by management but awareness among staff is limited and implementation is inconsistent.",
          "The quality policy is approved, displayed, and communicated across the organisation. Staff can explain its relevance to their role with evidence of training records.",
          "The quality policy is reviewed annually, drives continuous improvement, is integrated into onboarding, and is referenced in operational decisions with measurable outcomes.",
        ])
      },
      {
        id: "L3",
        label: "Resource Allocation",
        description: "Adequate resources are provided to maintain the quality system.",
        scoreLevels: levels([
          "No dedicated resources for quality management. Quality activities are unfunded or informally supported only when issues arise.",
          "Minimal resources allocated on an ad-hoc basis. No formal budget or headcount dedicated to quality; resource provision is reactive to problems.",
          "Some dedicated quality resources exist (personnel or budget) but are insufficient for full GMP compliance. Resource requests are considered but not systematically planned.",
          "Adequate resources are formally allocated through a defined budget process. Staffing levels, equipment, and training budgets are reviewed annually against GMP requirements.",
          "Resources are proactively planned based on risk assessments and compliance roadmaps. Continuous investment in quality infrastructure, technology, and capability development is documented.",
        ])
      },
    ]
  },
  {
    id: "workforce",
    title: "Workforce & Safety",
    description: "Assesses personnel training, hygiene practices, and facility safety controls that protect both product quality and employee wellbeing.",
    items: [
      {
        id: "W1",
        label: "Training Records",
        description: "Personnel are adequately trained and records are maintained.",
        scoreLevels: levels([
          "No formal training programme or records. Staff perform tasks without documented qualification or GMP training.",
          "Some training occurs informally. Records are incomplete, inconsistent, or not linked to job roles. No training matrix exists.",
          "A training matrix is in place for some roles. Records are maintained but gaps exist; retraining schedules are not consistently enforced.",
          "All staff have documented, role-specific GMP training. Training records are complete, current, and accessible. Refresher training occurs on a defined schedule.",
          "Training effectiveness is assessed through competency checks, audits, and feedback loops. Training records are digitised, auto-tracked, and linked to performance management.",
        ])
      },
      {
        id: "W2",
        label: "Hygiene Practices",
        description: "Strict hygiene and safety protocols are followed.",
        scoreLevels: levels([
          "No hygiene procedures documented or enforced. Personnel hygiene is left to individual discretion with no monitoring.",
          "Basic hygiene rules exist informally (e.g., verbal instructions) but are not documented, consistently enforced, or verified by observation.",
          "Hygiene SOPs are documented and displayed. Staff are trained but compliance verification (e.g., spot checks, audits) is infrequent or informal.",
          "Hygiene procedures are documented, trained, and regularly verified. Non-conformances are recorded, investigated, and corrected within defined timeframes.",
          "Hygiene compliance is continuously monitored (e.g., environmental monitoring data, observation programmes). Trends are analysed and improvements are proactively implemented.",
        ])
      },
      {
        id: "W3",
        label: "Facility Safety",
        description: "Workspace is safe and hazards are mitigated.",
        scoreLevels: levels([
          "No formal hazard assessment or safety controls in place. Safety incidents are not recorded or investigated.",
          "Basic safety measures exist but risk assessments are incomplete or outdated. Some hazards remain unaddressed with no formal mitigation plan.",
          "Risk assessments are conducted and documented for main areas. Hazards are identified and partially mitigated but periodic review and worker consultation are limited.",
          "Formal risk assessments are current and cover all operational areas. Corrective actions are tracked to closure, and safety performance is monitored with incident reporting.",
          "Safety culture is embedded across the workforce. Proactive hazard identification, near-miss reporting, and continuous improvement programmes are in place and measured.",
        ])
      },
    ]
  },
  {
    id: "operations",
    title: "Operations & Quality",
    description: "Reviews the robustness of operational controls including SOPs, equipment management, traceability, and non-conformance handling.",
    items: [
      {
        id: "O1",
        label: "Standard Operating Procedures",
        description: "SOPs are available and followed correctly.",
        scoreLevels: levels([
          "No SOPs exist for key operations. Work is performed from memory or informal instruction with no standardisation.",
          "Some SOPs exist but are incomplete, outdated, or inaccessible at the point of use. Compliance to SOPs is not verified.",
          "SOPs cover most critical operations and are available at workstations. Version control is partially implemented; periodic reviews occur irregularly.",
          "All critical operations have current, version-controlled SOPs. SOPs are reviewed on a defined cycle, approved by qualified personnel, and compliance is routinely verified.",
          "SOPs are continuously improved based on deviation data, staff feedback, and best practices. Digital access, training integration, and change management are fully implemented.",
        ])
      },
      {
        id: "O2",
        label: "Equipment Maintenance",
        description: "Equipment is regularly calibrated and maintained.",
        scoreLevels: levels([
          "No preventive maintenance or calibration programme. Equipment is operated until failure with no records of service history.",
          "Maintenance is reactive (breakdown-based) with basic records. Calibration is performed inconsistently; some critical equipment may be operating out of calibration.",
          "A maintenance schedule exists and is partially followed. Calibration records are maintained for most instruments but gaps exist in frequency or documentation.",
          "All critical equipment has a documented preventive maintenance and calibration programme. Records are complete, current, and equipment status is clearly labelled.",
          "Equipment management integrates predictive maintenance, automated calibration reminders, and continuous monitoring. Historical data drives maintenance optimisation and replacement planning.",
        ])
      },
      {
        id: "O3",
        label: "Traceability",
        description: "Full traceability of materials throughout the process.",
        scoreLevels: levels([
          "No traceability system in place. Materials cannot be traced from receipt to dispatch; batch records are absent or incomplete.",
          "Basic batch numbers or lot codes exist but the traceability system is manual, inconsistent, and cannot support a full trace in reasonable time.",
          "Traceability system covers most processes. Batch records exist but may have gaps; a full trace-back is possible but time-consuming and prone to error.",
          "Full end-to-end traceability is in place for all materials, processes, and products. Batch records are complete, controlled, and a full trace can be performed efficiently.",
          "Traceability is digital and near-real-time. System enables rapid trace and recall decisions. Data is integrated across supply chain with automated alerts for out-of-spec events.",
        ])
      },
      {
        id: "O4",
        label: "Non-conformance Handling",
        description: "Clear process for handling non-conforming products.",
        scoreLevels: levels([
          "No formal non-conformance process. Non-conforming products are not systematically identified, segregated, or investigated.",
          "Non-conformances are identified informally. Segregation occurs but root cause investigation and formal disposition decisions are inconsistent or undocumented.",
          "A non-conformance procedure exists. Most non-conformances are documented and investigated but CAPA closure rates and effectiveness verification are incomplete.",
          "All non-conformances are formally documented, investigated for root cause, and subject to CAPA. Effectiveness of corrective actions is verified and trend analysis is performed.",
          "Non-conformance data drives systemic improvement. Predictive analysis identifies emerging risks before non-conformances occur. CAPA closure is near 100% on time with full effectiveness verification.",
        ])
      },
    ]
  },
  {
    id: "infosec",
    title: "Information Security",
    description: "Examines the controls protecting quality records, data integrity, and business continuity of critical operational information.",
    items: [
      {
        id: "I1",
        label: "Data Access",
        description: "Access to quality records is controlled and secure.",
        scoreLevels: levels([
          "No access controls on quality records. All staff can view, modify, or delete records without restriction or audit trail.",
          "Basic access restrictions exist (e.g., password protection) but are not role-based, consistently applied, or monitored. Shared credentials are common.",
          "Role-based access control is partially implemented. Most quality records are protected but some shared access, informal overrides, or uncontrolled paper records exist.",
          "Role-based access is fully implemented and regularly reviewed. An audit trail records all access and modifications. Access rights are reviewed when roles change.",
          "Access is managed through an integrated identity management system. Real-time monitoring, anomaly detection, and automatic deprovisioning are in place with regular penetration testing.",
        ])
      },
      {
        id: "I2",
        label: "Backup Systems",
        description: "Regular backups of critical operational data.",
        scoreLevels: levels([
          "No backup process for critical quality data. Data loss would result in permanent loss of records and significant compliance failure.",
          "Informal or manual backups occur occasionally but are not scheduled, tested, or documented. Recovery capability is unknown.",
          "Backups are scheduled for most critical systems. Recovery procedures exist but restoration has not been tested, and off-site or cloud storage may be absent.",
          "Automated, scheduled backups cover all critical quality data with off-site or cloud storage. Restoration is tested periodically and recovery time objectives are defined.",
          "Backup and disaster recovery are fully automated, tested quarterly, and integrated with business continuity plans. Recovery time and point objectives are met and independently verified.",
        ])
      },
    ]
  }
];

// Map a numeric score (1-5) or null/NA to a compliance bucket for the overall %
export function scoreToCompliance(score: number | null): "compliant" | "partial" | "noncompliant" | "na" {
  if (score === null) return "na";
  if (score >= 4) return "compliant";
  if (score === 3) return "partial";
  return "noncompliant";
}

// Calculate overall score (0-100) from responses map
export function calculateGmpScore(responses: Record<string, GmpResponse>): number {
  const entries = Object.values(responses).filter(r => r.score !== null);
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, r) => sum + (r.score ?? 0), 0);
  return Math.round((total / (entries.length * 5)) * 100);
}

export type GmpAttachment = {
  name: string;
  path: string;  // objectPath from storage API e.g. /objects/uploads/xxx
  size?: number;
  uploadedAt: string;
};

export type GmpResponse = {
  score: number | null;   // 1-5 or null (not answered)
  na: boolean;            // true if marked N/A
  notes?: string;
  attachments: GmpAttachment[];
};

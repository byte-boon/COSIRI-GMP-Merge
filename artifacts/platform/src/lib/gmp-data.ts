export type GmpSection = {
  id: string;
  title: string;
  items: GmpItem[];
};

export type GmpItem = {
  id: string;
  label: string;
  description: string;
};

export const GMP_SECTIONS: GmpSection[] = [
  {
    id: "leadership",
    title: "Leadership & Culture",
    items: [
      { id: "L1", label: "Management Commitment", description: "Evidence of top management commitment to quality and safety." },
      { id: "L2", label: "Quality Policy", description: "Quality policy is documented, understood, and implemented." },
      { id: "L3", label: "Resource Allocation", description: "Adequate resources are provided to maintain the quality system." }
    ]
  },
  {
    id: "workforce",
    title: "Workforce & Safety",
    items: [
      { id: "W1", label: "Training Records", description: "Personnel are adequately trained and records are maintained." },
      { id: "W2", label: "Hygiene Practices", description: "Strict hygiene and safety protocols are followed." },
      { id: "W3", label: "Facility Safety", description: "Workspace is safe and hazards are mitigated." }
    ]
  },
  {
    id: "operations",
    title: "Operations & Quality",
    items: [
      { id: "O1", label: "Standard Operating Procedures", description: "SOPs are available and followed correctly." },
      { id: "O2", label: "Equipment Maintenance", description: "Equipment is regularly calibrated and maintained." },
      { id: "O3", label: "Traceability", description: "Full traceability of materials throughout the process." },
      { id: "O4", label: "Non-conformance Handling", description: "Clear process for handling non-conforming products." }
    ]
  },
  {
    id: "infosec",
    title: "Information Security",
    items: [
      { id: "I1", label: "Data Access", description: "Access to quality records is controlled and secure." },
      { id: "I2", label: "Backup Systems", description: "Regular backups of critical operational data." }
    ]
  }
];

export type PricingTier = {
  id: string;
  badge: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyEquivalent: number;
  annualBilledLabel: string;
  companiesLabel: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
  features: string[];
};

export type ComparisonSection = {
  title: string;
  rows: Array<{
    feature: string;
    solo: string | boolean;
    unlimited: string | boolean;
  }>;
};

export type FrameworkCard = {
  tag: string;
  title: string;
  description: string;
  modules: string[];
  accent: "blue" | "gold";
};

export const pricingTiers: PricingTier[] = [
  {
    id: "solo",
    badge: "Solo Licence",
    name: "Solo Assessor",
    tagline: "For independent consultants and in-house assessors working with one company at a time.",
    monthlyPrice: 200,
    annualMonthlyEquivalent: 160,
    annualBilledLabel: "$1,920 billed annually",
    companiesLabel: "1 assessed company at a time",
    description:
      "Purpose-built for one named assessor conducting unlimited COSIRI and GMP assessments for a single organisation or client at a time.",
    ctaLabel: "Start Solo Workspace",
    ctaHref: "/register",
    features: [
      "Unlimited COSIRI assessments for one company",
      "Unlimited GMP assessments for one company",
      "AI-generated assessment reports and gap analysis",
      "Assessment history, versioning, and exports",
      "14-day free trial and standard email support",
    ],
  },
  {
    id: "unlimited",
    badge: "Unlimited Licence",
    name: "Unlimited Assessor",
    tagline: "For consulting practices, certification bodies, and multi-client programmes.",
    monthlyPrice: 1000,
    annualMonthlyEquivalent: 800,
    annualBilledLabel: "$9,600 billed annually",
    companiesLabel: "Unlimited assessed companies",
    description:
      "Designed for one named assessor running assessments across an unlimited client or site portfolio, with premium reporting and programme oversight features.",
    ctaLabel: "Choose Unlimited",
    ctaHref: "/register",
    highlight: true,
    features: [
      "Unlimited COSIRI and GMP assessments across all clients",
      "Portfolio dashboard and cross-company benchmarking",
      "White-label branded reports and consolidated outputs",
      "Priority support, onboarding, and re-assessment scheduling",
      "API access and early framework access",
    ],
  },
];

export const comparisonSections: ComparisonSection[] = [
  {
    title: "Assessment Scope",
    rows: [
      { feature: "Companies assessed", solo: "1 company", unlimited: "Unlimited" },
      { feature: "Assessments per company", solo: "Unlimited", unlimited: "Unlimited" },
      { feature: "COSIRI framework", solo: true, unlimited: true },
      { feature: "GMP assessment module", solo: true, unlimited: true },
      { feature: "Industry benchmarking", solo: true, unlimited: true },
    ],
  },
  {
    title: "Reports & Output",
    rows: [
      { feature: "AI-generated assessment report", solo: true, unlimited: true },
      { feature: "Gap analysis and action plan", solo: true, unlimited: true },
      { feature: "PDF and Excel export", solo: true, unlimited: true },
      { feature: "White-label branded reports", solo: false, unlimited: true },
      { feature: "Consolidated portfolio reports", solo: false, unlimited: true },
    ],
  },
  {
    title: "Platform & Features",
    rows: [
      { feature: "Assessment history and versioning", solo: true, unlimited: true },
      { feature: "Portfolio dashboard", solo: false, unlimited: true },
      { feature: "Cross-company benchmarking", solo: false, unlimited: true },
      { feature: "Team collaboration and sharing", solo: false, unlimited: true },
      { feature: "Re-assessment scheduling", solo: false, unlimited: true },
      { feature: "API access", solo: false, unlimited: true },
    ],
  },
  {
    title: "Support",
    rows: [
      { feature: "Email support", solo: true, unlimited: true },
      { feature: "Priority support", solo: false, unlimited: true },
      { feature: "Dedicated account manager", solo: false, unlimited: true },
      { feature: "Onboarding and training session", solo: false, unlimited: true },
      { feature: "Early access to new frameworks", solo: false, unlimited: true },
    ],
  },
];

export const frameworkCards: FrameworkCard[] = [
  {
    tag: "Sustainability Performance",
    title: "COSIRI Framework",
    description:
      "The Corporate Sustainability and Responsibility Index for structured sustainability maturity assessments across strategy, governance, operations, climate, and disclosure priorities.",
    modules: [
      "Strategy & Governance",
      "Environmental Performance",
      "Social Impact",
      "Circular Economy",
      "Climate Risk",
      "Reporting & Disclosure",
      "AI Maturity Scoring",
    ],
    accent: "blue",
  },
  {
    tag: "Quality & Manufacturing",
    title: "GMP Assessment",
    description:
      "A practical GMP assessment environment covering quality systems, process controls, hygiene, documentation, validation, and compliance workflows for industrial manufacturers.",
    modules: [
      "Quality Management",
      "Process Controls",
      "Documentation",
      "Hygiene Standards",
      "Equipment Validation",
      "Regulatory Compliance",
      "Risk Assessment",
    ],
    accent: "gold",
  },
];

export const pricingFaq = [
  {
    question: 'What counts as a "company" under the Solo licence?',
    answer:
      "One company means one assessed organisation at a time. You can run unlimited assessments, re-assessments, and follow-up work for that company, but a second assessed company requires the Unlimited licence.",
  },
  {
    question: "Can I upgrade from Solo to Unlimited later?",
    answer:
      "Yes. Upgrades can happen at any time, with the remaining billing period prorated and your assessment history preserved.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Both licences include a 14-day free trial so you can complete a full assessment flow before committing commercially.",
  },
  {
    question: "Does Unlimited cover every assessor in my firm?",
    answer:
      "Unlimited is a per-assessor licence with unlimited assessed companies. Teams with multiple named assessors can add volume licensing through NGSTCO.",
  },
  {
    question: "Which industries are supported?",
    answer:
      "AssessPro is designed for industrial and manufacturing sectors including oil and gas, petrochemicals, construction, food and beverage, pharmaceuticals, automotive, electronics, and heavy industry.",
  },
  {
    question: "Can I pay annually to save 20%?",
    answer:
      "Yes. Annual billing saves 20% compared with monthly pricing, reducing Solo to $160 per month equivalent and Unlimited to $800 per month equivalent.",
  },
  {
    question: "Do you offer custom enterprise pricing?",
    answer:
      "Yes. Government bodies, large consulting firms, and organisations with complex rollout or integration needs can request tailored pricing and service terms.",
  },
];

export type PricingTier = {
  id: string;
  name: string;
  tagline: string;
  priceLabel: string;
  billingLabel: string;
  description: string;
  ctaLabel: string;
  highlight?: boolean;
  features: string[];
};

export const pricingTiers: PricingTier[] = [
  {
    id: "cosiri-core",
    name: "COSIRI Core",
    tagline: "Sustainability readiness assessments for growing manufacturing teams",
    priceLabel: "Custom quote",
    billingLabel: "annual license",
    description:
      "Ideal for organisations starting with structured COSIRI benchmarking, evidence capture, and AI-supported sustainability roadmapping.",
    ctaLabel: "Start workspace",
    features: [
      "COSIRI maturity assessments",
      "Evidence upload and site profiling",
      "AI insights and narrative summaries",
      "Improvement roadmap generation",
      "Up to 5 named users",
    ],
  },
  {
    id: "gmp-professional",
    name: "GMP Professional",
    tagline: "Audit execution, findings, and CAPA management in one workspace",
    priceLabel: "Custom quote",
    billingLabel: "annual license",
    description:
      "Best for quality and operations teams that need repeatable GMP audit workflows, findings tracking, and executive reporting.",
    ctaLabel: "Choose GMP",
    highlight: true,
    features: [
      "Full GMP audit tracker",
      "Findings and CAPA workflows",
      "Audit reporting and history",
      "AI CAPA drafting assistance",
      "Up to 10 named users",
    ],
  },
  {
    id: "platform-enterprise",
    name: "Unified Enterprise",
    tagline: "Combined COSIRI and GMP platform for multi-site programmes",
    priceLabel: "Custom quote",
    billingLabel: "annual enterprise agreement",
    description:
      "For organisations running sustainability maturity and GMP assurance together with multi-site visibility and central governance.",
    ctaLabel: "Talk to sales",
    features: [
      "COSIRI + GMP in one platform",
      "Cross-module dashboards",
      "Enterprise onboarding support",
      "Priority support and workspace configuration",
      "Multi-site rollout options",
    ],
  },
];

export const pricingFaq = [
  {
    question: "Can we start with one module and expand later?",
    answer:
      "Yes. Teams can start with COSIRI or GMP and expand into the combined platform as their programme matures.",
  },
  {
    question: "Do you support enterprise onboarding?",
    answer:
      "Yes. Enterprise plans include workspace configuration support, rollout guidance, and tailored onboarding sessions.",
  },
  {
    question: "Will billing integrate with PayPal later?",
    answer:
      "Yes. The pricing structure is set up so PayPal-backed billing can be activated cleanly once final plan figures are approved.",
  },
];

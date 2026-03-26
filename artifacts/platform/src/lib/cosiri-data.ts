export const MATURITY_LABELS: Record<number, string> = {
  0: "None",
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Leader",
  5: "Industry Leader",
};

export const BAND_DESCRIPTIONS: Record<number, {
  title: string;
  summary: string;
  criteria: string;
  evidence: string;
}> = {
  0: {
    title: "No Readiness",
    summary: "No ambition, targets, or formal activities exist.",
    criteria: "The organisation has not yet begun addressing this dimension.",
    evidence: "No policies, no tracking, no accountability structures.",
  },
  1: {
    title: "Initial Awareness",
    summary: "Awareness exists but efforts are ad-hoc and unstructured.",
    criteria: "Early recognition of importance with no formal framework.",
    evidence: "Informal discussions underway; no targets or processes defined.",
  },
  2: {
    title: "Developing",
    summary: "Structured plans are forming with early implementation.",
    criteria: "Initial targets set and basic processes being put in place.",
    evidence: "Some documentation exists; limited integration across business units.",
  },
  3: {
    title: "Integrated (Baseline)",
    summary: "Systematic approach embedded in operations with measurable results.",
    criteria: "Processes documented, KPIs tracked, leadership accountability established.",
    evidence: "Regular internal reporting; cross-functional coordination in place.",
  },
  4: {
    title: "Advanced",
    summary: "Data-driven optimisation with continuous improvement practices.",
    criteria: "Targets consistently met or exceeded; analytics-informed decisions.",
    evidence: "Benchmarking against peers; advanced tooling and integration across value chain.",
  },
  5: {
    title: "Industry Leading",
    summary: "Best-in-class performance setting sector benchmarks.",
    criteria: "Recognised externally as an innovator; influencing industry standards.",
    evidence: "Third-party verification, awards, or peer citation as a reference practice.",
  },
};

export type CosiriDimension = {
  id: string;
  pillar: string;
  block: 'Strategy & Risk Management' | 'Sustainable Business Processes' | 'Technology' | 'Organisation & Governance';
  name: string;
  description: string;
  question: string;
  options: { score: number; label: string; description: string; details?: string[] }[];
};

const createBands = (name: string) => [
  { score: 0, label: "Band 0", description: `No ${name} ambition or targets defined.` },
  { score: 1, label: "Band 1", description: `Initial awareness of ${name} impact.` },
  { score: 2, label: "Band 2", description: `Developing structured ${name} plans.` },
  { score: 3, label: "Band 3", description: `Integrated ${name} management (Baseline).` },
  { score: 4, label: "Band 4", description: `Advanced ${name} optimization.` },
  { score: 5, label: "Band 5", description: `Industry-leading ${name} performance.` }
];

export const BUILDING_BLOCKS = [
  "Strategy & Risk Management",
  "Sustainable Business Processes",
  "Technology",
  "Organisation & Governance"
] as const;

export const COSIRI_DATA: CosiriDimension[] = [
  // Block 1
  { id: "D1", block: "Strategy & Risk Management", pillar: "Strategy", name: "Strategy & Target Setting", description: "Assessment of the company's sustainability strategy.", question: "How defined is your sustainability strategy?", options: createBands('Strategy') },
  { id: "D2", block: "Strategy & Risk Management", pillar: "Strategy", name: "ESG Integration", description: "Integration of ESG factors into business.", question: "To what extent is ESG integrated?", options: createBands('ESG') },
  { id: "D3", block: "Strategy & Risk Management", pillar: "Strategy", name: "Green Business Modelling", description: "Sustainability driving new business models.", question: "How does sustainability influence your model?", options: createBands('Green Model') },
  { id: "D4", block: "Strategy & Risk Management", pillar: "Risk", name: "Capital Allocation", description: "Investment decisions aligned with sustainability.", question: "How are metrics used in capital allocation?", options: createBands('Capital') },
  { id: "D5", block: "Strategy & Risk Management", pillar: "Risk", name: "Physical Climate Risk", description: "Management of physical climate risks.", question: "How are physical risks managed?", options: createBands('Physical Risk') },
  { id: "D6", block: "Strategy & Risk Management", pillar: "Risk", name: "Transition Risk", description: "Risks from transition to low-carbon economy.", question: "How are transition risks managed?", options: createBands('Transition Risk') },
  { id: "D7", block: "Strategy & Risk Management", pillar: "Risk", name: "Compliance Risk", description: "Sustainability compliance and legal risks.", question: "How is compliance managed?", options: createBands('Compliance') },
  { id: "D8", block: "Strategy & Risk Management", pillar: "Risk", name: "Reputation Risk", description: "Brand and stakeholder perception risks.", question: "How is reputation risk managed?", options: createBands('Reputation') },
  
  // Block 2
  { id: "D9", block: "Sustainable Business Processes", pillar: "Environment", name: "GHG Emissions", description: "Scope 1, 2, and 3 management.", question: "How do you manage GHG emissions?", options: createBands('GHG') },
  { id: "D10", block: "Sustainable Business Processes", pillar: "Environment", name: "Resources", description: "Energy and water consumption management.", question: "How is resource consumption optimized?", options: createBands('Resources') },
  { id: "D11", block: "Sustainable Business Processes", pillar: "Environment", name: "Material Waste", description: "Waste generation and disposal management.", question: "How is material waste managed?", options: createBands('Waste') },
  { id: "D12", block: "Sustainable Business Processes", pillar: "Environment", name: "Pollution", description: "Air, water, and soil pollution management.", question: "How are pollutants managed?", options: createBands('Pollution') },
  { id: "D13", block: "Sustainable Business Processes", pillar: "Supply Chain", name: "Supplier Assessment", description: "Sustainability of the supply chain.", question: "How are suppliers assessed?", options: createBands('Supplier') },
  { id: "D14", block: "Sustainable Business Processes", pillar: "Supply Chain", name: "Sustainable Procurement", description: "Sustainability in procurement policies.", question: "How is sustainability integrated in procurement?", options: createBands('Procurement') },
  { id: "D15", block: "Sustainable Business Processes", pillar: "Supply Chain", name: "Transportation", description: "Sustainability of logistics.", question: "How are logistics emissions managed?", options: createBands('Logistics') },
  { id: "D16", block: "Sustainable Business Processes", pillar: "Supply Chain", name: "Supply-Chain Planning", description: "Environmental factors in planning.", question: "How does planning incorporate environment?", options: createBands('Planning') },
  { id: "D17", block: "Sustainable Business Processes", pillar: "Lifecycle", name: "Product Design", description: "Eco-design and lifecycle management.", question: "How is sustainability integrated in design?", options: createBands('Design') },
  { id: "D18", block: "Sustainable Business Processes", pillar: "Lifecycle", name: "Circular Process", description: "End-of-life cycle management.", question: "How are products managed at end-of-life?", options: createBands('Circular') },

  // Block 3
  { id: "D19", block: "Technology", pillar: "Tech", name: "Technology Adoption", description: "Deployment of clean technologies.", question: "How are clean technologies deployed?", options: createBands('Adoption') },
  { id: "D20", block: "Technology", pillar: "Tech", name: "Transparency", description: "Digital transparency across value chain.", question: "How transparent is sustainability data?", options: createBands('Transparency') },

  // Block 4
  { id: "D21", block: "Organisation & Governance", pillar: "People", name: "Workforce Development", description: "Skills and training for sustainability.", question: "How is workforce trained?", options: createBands('Workforce') },
  { id: "D22", block: "Organisation & Governance", pillar: "People", name: "Leadership Involvement", description: "Leadership commitment to sustainability.", question: "How involved is leadership?", options: createBands('Leadership') },
  { id: "D23", block: "Organisation & Governance", pillar: "Governance", name: "External Communication", description: "Reporting and stakeholder engagement.", question: "How is sustainability communicated?", options: createBands('Communication') },
  { id: "D24", block: "Organisation & Governance", pillar: "Governance", name: "Governance Structure", description: "Internal structures and policies.", question: "How is sustainability governed?", options: createBands('Governance') }
];

// D1-D24 order for all benchmark arrays
// [Strategy,ESG,GreenBiz,Capital,PhysRisk,TransRisk,Compliance,Reputation,
//  GHG,Resources,Waste,Pollution,Supplier,Procurement,Transport,SCPlanning,
//  ProductDesign,Circular,TechAdoption,Transparency,Workforce,Leadership,ExtComms,Governance]

export type BenchmarkEntry = { avg: number[]; bic: number[] };

export const INDUSTRY_BENCHMARKS: Record<string, BenchmarkEntry> = {
  food_beverage: {
    avg: [2.0,1.8,1.5,1.8,2.0,1.8,2.5,2.2,2.5,2.8,2.5,2.2,1.8,2.0,1.5,1.8,1.8,1.5,1.5,1.8,2.2,2.5,2.0,2.2],
    bic: [4.0,3.5,3.0,3.5,4.0,3.5,4.5,4.0,4.5,4.5,4.0,4.0,3.5,3.5,3.0,3.5,3.5,3.5,3.5,4.0,4.0,4.5,4.0,4.5],
  },
  pharmaceutical: {
    avg: [2.5,2.5,1.8,2.0,2.2,2.5,3.5,3.0,2.0,2.2,2.0,2.5,2.0,2.2,1.8,2.0,2.0,1.8,2.0,2.5,2.5,3.0,3.0,3.5],
    bic: [4.5,4.5,3.5,4.0,4.0,4.5,5.0,5.0,4.0,4.0,4.0,4.5,4.0,4.0,3.5,4.0,4.0,3.5,4.0,4.5,4.5,5.0,5.0,5.0],
  },
  consumer_goods: {
    avg: [2.2,2.0,1.8,1.8,1.8,1.8,2.5,2.5,2.0,2.0,2.2,1.8,2.5,2.5,2.0,2.5,2.5,2.0,1.8,2.0,2.0,2.2,2.2,2.2],
    bic: [4.0,3.5,3.5,3.5,3.5,3.5,4.5,4.5,4.0,4.0,4.0,3.5,4.5,4.5,4.0,4.5,4.5,4.0,3.5,4.0,4.0,4.0,4.0,4.0],
  },
  manufacturing: {
    avg: [1.8,1.5,1.2,1.8,2.0,1.8,2.5,1.8,2.5,2.5,2.2,2.2,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,2.0,2.2,1.8,2.0],
    bic: [3.5,3.5,3.0,3.5,4.0,3.5,4.5,3.5,4.5,4.5,4.0,4.0,3.5,3.5,3.5,3.5,3.5,3.5,3.5,3.5,4.0,4.0,3.5,4.0],
  },
  energy: {
    avg: [2.5,2.5,2.0,2.5,3.0,3.0,3.0,2.5,3.0,2.5,2.0,2.5,2.0,2.0,2.0,2.0,1.5,1.5,2.5,2.5,2.5,3.0,2.5,3.0],
    bic: [5.0,4.5,4.0,5.0,5.0,5.0,5.0,4.5,5.0,4.5,4.0,4.5,4.0,4.0,4.0,4.0,3.5,3.5,4.5,4.5,4.5,5.0,4.5,5.0],
  },
  technology: {
    avg: [2.0,2.5,2.0,2.0,1.5,1.8,2.5,2.5,1.5,2.0,1.5,1.5,1.5,1.8,1.5,2.0,2.5,2.0,3.5,3.5,2.5,2.8,2.5,2.5],
    bic: [4.0,4.5,4.0,4.0,3.5,3.5,4.5,4.5,3.5,4.0,3.5,3.5,3.5,3.5,3.5,4.0,4.5,4.0,5.0,5.0,4.5,4.5,4.5,4.5],
  },
  default: {
    avg: [2.0,2.0,1.8,1.8,2.0,2.0,2.5,2.0,2.0,2.2,2.0,2.0,1.8,1.8,1.5,1.8,1.8,1.5,1.8,2.0,2.2,2.5,2.2,2.5],
    bic: [4.0,4.0,3.5,3.5,4.0,4.0,4.5,4.0,4.0,4.0,4.0,4.0,3.5,3.5,3.5,3.5,3.5,3.5,4.0,4.0,4.0,4.5,4.0,4.5],
  },
};

export function getBenchmarkKey(industry: string): string {
  const l = industry.toLowerCase();
  if (l.includes('food') || l.includes('beverage') || l.includes('fmcg') || l.includes('dairy') || l.includes('drink')) return 'food_beverage';
  if (l.includes('pharma') || l.includes('health') || l.includes('medical') || l.includes('biotech') || l.includes('life science')) return 'pharmaceutical';
  if (l.includes('consumer') || l.includes('retail') || l.includes('fashion') || l.includes('apparel') || l.includes('goods')) return 'consumer_goods';
  if (l.includes('energy') || l.includes('oil') || l.includes('gas') || l.includes('utility') || l.includes('power') || l.includes('renewab')) return 'energy';
  if (l.includes('tech') || l.includes('software') || l.includes('digital') || l.includes('it ') || l.includes('saas') || l.includes('telecom')) return 'technology';
  if (l.includes('manufact') || l.includes('industrial') || l.includes('auto') || l.includes('chemical') || l.includes('aerospace') || l.includes('machin')) return 'manufacturing';
  return 'default';
}

// Impact weights D1-D24 (1-5 scale, 5 = highest sustainability impact)
export const DIMENSION_WEIGHTS: number[] = [
  4, 3, 2, 2, 3, 2, 3, 2, // Strategy & Risk (D1-D8)
  5, 4, 3, 2, 3, 2, 2, 2, // Business Processes Env + SC (D9-D16)
  2, 3,                    // Lifecycle (D17-D18)
  3, 3,                    // Technology (D19-D20)
  3, 4, 2, 4,              // O&G (D21-D24)
];

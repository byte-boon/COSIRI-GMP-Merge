import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Save, Activity, Info, TrendingUp, Building2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { COSIRI_DATA, BUILDING_BLOCKS, BAND_DESCRIPTIONS } from "@/lib/cosiri-data";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreateCosiriAssessment, useSaveCosiriAnswers } from "@workspace/api-client-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { EvidenceBox } from "@/components/EvidenceBox";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const BAND_COLORS: Record<number, string> = {
  0: "text-slate-400",
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-amber-500",
  4: "text-blue-500",
  5: "text-green-500",
};

const SCORE_BADGE: Record<number, string> = {
  0: "bg-slate-100 text-slate-600 border-slate-200",
  1: "bg-red-50 text-red-700 border-red-200",
  2: "bg-orange-50 text-orange-700 border-orange-200",
  3: "bg-amber-50 text-amber-700 border-amber-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  5: "bg-green-50 text-green-700 border-green-200",
};

const SCORE_RING: Record<number, string> = {
  0: "ring-slate-300",
  1: "ring-red-300",
  2: "ring-orange-300",
  3: "ring-amber-400",
  4: "ring-blue-400",
  5: "ring-green-400",
};

const BAND_CARD: Record<number, { accent: string; ring: string }> = {
  0: { accent: "border-l-slate-400",  ring: "ring-slate-300"  },
  1: { accent: "border-l-red-400",    ring: "ring-red-200"    },
  2: { accent: "border-l-orange-400", ring: "ring-orange-200" },
  3: { accent: "border-l-amber-400",  ring: "ring-amber-200"  },
  4: { accent: "border-l-blue-400",   ring: "ring-blue-200"   },
  5: { accent: "border-l-green-500",  ring: "ring-green-200"  },
};

const BLOCK_CONFIG: Record<string, {
  bg: string; activeBg: string; border: string; activeBorder: string;
  ring: string; icon: string; accent: string;
  description: string; dimensions: string; covers: string[];
}> = {
  "Strategy & Risk Management": {
    bg: "bg-violet-50/60 dark:bg-violet-950/20",
    activeBg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200/60 dark:border-violet-800/40",
    activeBorder: "border-violet-400 dark:border-violet-500",
    ring: "ring-violet-300/50 dark:ring-violet-700/50",
    icon: "🟣",
    accent: "text-violet-700 dark:text-violet-400",
    description: "Evaluates how sustainability is embedded in corporate strategy and how climate-related and ESG risks are identified, assessed, and managed.",
    dimensions: "8 dimensions",
    covers: ["Sustainability Strategy", "Green Business Models", "Climate Risk (Physical)", "Transition Risk", "Compliance Risk", "Reputation Risk", "Capital Allocation", "ESG Integration"],
  },
  "Sustainable Business Processes": {
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    activeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    activeBorder: "border-emerald-500 dark:border-emerald-500",
    ring: "ring-emerald-300/50 dark:ring-emerald-700/50",
    icon: "🟢",
    accent: "text-emerald-700 dark:text-emerald-400",
    description: "Measures the sustainability of day-to-day operations — from environmental impact management to responsible supply chain and circular product design.",
    dimensions: "10 dimensions",
    covers: ["GHG Emissions", "Energy & Resources", "Waste & Pollution", "Supplier Assessment", "Responsible Procurement", "Sustainable Transport", "Supply Chain Planning", "Product Design", "Circular Processes", "Lifecycle Management"],
  },
  "Technology": {
    bg: "bg-sky-50/60 dark:bg-sky-950/20",
    activeBg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200/60 dark:border-sky-800/40",
    activeBorder: "border-sky-500 dark:border-sky-400",
    ring: "ring-sky-300/50 dark:ring-sky-700/50",
    icon: "🔵",
    accent: "text-sky-700 dark:text-sky-400",
    description: "Assesses the adoption of clean and digital technologies to enable sustainable operations and provides digital transparency across the value chain.",
    dimensions: "2 dimensions",
    covers: ["Technology Adoption (clean & digital tech)", "Transparency & Digital Visibility"],
  },
  "Organisation & Governance": {
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    activeBg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200/60 dark:border-amber-800/40",
    activeBorder: "border-amber-500 dark:border-amber-400",
    ring: "ring-amber-300/50 dark:ring-amber-700/50",
    icon: "🟡",
    accent: "text-amber-700 dark:text-amber-500",
    description: "Examines the people, culture, leadership commitment, reporting standards, and governance structures that underpin a sustainable organisation.",
    dimensions: "4 dimensions",
    covers: ["Workforce Development", "Leadership & Culture", "External Reporting & Communication", "Governance Structures & Policies"],
  },
};

interface SiteProfile {
  siteName?: string;
  location?: string;
  subSector?: string;
  employeeCount?: string;
  productionArea?: string;
  productsManufactured?: string;
  assessorName?: string;
  assessorCredentials?: string;
  cosiriVersion?: string;
  assessmentDate?: string;
}

export default function CosiriAssessment() {
  const [, setLocation] = useLocation();
  const { company } = useCompany();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeBlock, setActiveBlock] = useState<(typeof BUILDING_BLOCKS)[number]>(BUILDING_BLOCKS[0]);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftCreating, setDraftCreating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [profile, setProfile] = useState<SiteProfile>({
    cosiriVersion: "COSIRI-24",
    assessmentDate: new Date().toISOString().split("T")[0],
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveProfileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutateAsync: createAssessment, isPending: isCreating } = useCreateCosiriAssessment();
  const { mutateAsync: saveAnswers, isPending: isSaving } = useSaveCosiriAnswers();

  // Create a draft assessment on mount so evidence can be attached immediately
  useEffect(() => {
    if (!company || draftId || draftCreating) return;
    setDraftCreating(true);

    createAssessment({
      data: {
        companyId: company.id,
        companyName: company.name,
        industry: company.industry,
        status: "draft",
        overallScore: 0,
      },
    })
      .then(a => setDraftId(a.id))
      .catch(console.error)
      .finally(() => setDraftCreating(false));
  }, [company]);

  const handleAnswer = (dimensionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [dimensionId]: score }));
  };

  const dimensionsInBlock = COSIRI_DATA.filter(d => d.block === activeBlock);
  const totalAnswered = Object.keys(answers).length;
  const progress = Math.round((totalAnswered / COSIRI_DATA.length) * 100);
  const currentBlockIdx = BUILDING_BLOCKS.indexOf(activeBlock);
  const isFirstBlock = currentBlockIdx === 0;
  const isLastBlock = currentBlockIdx === BUILDING_BLOCKS.length - 1;

  const goToBlock = (idx: number) => {
    setActiveBlock(BUILDING_BLOCKS[idx]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const liveScore = totalAnswered > 0
    ? Object.values(answers).reduce((a, b) => a + b, 0) / totalAnswered
    : null;

  const blockAvg = (block: (typeof BUILDING_BLOCKS)[number]) => {
    const dims = COSIRI_DATA.filter(d => d.block === block);
    const scored = dims.filter(d => answers[d.id] !== undefined);
    if (scored.length === 0) return null;
    return scored.reduce((sum, d) => sum + answers[d.id], 0) / scored.length;
  };

  const handleProfileChange = (field: keyof SiteProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (!draftId) return;
    if (saveProfileTimer.current) clearTimeout(saveProfileTimer.current);
    saveProfileTimer.current = setTimeout(async () => {
      setProfileSaveStatus("saving");
      try {
        await fetch(`${BASE}/api/cosiri/assessments/${draftId}/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, [field]: value }),
        });
        setProfileSaveStatus("saved");
        setTimeout(() => setProfileSaveStatus("idle"), 2500);
      } catch {
        setProfileSaveStatus("idle");
      }
    }, 800);
  };

  const handleSubmit = async () => {
    if (!company || !draftId) return;
    try {
      const overallScore = Object.values(answers).reduce((a, b) => a + b, 0) / COSIRI_DATA.length;

      // Finalise the draft assessment
      await fetch(`${BASE}/api/cosiri/assessments/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", overallScore: Math.round(overallScore) }),
      });

      const answerPayload = Object.entries(answers).map(([dimensionId, score]) => ({
        assessmentId: draftId,
        dimensionId,
        score,
        notes: "",
      }));

      await saveAnswers({ id: draftId, data: answerPayload });
      setLocation(`/cosiri/results/${draftId}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppLayout>
      {/* Company & Site Profile */}
      <div className="mb-6 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setProfileOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-sm">Company & Site Profile</p>
              <p className="text-xs text-muted-foreground">Assessor details and site information for the report</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profileSaveStatus === "saving" && (
              <span className="text-xs text-muted-foreground animate-pulse">Saving…</span>
            )}
            {profileSaveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {profileOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {profileOpen && (
          <div className="px-6 pb-6 border-t border-border bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Site Name</label>
                <input
                  type="text"
                  value={profile.siteName ?? ""}
                  onChange={e => handleProfileChange("siteName", e.target.value)}
                  placeholder="e.g. Manchester Plant 1"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Location</label>
                <input
                  type="text"
                  value={profile.location ?? ""}
                  onChange={e => handleProfileChange("location", e.target.value)}
                  placeholder="e.g. Manchester, UK"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Industry Sub-Sector</label>
                <input
                  type="text"
                  value={profile.subSector ?? ""}
                  onChange={e => handleProfileChange("subSector", e.target.value)}
                  placeholder="e.g. Food & Beverage Manufacturing"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Employees (site)</label>
                <input
                  type="text"
                  value={profile.employeeCount ?? ""}
                  onChange={e => handleProfileChange("employeeCount", e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Production Area (m²)</label>
                <input
                  type="text"
                  value={profile.productionArea ?? ""}
                  onChange={e => handleProfileChange("productionArea", e.target.value)}
                  placeholder="e.g. 12,000 m²"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Assessment Version</label>
                <select
                  value={profile.cosiriVersion ?? "COSIRI-24"}
                  onChange={e => handleProfileChange("cosiriVersion", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                >
                  <option value="COSIRI-24">COSIRI-24 (24 Dimensions)</option>
                  <option value="COSIRI-10">COSIRI-10 (10 Dimensions)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Products Manufactured</label>
                <input
                  type="text"
                  value={profile.productsManufactured ?? ""}
                  onChange={e => handleProfileChange("productsManufactured", e.target.value)}
                  placeholder="e.g. Ready meals, frozen foods, dairy products"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Assessment Date</label>
                <input
                  type="date"
                  value={profile.assessmentDate ?? ""}
                  onChange={e => handleProfileChange("assessmentDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Certified COSIRI Assessor (CCA)</label>
                <input
                  type="text"
                  value={profile.assessorName ?? ""}
                  onChange={e => handleProfileChange("assessorName", e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Assessor Credentials</label>
                <input
                  type="text"
                  value={profile.assessorCredentials ?? ""}
                  onChange={e => handleProfileChange("assessorCredentials", e.target.value)}
                  placeholder="e.g. CCA Level 3, MBA"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Run Assessment</h1>
          <p className="text-muted-foreground">
            Select the maturity band for each dimension. Attach supporting evidence below each one.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
          {/* Live overall score */}
          {liveScore !== null && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Live Score</span>
              <span className={`text-2xl font-bold tabular-nums ${
                liveScore >= 4 ? "text-green-600" : liveScore >= 2 ? "text-blue-600" : "text-amber-500"
              }`}>
                {liveScore.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/5</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{progress}% Complete</span>
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {draftCreating && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3 animate-spin" /> Preparing session…
            </span>
          )}
          {draftId && !draftCreating && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Evidence attachments enabled
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <TooltipProvider delayDuration={300}>
          {BUILDING_BLOCKS.map(block => {
            const blockDims = COSIRI_DATA.filter(d => d.block === block);
            const answeredInBlock = blockDims.filter(d => answers[d.id] !== undefined).length;
            const isComplete = answeredInBlock === blockDims.length;
            const isActive = activeBlock === block;
            const avg = blockAvg(block);
            const cfg = BLOCK_CONFIG[block] ?? {
              bg: "bg-muted/40", activeBg: "bg-muted/60",
              border: "border-border", activeBorder: "border-primary",
              ring: "ring-primary/20", icon: "⬜", accent: "text-foreground",
              description: "", dimensions: "", covers: [],
            };

            return (
              <button
                key={block}
                onClick={() => setActiveBlock(block)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 shadow-sm ${
                  isActive
                    ? `${cfg.activeBg} ${cfg.activeBorder} ring-2 ${cfg.ring}`
                    : `${cfg.bg} ${cfg.border} hover:brightness-95`
                }`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                    <span className={`font-semibold text-sm leading-snug ${isActive ? cfg.accent : "text-foreground"}`}>{block}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {!isComplete && avg !== null && (
                      <span className={`text-xs font-bold ${avg >= 4 ? "text-green-600" : avg >= 2 ? "text-blue-600" : "text-amber-500"}`}>
                        {avg.toFixed(1)}
                      </span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                        <span className="cursor-help">
                          <Info className={`w-3.5 h-3.5 ${cfg.accent} opacity-50 hover:opacity-90 transition-opacity`} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={12}
                        className="bg-card text-card-foreground border border-border shadow-xl rounded-xl p-4 max-w-[270px] z-50"
                      >
                        <p className={`font-bold text-sm mb-1 ${cfg.accent}`}>{block}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cfg.dimensions}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{cfg.description}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1.5">Dimensions covered</p>
                        <ul className="space-y-1">
                          {cfg.covers.map(c => (
                            <li key={c} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className={`${cfg.accent} mt-0.5 shrink-0`}>✦</span>{c}
                            </li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">{answeredInBlock} / {blockDims.length} answered</span>
                  {avg !== null && (
                    <div className="w-16 h-1.5 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${avg >= 4 ? "bg-green-500" : avg >= 2 ? "bg-blue-500" : "bg-amber-400"}`}
                        style={{ width: `${(avg / 5) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          </TooltipProvider>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {dimensionsInBlock.map(dim => {
            const selectedScore = answers[dim.id];
            const isAnswered = selectedScore !== undefined;
            const selectedOpt = dim.options.find(o => o.score === selectedScore);

            return (
            <div
              key={dim.id}
              className={`bg-card rounded-2xl border shadow-sm p-6 transition-all ${
                isAnswered
                  ? `border-border ring-2 ${SCORE_RING[selectedScore]}`
                  : "border-border"
              }`}
            >
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{dim.pillar}</span>
                    <span className="text-xs font-mono text-muted-foreground">{dim.id}</span>
                  </div>

                  {/* Score badge — shown immediately when answer is selected */}
                  {isAnswered && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${SCORE_BADGE[selectedScore]}`}>
                      <span className="text-lg font-bold tabular-nums">{selectedScore}</span>
                      <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Score</span>
                        <span className="text-xs font-medium">{selectedOpt?.label}</span>
                      </div>
                      {/* Mini score bar */}
                      <div className="flex gap-0.5 ml-1">
                        {[0,1,2,3,4].map(i => (
                          <div
                            key={i}
                            className={`w-1.5 h-4 rounded-sm transition-all ${
                              i < selectedScore
                                ? selectedScore >= 4 ? "bg-green-500" : selectedScore >= 2 ? "bg-blue-500" : "bg-amber-400"
                                : "bg-current opacity-20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold">{dim.name}</h3>
                <p className="text-muted-foreground mt-1">{dim.question}</p>
              </div>

              {/* Band selection grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dim.options.map(opt => {
                  const isSelected = answers[dim.id] === opt.score;
                  const band = BAND_DESCRIPTIONS[opt.score];
                  const bc = BAND_CARD[opt.score];
                  return (
                    <button
                      key={opt.score}
                      onClick={() => handleAnswer(dim.id, opt.score)}
                      className={`text-left p-4 rounded-xl border border-l-4 transition-all ${bc.accent} ${
                        isSelected
                          ? `bg-background border-border ring-1 ${bc.ring}`
                          : "bg-background border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {opt.label}
                          </span>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                              <span className="cursor-help">
                                <Info className={`w-3.5 h-3.5 ${BAND_COLORS[opt.score]} opacity-70 hover:opacity-100 transition-opacity`} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-0 overflow-hidden"
                            >
                              <div className="px-4 pt-3 pb-2 border-b border-border bg-muted/40">
                                <p className="font-bold text-sm text-foreground">{opt.label} — {band.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{band.summary}</p>
                              </div>
                              <div className="px-4 py-3 space-y-2">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Criteria</p>
                                  <p className="text-xs text-foreground leading-snug">{band.criteria}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Evidence</p>
                                  <p className="text-xs text-foreground leading-snug">{band.evidence}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">This Dimension</p>
                                  <p className="text-xs text-foreground leading-snug">{opt.description}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">{opt.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Evidence attachment box — available once draft is created */}
              {draftId ? (
                <EvidenceBox
                  assessmentId={draftId}
                  dimensionId={dim.id}
                  dimensionName={dim.name}
                />
              ) : (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3 h-3 animate-spin" />
                    Evidence attachments will be available momentarily…
                  </p>
                </div>
              )}
            </div>
          ); })}


          {/* ── Pillar Navigation ── */}
          <div className="pt-6 border-t border-border flex items-center justify-between gap-4">

            {/* Previous */}
            {!isFirstBlock ? (
              <button
                type="button"
                onClick={() => goToBlock(currentBlockIdx - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 font-medium text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {/* Step dots */}
            <div className="flex items-center gap-2">
              {BUILDING_BLOCKS.map((block, i) => {
                const dims = COSIRI_DATA.filter(d => d.block === block);
                const done = dims.every(d => answers[d.id] !== undefined);
                const active = i === currentBlockIdx;
                return (
                  <button
                    key={block}
                    type="button"
                    onClick={() => goToBlock(i)}
                    title={block}
                    className={`rounded-full transition-all ${
                      active
                        ? "w-6 h-2.5 bg-primary"
                        : done
                        ? "w-2.5 h-2.5 bg-primary/40 hover:bg-primary/60"
                        : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground/40"
                    }`}
                  />
                );
              })}
            </div>

            {/* Next or Submit */}
            {!isLastBlock ? (
              <button
                type="button"
                onClick={() => goToBlock(currentBlockIdx + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={progress !== 100 || isCreating || isSaving || !draftId}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Saving..." : "Submit Assessment"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


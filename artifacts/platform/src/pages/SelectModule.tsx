import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Factory, CheckCircle2, ArrowRight, Building, LogOut } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const MODULES = [
  {
    key: "cosiri" as const,
    icon: Activity,
    label: "COSIRI",
    full: "Corporate Sustainability Industry Readiness Index",
    description: "24-dimension sustainability maturity scoring across strategy, operations, technology and governance. Generates AI-powered insights, star emblem ratings, and transformation roadmaps.",
    tags: ["24 Dimensions", "AI Insights", "Star Emblem", "Benchmarking"],
    cardBase: "bg-blue-50 border-blue-200 text-blue-700",
    cardHover: "hover:border-blue-400 hover:bg-blue-100/70",
    cardActive: "ring-2 ring-blue-500/30 border-blue-500 bg-blue-100/80",
    iconBg: "bg-blue-100 text-blue-600",
    activeIconBg: "bg-blue-600 text-white",
    tagColor: "bg-white/70 text-blue-700 border-blue-200",
    subText: "text-blue-500",
    checkColor: "text-blue-600",
  },
  {
    key: "gmp" as const,
    icon: ShieldCheck,
    label: "GMP",
    full: "Good Manufacturing Practice",
    description: "Checklist-based compliance audit tracker with findings management, CAPA workflows, audit trails, and regulatory reporting for manufacturing environments.",
    tags: ["Audit Checklists", "Findings & CAPA", "Reports", "Compliance"],
    cardBase: "bg-green-50 border-green-200 text-green-700",
    cardHover: "hover:border-green-400 hover:bg-green-100/70",
    cardActive: "ring-2 ring-green-500/30 border-green-500 bg-green-100/80",
    iconBg: "bg-green-100 text-green-600",
    activeIconBg: "bg-green-600 text-white",
    tagColor: "bg-white/70 text-green-700 border-green-200",
    subText: "text-green-500",
    checkColor: "text-green-600",
  },
  {
    key: "both" as const,
    icon: Factory,
    label: "Full Platform",
    full: "COSIRI + GMP Combined",
    description: "Access both COSIRI sustainability scoring and GMP compliance auditing in a unified workspace. Shared company profile, cross-module reporting, and a single sign-on experience.",
    tags: ["COSIRI + GMP", "Unified Workspace", "All Features", "Best Value"],
    cardBase: "bg-purple-50 border-purple-200 text-purple-700",
    cardHover: "hover:border-purple-400 hover:bg-purple-100/70",
    cardActive: "ring-2 ring-purple-500/30 border-purple-500 bg-purple-100/80",
    iconBg: "bg-purple-100 text-purple-600",
    activeIconBg: "bg-purple-600 text-white",
    tagColor: "bg-white/70 text-purple-700 border-purple-200",
    subText: "text-purple-500",
    checkColor: "text-purple-600",
  },
];

export default function SelectModule() {
  const [, setLocation] = useLocation();
  const { company, updateModules, logout } = useCompany();
  const [selected, setSelected] = useState<"cosiri" | "gmp" | "both" | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selected || !company) return;
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/companies/${company.id}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: selected }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Failed to save selection. Please try again.");
        return;
      }
      updateModules(selected);
      setLocation("/hub");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-slate-100/50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Building className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">SustainPro</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sustainability & Compliance</p>
          </div>
        </div>
        {company && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{company.name}</span>
            </span>
            <button
              onClick={() => { void logout(); setLocation("/login"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Step 1 of 1</p>
            <h1 className="text-4xl font-display font-bold text-foreground mb-3">
              Choose your assessment module
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Select the tool that fits your organisation's needs. You can always contact support to change this later.
            </p>
          </div>

          {/* Module cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              const isSelected = selected === mod.key;
              return (
                <motion.button
                  key={mod.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(mod.key)}
                  className={`relative text-left p-6 rounded-2xl border transition-all duration-200 ${mod.cardBase} ${
                    isSelected ? mod.cardActive : mod.cardHover
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className={`w-5 h-5 ${mod.checkColor}`} />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isSelected ? mod.activeIconBg : mod.iconBg
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold mb-0.5">{mod.label}</h2>
                  <p className={`text-xs mb-3 font-medium opacity-70`}>{mod.full}</p>
                  <p className="text-sm opacity-75 leading-relaxed mb-4">{mod.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${mod.tagColor}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {/* Confirm button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={selected ? { y: -1 } : {}}
              whileTap={selected ? { scale: 0.98 } : {}}
              onClick={handleConfirm}
              disabled={!selected || isPending}
              className="px-10 py-4 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-base"
            >
              {isPending
                ? "Setting up your workspace…"
                : selected
                  ? `Continue with ${MODULES.find(m => m.key === selected)?.label}`
                  : "Select a module to continue"}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}



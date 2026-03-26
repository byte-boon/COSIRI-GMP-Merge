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
    color: "from-violet-600/10 to-violet-500/5 border-violet-200 hover:border-violet-400",
    activeColor: "from-violet-600/15 to-violet-500/10 border-violet-500 ring-2 ring-violet-500/20",
    iconBg: "bg-violet-100 text-violet-600",
    activeIconBg: "bg-violet-600 text-white",
    tagColor: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    key: "gmp" as const,
    icon: ShieldCheck,
    label: "GMP",
    full: "Good Manufacturing Practice",
    description: "Checklist-based compliance audit tracker with findings management, CAPA workflows, audit trails, and regulatory reporting for manufacturing environments.",
    tags: ["Audit Checklists", "Findings & CAPA", "Reports", "Compliance"],
    color: "from-emerald-600/10 to-emerald-500/5 border-emerald-200 hover:border-emerald-400",
    activeColor: "from-emerald-600/15 to-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20",
    iconBg: "bg-emerald-100 text-emerald-600",
    activeIconBg: "bg-emerald-600 text-white",
    tagColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    key: "both" as const,
    icon: Factory,
    label: "Full Platform",
    full: "COSIRI + GMP Combined",
    description: "Access both COSIRI sustainability scoring and GMP compliance auditing in a unified workspace. Shared company profile, cross-module reporting, and a single sign-on experience.",
    tags: ["COSIRI + GMP", "Unified Workspace", "All Features", "Best Value"],
    color: "from-blue-600/10 to-sky-500/5 border-blue-200 hover:border-blue-400",
    activeColor: "from-blue-600/15 to-sky-500/10 border-blue-500 ring-2 ring-blue-500/20",
    iconBg: "bg-blue-100 text-blue-600",
    activeIconBg: "bg-blue-600 text-white",
    tagColor: "bg-blue-50 text-blue-600 border-blue-100",
  },
];

export default function SelectModule() {
  const [, setLocation] = useLocation();
  const { company, sessionToken, updateModules, logout } = useCompany();
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
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { "x-session-token": sessionToken } : {}),
        },
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
            <p className="text-sm font-bold text-foreground leading-tight">Nexus Platform</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sustainability & Compliance</p>
          </div>
        </div>
        {company && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{company.name}</span>
            </span>
            <button
              onClick={() => { logout(); setLocation("/login"); }}
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
                  className={`relative text-left p-6 rounded-2xl border bg-gradient-to-br transition-all duration-200 ${
                    isSelected ? mod.activeColor : mod.color
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isSelected ? mod.activeIconBg : mod.iconBg
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-0.5">{mod.label}</h2>
                  <p className="text-xs text-muted-foreground mb-3 font-medium">{mod.full}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mod.description}</p>
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

import { useState } from "react";
import { X, AlertTriangle, ShieldAlert, Info, Send, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Severity rules derived from GMP score ────────────────────────────────────
export function scoreToSeverity(score: number): "critical" | "major" | "minor" {
  if (score <= 1) return "critical";
  if (score <= 2) return "major";
  return "minor";
}

export function scoreRequiresCapa(score: number) {
  return score !== null && score <= 2;
}

const SEVERITY_CONFIG = {
  critical: { label: "Critical",  bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    icon: <ShieldAlert className="w-4 h-4 text-red-500" />,     rule: "Score 1 — Not Present. Immediate corrective action required." },
  major:    { label: "Major",     bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", icon: <AlertTriangle className="w-4 h-4 text-orange-500" />, rule: "Score 2 — Initial. Corrective action plan must be established." },
  minor:    { label: "Minor",     bg: "bg-blue-50",   border: "border-blue-300",   text: "text-blue-700",   icon: <Info className="w-4 h-4 text-blue-500" />,           rule: "Score 3 — Developing. Improvement opportunity noted." },
};

const FINDING_TYPES = [
  { value: "noncompliance",            label: "Non-compliance"             },
  { value: "observation",              label: "Observation"                },
  { value: "improvement_opportunity",  label: "Improvement Opportunity"    },
];

interface Props {
  assessmentId: number;
  itemId: string;
  itemLabel: string;
  score: number;
  onClose: () => void;
}

export default function RaiseCapaModal({ assessmentId, itemId, itemLabel, score, onClose }: Props) {
  const defaultSeverity = scoreToSeverity(score);
  const sevCfg = SEVERITY_CONFIG[defaultSeverity];

  const [severity, setSeverity] = useState<"critical" | "major" | "minor">(defaultSeverity);
  const [type, setType] = useState(score <= 2 ? "noncompliance" : "observation");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);

  const qc = useQueryClient();

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/gmp/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, itemId, type, severity, description }),
      });
      if (!res.ok) throw new Error("Failed to create finding");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listGmpFindings"] });
      setDone(true);
    },
  });

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Finding Raised</h3>
          <p className="text-sm text-muted-foreground mb-1">
            A <span className="font-semibold capitalize">{severity}</span> finding has been logged for <span className="font-mono font-semibold">{itemId}</span>.
          </p>
          <p className="text-xs text-muted-foreground mb-6">It is now tracked in the Findings & CAPA log.</p>
          <button onClick={onClose} className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            {sevCfg.icon}
            <div>
              <h2 className="font-bold text-base text-foreground">Raise CAPA Finding</h2>
              <p className="text-xs text-muted-foreground font-mono">{itemId} — {itemLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CAPA rule banner */}
        <div className={`mx-6 mt-5 px-4 py-3 rounded-xl border ${sevCfg.bg} ${sevCfg.border} flex items-start gap-2.5`}>
          <span className="mt-0.5 shrink-0">{sevCfg.icon}</span>
          <div>
            <p className={`text-xs font-bold ${sevCfg.text}`}>CAPA Rule — {SEVERITY_CONFIG[severity].label} Finding</p>
            <p className={`text-xs ${sevCfg.text} opacity-80`}>{SEVERITY_CONFIG[severity].rule}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Severity selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["critical", "major", "minor"] as const).map(s => {
                const cfg = SEVERITY_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      severity === s
                        ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm`
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Finding Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {FINDING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the non-conformance, root cause, and the corrective or preventive action required…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => submit()}
            disabled={!description.trim() || isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isPending ? "Logging…" : "Log Finding"}
          </button>
        </div>
      </div>
    </div>
  );
}

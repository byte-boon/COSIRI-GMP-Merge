import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  ShieldCheck, 
  LogOut,
  Activity,
  AlertTriangle,
  BarChart3,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const [location] = useLocation();
  const { company, logout } = useCompany();

  if (!company) return null;

  // Always show both modules in the sidebar — the sidebar is the unified nav for all modules

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0 z-20 transition-all shadow-xl">
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border bg-white/95">
        <img
          src={`${import.meta.env.BASE_URL}images/logo.png`}
          alt="SustainPro"
          className="h-10 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
        
        {/* Main Hub */}
        <div>
          <Link 
            href="/hub" 
            className={cn(
              "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
              location === "/hub" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <LayoutDashboard className={cn("w-5 h-5 mr-3 opacity-70 group-hover:opacity-100", location === "/hub" && "opacity-100")} />
            Platform Hub
          </Link>
        </div>

        {/* COSIRI Module */}
        <div>
          <div className="flex items-center px-3 mb-3">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1.5 group cursor-default">
                    <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">COSIRI</p>
                    <Info className="w-3 h-3 text-sidebar-foreground/25 group-hover:text-primary/60 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="bg-card text-card-foreground border border-border shadow-xl rounded-xl p-4 max-w-[280px] z-50"
                >
                  <p className="font-bold text-sm text-foreground mb-0.5">Consumer Sustainability Industry Readiness Index</p>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">COSIRI</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    A 24-dimension maturity framework that benchmarks an organisation's sustainability performance across Strategy &amp; Risk, Business Processes, Technology, and Governance — scored on a Band 0–5 scale.
                  </p>
                  <div className="space-y-1 mb-3 text-xs">
                    <p><span className="font-semibold text-foreground">Developed by:</span> <span className="text-muted-foreground">EY &amp; industry partners</span></p>
                    <p><span className="font-semibold text-foreground">Launched:</span> <span className="text-muted-foreground">2020</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1.5">Benefits for organisations</p>
                    <ul className="space-y-1">
                      {["Structured maturity benchmark (Band 0–5)", "AI-generated gap analysis & roadmaps", "Industry peer benchmarking", "ESG readiness & reporting alignment", "Evidence-based investment prioritisation"].map(b => (
                        <li key={b} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5 shrink-0">✦</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <Link href="/cosiri" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location === "/cosiri" ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <Activity className="w-4 h-4 mr-3 opacity-70" /> Dashboard
            </Link>
            <Link href="/cosiri/assessment" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location === "/cosiri/assessment" ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <ClipboardCheck className="w-4 h-4 mr-3 opacity-70" /> Audits
            </Link>
            <Link href="/cosiri/reports" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location.startsWith("/cosiri/report") ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <BarChart3 className="w-4 h-4 mr-3 opacity-70" /> Findings & Reports
            </Link>
          </div>
        </div>

        {/* GMP Module */}
        <div>
          <div className="flex items-center px-3 mb-3">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1.5 group cursor-default">
                    <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">GMP</p>
                    <Info className="w-3 h-3 text-sidebar-foreground/25 group-hover:text-blue-400/70 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="bg-card text-card-foreground border border-border shadow-xl rounded-xl p-4 max-w-[280px] z-50"
                >
                  <p className="font-bold text-sm text-foreground mb-0.5">Good Manufacturing Practices</p>
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-3">GMP</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    A globally recognised system of regulations and standards ensuring products are consistently produced and controlled to quality standards that minimise risks of contamination, mix-ups, and errors throughout manufacturing.
                  </p>
                  <div className="space-y-1 mb-3 text-xs">
                    <p><span className="font-semibold text-foreground">Developed by:</span> <span className="text-muted-foreground">US FDA; adopted by WHO, EMA &amp; global regulators</span></p>
                    <p><span className="font-semibold text-foreground">Origin:</span> <span className="text-muted-foreground">1963 (US federal GMP regulations)</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1.5">Benefits for organisations</p>
                    <ul className="space-y-1">
                      {["Regulatory compliance & audit readiness", "Systematic findings & CAPA tracking", "Risk mitigation across manufacturing", "Consumer safety assurance", "Licence to operate in regulated markets"].map(b => (
                        <li key={b} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-blue-500 mt-0.5 shrink-0">✦</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <Link href="/gmp" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location === "/gmp" ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <ShieldCheck className="w-4 h-4 mr-3 opacity-70" /> Dashboard
            </Link>
            <Link href="/gmp/assessments" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location.startsWith("/gmp/assessments") ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <ClipboardCheck className="w-4 h-4 mr-3 opacity-70" /> Audits
            </Link>
            <Link href="/gmp/findings" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location === "/gmp/findings" ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <AlertTriangle className="w-4 h-4 mr-3 opacity-70" /> Findings & CAPA
            </Link>
            <Link href="/gmp/reports" className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
              location === "/gmp/reports" ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            )}>
              <BarChart3 className="w-4 h-4 mr-3 opacity-70" /> Reports
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {company.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{company.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{company.industry}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            window.location.href = import.meta.env.BASE_URL;
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 border border-sidebar-border hover:border-destructive/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  ShieldCheck, 
  LogOut,
  Building,
  Activity,
  FileText,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";

export function Sidebar() {
  const [location] = useLocation();
  const { company, logout } = useCompany();

  if (!company) return null;

  const showCosiri = company.modules === "cosiri" || company.modules === "both";
  const showGmp = company.modules === "gmp" || company.modules === "both";

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0 z-20 transition-all shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-accent/50">
        <Building className="w-6 h-6 text-primary mr-3" />
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight">Hub</h1>
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{company.name}</p>
        </div>
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
        {showCosiri && (
          <div>
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-3">COSIRI</p>
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
                <ClipboardCheck className="w-4 h-4 mr-3 opacity-70" /> Assessment
              </Link>
              <Link href="/cosiri/reports" className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm transition-all group",
                location.startsWith("/cosiri/report") ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              )}>
                <FileText className="w-4 h-4 mr-3 opacity-70" /> Reports
              </Link>
            </div>
          </div>
        )}

        {/* GMP Module */}
        {showGmp && (
          <div>
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-3">GMP</p>
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
        )}
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

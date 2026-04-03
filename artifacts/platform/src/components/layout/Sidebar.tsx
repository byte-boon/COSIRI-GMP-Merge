import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  LogOut,
  MoreHorizontal,
  Leaf,
  MapPin,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function NavItem({
  href,
  icon,
  label,
  badge,
  badgeColor = "green",
  isActive,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: "green" | "amber";
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 py-2 pr-3 text-sm transition-all rounded-r-sm border-l-2",
        isActive
          ? "border-emerald-500 pl-[10px] text-emerald-400 bg-emerald-500/10 font-medium"
          : "border-transparent pl-[10px] text-sidebar-foreground/55 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90"
      )}
    >
      <span className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-400" : "opacity-55")}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none",
          badgeColor === "green"
            ? "bg-emerald-500 text-black"
            : "bg-amber-500 text-black"
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label, color = "emerald" }: { label: string; color?: "emerald" | "amber" }) {
  return (
    <div className="flex items-center gap-2 px-3 mb-1 mt-1">
      <div className={`w-[3px] h-4 rounded-full shrink-0 ${color === "amber" ? "bg-amber-500" : "bg-emerald-500"}`} />
      <span className={`text-[11px] font-bold uppercase tracking-widest ${color === "amber" ? "text-amber-500/80" : "text-emerald-500/80"}`}>{label}</span>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const [location] = useLocation();
  const { company, logout } = useCompany();

  const { data: gmpFindings = [] } = useQuery<any[]>({
    queryKey: ["gmp-findings-sidebar", company?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/gmp/findings`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!company?.id,
  });
  const openGmpFindings = gmpFindings.filter((f: any) => f.status === "open").length;

  const { data: cosiriAssessments = [] } = useQuery<any[]>({
    queryKey: ["cosiri-assessments-sidebar", company?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/cosiri/assessments`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!company?.id,
  });
  const completedCosiri = cosiriAssessments.filter((a: any) => a.status === "completed").length;

  if (!company) return null;

  const initials = company.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav = onClose;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl transition-transform duration-300 print:hidden",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* ── Logo ── */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
          <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-base text-white tracking-tight flex-1">SustainPro</p>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 py-4 overflow-y-auto">

          {/* Platform Hub */}
          <div className="px-3 mb-4">
            <Link
              href="/hub"
              onClick={nav}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                location === "/hub"
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90"
              )}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 opacity-70" />
              Platform Hub
            </Link>
          </div>

          {/* COSIRI */}
          <div className="mb-4">
            <SectionLabel label="COSIRI" />
            <div className="space-y-0.5 mt-2 pl-3 pr-3">
              <NavItem href="/cosiri"           icon={<TrendingUp  className="w-4 h-4" />} label="Dashboard"          isActive={location === "/cosiri"} onNavigate={nav} />
              <NavItem href="/cosiri/assessment" icon={<FileText    className="w-4 h-4" />} label="Audits"             isActive={location === "/cosiri/assessment" || location.startsWith("/cosiri/assessment")} onNavigate={nav} />
              <NavItem
                href="/cosiri/reports"
                icon={<BarChart3 className="w-4 h-4" />}
                label="Findings & Reports"
                badge={completedCosiri > 0 ? completedCosiri : undefined}
                badgeColor="green"
                isActive={location.startsWith("/cosiri/report")}
                onNavigate={nav}
              />
              <NavItem
                href="/cosiri/roadmaps"
                icon={<MapPin className="w-4 h-4" />}
                label="Improvement Roadmap"
                isActive={location.startsWith("/cosiri/roadmap")}
                onNavigate={nav}
              />
            </div>
          </div>

          {/* GMP */}
          <div className="mb-4">
            <SectionLabel label="GMP" color="amber" />
            <div className="space-y-0.5 mt-2 pl-3 pr-3">
              <NavItem href="/gmp"             icon={<TrendingUp    className="w-4 h-4" />} label="Dashboard"      isActive={location === "/gmp"} onNavigate={nav} />
              <NavItem href="/gmp/assessments" icon={<FileText      className="w-4 h-4" />} label="Audits"         isActive={location.startsWith("/gmp/assessments")} onNavigate={nav} />
              <NavItem
                href="/gmp/findings"
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Findings & CAPA"
                badge={openGmpFindings > 0 ? openGmpFindings : undefined}
                badgeColor="amber"
                isActive={location === "/gmp/findings"}
                onNavigate={nav}
              />
              <NavItem href="/gmp/reports" icon={<BarChart3 className="w-4 h-4" />} label="Reports" isActive={location === "/gmp/reports"} onNavigate={nav} />
            </div>
          </div>

        </nav>

        {/* ── Bottom ── */}
        <div className="border-t border-sidebar-border shrink-0">

          {/* Help & Support */}
          <div className="px-3 pt-3 pb-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/80 transition-all">
              <HelpCircle className="w-4 h-4 shrink-0" />
              Help &amp; Support
            </button>
          </div>

          {/* User card */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{company.name}</p>
                <p className="text-[11px] text-sidebar-foreground/45 truncate leading-tight">{company.industry}</p>
              </div>
              <button className="shrink-0 p-1 rounded text-sidebar-foreground/30 hover:text-sidebar-foreground/70 transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sign out */}
          <div className="px-3 pb-3">
            <button
              onClick={async () => {
                await logout();
                window.location.href = `${BASE}/login`;
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}


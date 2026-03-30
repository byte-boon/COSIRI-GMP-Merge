import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Building, Activity, ShieldCheck, LayoutGrid, ArrowRight, ChevronDown, Eye, EyeOff, Lock, LogOut } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const INDUSTRIES = [
  "Aerospace & Defence", "Agriculture & Food Production", "Apparel & Fashion",
  "Architecture & Engineering", "Automotive", "Aviation & Airlines",
  "Banking & Capital Markets", "Biotechnology", "Building Materials",
  "Chemicals & Materials", "Construction & Real Estate", "Consumer Goods & Retail",
  "Cosmetics & Personal Care", "Defence & Security", "E-Commerce", "Education",
  "Electronics & Semiconductors", "Energy & Utilities", "Environmental Services",
  "Financial Services & Insurance", "Food & Beverage", "Forestry & Paper",
  "Free Economic Zone", "Gaming & Esports", "Healthcare & Pharmaceuticals",
  "Hospitality & Tourism", "Information Technology & Software",
  "Infrastructure & Civil Engineering", "Legal Services", "Logistics & Transportation",
  "Luxury Goods", "Manufacturing", "Maritime & Shipping", "Media & Entertainment",
  "Mining & Resources", "Non-Profit & NGO", "Oil & Gas", "Packaging",
  "Petrochemicals & Refining", "Port & Terminal Operations",
  "Power Generation & Renewables", "Professional Services",
  "Public Sector & Government", "Rail & Mass Transit", "Research & Development",
  "Sports & Recreation", "Telecommunications", "Textiles", "Trade & Export",
  "Waste Management & Recycling", "Water Treatment & Management", "Other",
];

const formSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().min(2, "Industry is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Registration() {
  const [, setLocation] = useLocation();
  const { setAuth, company, logout } = useCompany();
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", industry: "", email: "", password: "", confirmPassword: "" }
  });

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setIsPending(true);
    try {
      const res = await fetch(`${BASE}/api/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          industry: data.industry,
          email: data.email,
          password: data.password,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setApiError(body.error || "Registration failed. Please try again.");
        return;
      }
      setAuth(body.company, body.sessionToken);
      setLocation("/select-module");
    } catch (error) {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-[460px] shrink-0 relative bg-sidebar overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-sidebar to-sidebar/95 z-10 pointer-events-none" />
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="relative z-20 flex flex-col h-full px-10 py-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-sidebar-foreground leading-tight">SustainPro</h1>
              <p className="text-[11px] text-sidebar-foreground/50 uppercase tracking-widest">Sustainability & Compliance</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-2xl font-display font-bold text-sidebar-foreground mb-2">One workspace.</p>
            <p className="text-2xl font-display font-bold text-sidebar-foreground/60 mb-8">All your compliance tools.</p>
            <div className="space-y-5">
              {[
                { icon: Activity, title: "COSIRI Assessment", desc: "24-dimension sustainability maturity scoring with AI-powered insights, star emblem ratings, and transformation roadmaps." },
                { icon: ShieldCheck, title: "GMP Audit Tracker", desc: "Checklist-based compliance audits with findings, CAPA management, and full audit trails." },
                { icon: LayoutGrid, title: "AI Improvement Roadmap", desc: "AI-generated phased plans with resource estimates, KPI tracking, and progress monitoring." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground mb-0.5">{title}</p>
                    <p className="text-xs text-sidebar-foreground/50 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-sidebar-foreground/30 leading-relaxed mt-8">
            Unified sustainability scoring and compliance management for enterprise operations.
          </p>
        </div>
      </div>

      {/* Right panel — registration form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {company && (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Already signed in</p>
              <p className="text-xs text-muted-foreground mb-3">You are signed in as <span className="font-medium text-foreground">{company.name}</span>.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocation("/hub")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  Go to dashboard
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">Create Workspace</h2>
            <p className="text-muted-foreground">Register your organisation to get started</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {apiError}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Organisation Name</label>
              <input
                {...form.register("name")}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="Acme Corp"
              />
              {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Industry</label>
              <div className="relative">
                <select
                  {...form.register("industry")}
                  defaultValue=""
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none text-foreground pr-10 cursor-pointer"
                >
                  <option value="" disabled className="text-muted-foreground">Select your industry…</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {form.formState.errors.industry && <p className="text-destructive text-xs mt-1">{form.formState.errors.industry.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Admin Email</label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="admin@acme.com"
              />
              {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-destructive text-xs mt-1">{form.formState.errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...form.register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && <p className="text-destructive text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-4 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? "Creating workspace…" : "Create Workspace"}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have a workspace?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

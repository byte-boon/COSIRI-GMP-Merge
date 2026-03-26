import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Building, ShieldCheck, Activity, ArrowRight, Factory, CheckCircle2, ChevronDown, Eye, EyeOff, Lock } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const INDUSTRIES = [
  "Aerospace & Defence",
  "Agriculture & Food Production",
  "Apparel & Fashion",
  "Architecture & Engineering",
  "Automotive",
  "Aviation & Airlines",
  "Banking & Capital Markets",
  "Biotechnology",
  "Building Materials",
  "Chemicals & Materials",
  "Construction & Real Estate",
  "Consumer Goods & Retail",
  "Cosmetics & Personal Care",
  "Defence & Security",
  "E-Commerce",
  "Education",
  "Electronics & Semiconductors",
  "Energy & Utilities",
  "Environmental Services",
  "Financial Services & Insurance",
  "Food & Beverage",
  "Forestry & Paper",
  "Free Economic Zone",
  "Gaming & Esports",
  "Healthcare & Pharmaceuticals",
  "Hospitality & Tourism",
  "Information Technology & Software",
  "Infrastructure & Civil Engineering",
  "Legal Services",
  "Logistics & Transportation",
  "Luxury Goods",
  "Manufacturing",
  "Maritime & Shipping",
  "Media & Entertainment",
  "Mining & Resources",
  "Non-Profit & NGO",
  "Oil & Gas",
  "Packaging",
  "Petrochemicals & Refining",
  "Port & Terminal Operations",
  "Power Generation & Renewables",
  "Professional Services",
  "Public Sector & Government",
  "Rail & Mass Transit",
  "Research & Development",
  "Sports & Recreation",
  "Telecommunications",
  "Textiles",
  "Trade & Export",
  "Waste Management & Recycling",
  "Water Treatment & Management",
  "Other",
];

const formSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().min(2, "Industry is required"),
  email: z.string().email("Valid email is required"),
  modules: z.enum(["cosiri", "gmp", "both"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const MODULES = [
  {
    key: "cosiri" as const,
    icon: Activity,
    label: "COSIRI",
    description: "Consumer Sustainability Industry Readiness Index — 24-dimension maturity scoring across strategy, operations, technology and governance.",
  },
  {
    key: "gmp" as const,
    icon: ShieldCheck,
    label: "GMP",
    description: "Good Manufacturing Practice audit tracker — checklist-based compliance audits with findings and CAPA management.",
  },
  {
    key: "both" as const,
    icon: Factory,
    label: "Full Platform",
    description: "Access both COSIRI and GMP modules in a unified workspace with shared company context.",
  },
];

export default function Registration() {
  const [, setLocation] = useLocation();
  const { setAuth } = useCompany();
  const [selectedModule, setSelectedModule] = useState<"cosiri" | "gmp" | "both" | null>(null);
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
          modules: data.modules,
          password: data.password,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setApiError(body.error || "Registration failed. Please try again.");
        return;
      }
      setAuth(body.company, body.sessionToken);
      setLocation("/hub");
    } catch (error) {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left panel — branding + module selection */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative bg-sidebar overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-sidebar to-sidebar/95 z-10 pointer-events-none" />
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />

        <div className="relative z-20 flex flex-col h-full px-10 py-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-sidebar-foreground leading-tight">Nexus Platform</h1>
              <p className="text-[11px] text-sidebar-foreground/50 uppercase tracking-widest">Sustainability & Compliance</p>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-5">Select Your Module</p>
            <div className="space-y-3">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedModule === mod.key;
                return (
                  <motion.button
                    key={mod.key}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedModule(mod.key); form.setValue("modules", mod.key); }}
                    className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-sidebar-border bg-sidebar-accent/20 hover:bg-sidebar-accent/40 hover:border-sidebar-border/80"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary" : "bg-sidebar-accent/60"}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-sidebar-foreground/60"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold text-sm ${isSelected ? "text-sidebar-foreground" : "text-sidebar-foreground/80"}`}>{mod.label}</h3>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-sidebar-foreground/50 leading-relaxed">{mod.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {form.formState.errors.modules && (
              <p className="text-destructive text-xs mt-3">{form.formState.errors.modules.message}</p>
            )}
          </div>

          <div className="mt-8">
            <p className="text-xs text-sidebar-foreground/30 leading-relaxed">
              Unified sustainability scoring and compliance management for enterprise operations.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — registration form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">Create Workspace</h2>
            <p className="text-muted-foreground">Register your organisation to get started</p>
          </div>

          {/* Mobile-only module selector */}
          <div className="lg:hidden mb-6">
            <label className="text-sm font-medium mb-3 block text-foreground">Select Module</label>
            <div className="grid grid-cols-1 gap-2">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedModule === mod.key;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => { setSelectedModule(mod.key); form.setValue("modules", mod.key); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium text-sm">{mod.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                    </div>
                  </button>
                );
              })}
            </div>
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

            {selectedModule && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/8 border border-primary/20 text-sm text-primary font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Module selected: {MODULES.find(m => m.key === selectedModule)?.label}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isPending || !selectedModule}
              className="w-full mt-2 py-4 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? "Setting up workspace…" : "Create Workspace"}
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

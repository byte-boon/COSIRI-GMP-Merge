import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, LogOut } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { setAuth, company, logout } = useCompany();
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setIsPending(true);
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setApiError(body.error || "Login failed. Please check your credentials.");
        return;
      }
      setAuth(body.company, body.sessionToken);
      const destination = (!body.company.modules || body.company.modules === "not_selected")
        ? "/select-module"
        : "/hub";
      setLocation(destination);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative bg-sidebar overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-sidebar to-sidebar/95 z-10 pointer-events-none" />
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="relative z-20 flex flex-col h-full px-10 py-10">
          <div className="mb-12">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="SustainPro"
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-6">
              {[
                { title: "COSIRI Assessment", desc: "24-dimension sustainability maturity scoring with AI-powered insights and evidence management." },
                { title: "GMP Audit Tracker", desc: "Checklist-based compliance audits with findings, CAPA management, and audit trails." },
                { title: "AI Improvement Roadmap", desc: "AI-generated transformation plans with phased timelines, resource estimates, and KPI tracking." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-primary/40 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground mb-0.5">{item.title}</p>
                    <p className="text-xs text-sidebar-foreground/50 leading-relaxed">{item.desc}</p>
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

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Already signed in banner */}
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
                  onClick={() => { logout(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </div>
          )}

          <div className="mb-10">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your organisation's workspace</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {apiError}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...form.register("email")}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="admin@acme.com"
                />
              </div>
              {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Your password"
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-4 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? "Signing in…" : "Sign in"}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to the platform?{" "}
            <Link href="/" className="text-primary font-medium hover:underline">Create a workspace</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

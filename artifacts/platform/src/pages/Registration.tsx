import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Building, Factory, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreateCompany } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().min(2, "Industry is required"),
  email: z.string().email("Valid email is required"),
  modules: z.enum(["cosiri", "gmp", "both"])
});

type FormValues = z.infer<typeof formSchema>;

export default function Registration() {
  const [, setLocation] = useLocation();
  const { setCompany } = useCompany();
  const { mutateAsync: createCompany, isPending } = useCreateCompany();
  const [selectedModule, setSelectedModule] = useState<"cosiri" | "gmp" | "both" | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", industry: "", email: "" }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await createCompany({ data });
      setCompany(result);
      setLocation("/hub");
    } catch (error) {
      console.error("Failed to register", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side - Image */}
      <div className="hidden lg:flex w-1/2 relative bg-sidebar overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-sidebar z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Corporate abstract background"
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold">Nexus Platform</h1>
          </div>
          <p className="text-xl font-light text-sidebar-foreground/80 leading-relaxed max-w-lg">
            Unified sustainability and compliance management for modern enterprise operations.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">Create Workspace</h2>
            <p className="text-muted-foreground">Register your organization to get started</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Organization Name</label>
                <input 
                  {...form.register("name")}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Acme Corp"
                />
                {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Industry</label>
                <input 
                  {...form.register("industry")}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Manufacturing, Tech, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Admin Email</label>
                <input 
                  {...form.register("email")}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="admin@acme.com"
                />
              </div>
            </div>

            <div className="pt-4">
              <label className="text-sm font-medium mb-3 block text-foreground">Select Modules</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedModule("cosiri"); form.setValue("modules", "cosiri"); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedModule === "cosiri" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"}`}
                >
                  <Activity className={`w-6 h-6 mb-2 ${selectedModule === "cosiri" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-foreground">COSIRI</h3>
                  <p className="text-xs text-muted-foreground mt-1">Sustainability Index</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedModule("gmp"); form.setValue("modules", "gmp"); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedModule === "gmp" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"}`}
                >
                  <ShieldCheck className={`w-6 h-6 mb-2 ${selectedModule === "gmp" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-foreground">GMP</h3>
                  <p className="text-xs text-muted-foreground mt-1">Good Manufacturing</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedModule("both"); form.setValue("modules", "both"); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all sm:col-span-2 ${selectedModule === "both" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"}`}
                >
                  <Factory className={`w-6 h-6 mb-2 ${selectedModule === "both" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-foreground">Full Platform</h3>
                  <p className="text-xs text-muted-foreground mt-1">Access to both COSIRI and GMP modules</p>
                </button>
              </div>
              {form.formState.errors.modules && <p className="text-destructive text-xs mt-2">{form.formState.errors.modules.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending || !selectedModule}
              className="w-full mt-8 py-4 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? "Setting up workspace..." : "Continue to Hub"}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

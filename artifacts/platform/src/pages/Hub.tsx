import { Link } from "wouter";
import { Activity, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Hub() {
  const { company } = useCompany();
  if (!company) return null;

  const showCosiri = company.modules === "cosiri" || company.modules === "both";
  const showGmp = company.modules === "gmp" || company.modules === "both";

  return (
    <AppLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-foreground">Welcome to Nexus, {company.name}</h1>
        <p className="text-lg text-muted-foreground mt-2">Access your organization's sustainability and compliance tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showCosiri && (
          <Link href="/cosiri" className="block group">
            <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-card to-card border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                COSIRI Index
                <ExternalLink className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-muted-foreground mb-8">
                Evaluate and benchmark your organization's sustainability maturity across 24 dimensions. Generate AI-driven roadmaps and gap analyses.
              </p>
              
              <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                Enter Module <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>
        )}

        {showGmp && (
          <Link href="/gmp" className="block group">
            <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-card to-card border border-border shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                GMP Compliance
                <ExternalLink className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-muted-foreground mb-8">
                Track Good Manufacturing Practices audits, manage findings, and monitor CAPA (Corrective and Preventive Actions) resolutions.
              </p>
              
              <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                Enter Module <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>
        )}
      </div>
    </AppLayout>
  );
}

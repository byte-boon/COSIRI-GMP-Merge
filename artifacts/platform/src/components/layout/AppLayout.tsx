import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useCompany } from "@/contexts/CompanyContext";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { Menu, Leaf } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { company, isLoading } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!company) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-10 h-14 bg-sidebar border-b border-sidebar-border flex items-center gap-3 px-4 print:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-emerald-500 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">SustainPro</span>
        </div>
      </header>

      <main className="md:pl-64 print:pl-0 w-full min-h-screen pt-14 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="container mx-auto p-4 md:p-8 max-w-7xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

import { Sidebar } from "./Sidebar";
import { useCompany } from "@/contexts/CompanyContext";
import { Redirect } from "wouter";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { company, isLoading } = useCompany();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!company) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="pl-64 print:pl-0 w-full min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="container mx-auto p-8 max-w-7xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

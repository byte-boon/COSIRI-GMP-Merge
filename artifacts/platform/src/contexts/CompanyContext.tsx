import React, { createContext, useContext, useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface Company {
  id: number;
  name: string;
  displayName?: string | null;
  username?: string | null;
  industry: string;
  email?: string | null;
  modules: string;
  billingPlan?: string;
  billingStatus?: string;
  trialEndsAt?: string | null;
  createdAt: string;
}

type CompanyContextType = {
  company: Company | null;
  setAuth: (company: Company) => void;
  updateModules: (modules: string) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const response = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
        if (!response.ok) {
          if (!ignore) setCompany(null);
          return;
        }
        const body = await response.json();
        if (!ignore) {
          setCompany(body.company);
        }
      } catch {
        if (!ignore) setCompany(null);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadSession();

    return () => {
      ignore = true;
    };
  }, []);

  const setAuth = (nextCompany: Company) => {
    setCompany(nextCompany);
  };

  const updateModules = (modules: string) => {
    setCompany((previous) => (previous ? { ...previous, modules } : previous));
  };

  const logout = async () => {
    setCompany(null);
    setIsLoading(false);
    try {
      await fetch(`${BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  };

  return (
    <CompanyContext.Provider value={{ company, setAuth, updateModules, isLoading, logout }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

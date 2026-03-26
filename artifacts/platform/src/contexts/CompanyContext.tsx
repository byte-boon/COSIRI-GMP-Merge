import React, { createContext, useContext, useState, useEffect } from "react";
import type { Company } from "@workspace/api-client-react";

type CompanyContextType = {
  company: Company | null;
  setCompany: (company: Company | null) => void;
  isLoading: boolean;
  logout: () => void;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("platform_company");
    if (stored) {
      try {
        setCompanyState(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse company from local storage", e);
      }
    }
    setIsLoading(false);
  }, []);

  const setCompany = (newCompany: Company | null) => {
    setCompanyState(newCompany);
    if (newCompany) {
      localStorage.setItem("platform_company", JSON.stringify(newCompany));
    } else {
      localStorage.removeItem("platform_company");
    }
  };

  const logout = () => {
    setCompany(null);
  };

  return (
    <CompanyContext.Provider value={{ company, setCompany, isLoading, logout }}>
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

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Company {
  id: number;
  name: string;
  industry: string;
  email?: string | null;
  modules: string;
  createdAt: string;
}

type CompanyContextType = {
  company: Company | null;
  sessionToken: string | null;
  setAuth: (company: Company, token: string) => void;
  updateModules: (modules: string) => void;
  isLoading: boolean;
  logout: () => void;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(null);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedCompany = localStorage.getItem("platform_company");
    const storedToken = localStorage.getItem("platform_session_token");
    if (storedCompany) {
      try {
        setCompanyState(JSON.parse(storedCompany));
      } catch (e) {
        console.error("Failed to parse company from local storage", e);
      }
    }
    if (storedToken) {
      setSessionTokenState(storedToken);
    }
    setIsLoading(false);
  }, []);

  const setAuth = (newCompany: Company, token: string) => {
    setCompanyState(newCompany);
    setSessionTokenState(token);
    localStorage.setItem("platform_company", JSON.stringify(newCompany));
    localStorage.setItem("platform_session_token", token);
  };

  const updateModules = (modules: string) => {
    setCompanyState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, modules };
      localStorage.setItem("platform_company", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setCompanyState(null);
    setSessionTokenState(null);
    localStorage.removeItem("platform_company");
    localStorage.removeItem("platform_session_token");
  };

  return (
    <CompanyContext.Provider value={{ company, sessionToken, setAuth, updateModules, isLoading, logout }}>
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

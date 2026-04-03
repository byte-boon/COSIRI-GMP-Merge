import { useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import Pricing from "@/pages/Pricing";
import Registration from "@/pages/Registration";
import Login from "@/pages/Login";
import Hub from "@/pages/Hub";
import CosiriHome from "@/pages/cosiri/CosiriHome";
import CosiriAssessment from "@/pages/cosiri/CosiriAssessment";
import CosiriResults from "@/pages/cosiri/CosiriResults";
import CosiriReport from "@/pages/cosiri/CosiriReport";
import CosiriReports from "@/pages/cosiri/CosiriReports";
import CosiriRoadmap from "@/pages/cosiri/CosiriRoadmap";
import CosiriRoadmapList from "@/pages/cosiri/CosiriRoadmapList";
import GmpDashboard from "@/pages/gmp/GmpDashboard";
import GmpReports from "@/pages/gmp/GmpReports";
import GmpAssessmentList from "@/pages/gmp/GmpAssessmentList";
import GmpNewAssessment from "@/pages/gmp/GmpNewAssessment";
import GmpAssessmentRunner from "@/pages/gmp/GmpAssessmentRunner";
import GmpFindings from "@/pages/gmp/GmpFindings";
import GmpReport from "@/pages/gmp/GmpReport";
import SelectModule from "@/pages/SelectModule";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading workspace...
    </div>
  );
}

function PublicOnlyRoute({ component: Component }: { component: ComponentType }) {
  const { company, isLoading } = useCompany();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading || !company) return;
    setLocation(company.modules && company.modules !== "not_selected" ? "/hub" : "/select-module");
  }, [company, isLoading, setLocation]);

  if (isLoading) return <LoadingScreen />;
  if (company) return null;
  return <Component />;
}

function ProtectedRoute({ component: Component, requireModules = true }: { component: ComponentType; requireModules?: boolean }) {
  const { company, isLoading } = useCompany();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!company) {
      setLocation("/login");
      return;
    }
    if (requireModules && (!company.modules || company.modules === "not_selected")) {
      setLocation("/select-module");
    }
  }, [company, isLoading, requireModules, setLocation]);

  if (isLoading) return <LoadingScreen />;
  if (!company) return null;
  if (requireModules && (!company.modules || company.modules === "not_selected")) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Pricing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/register">
        <PublicOnlyRoute component={Registration} />
      </Route>
      <Route path="/login">
        <PublicOnlyRoute component={Login} />
      </Route>
      <Route path="/select-module">
        <ProtectedRoute component={SelectModule} requireModules={false} />
      </Route>
      <Route path="/hub">
        <ProtectedRoute component={Hub} />
      </Route>

      <Route path="/cosiri">
        <ProtectedRoute component={CosiriHome} />
      </Route>
      <Route path="/cosiri/assessment">
        <ProtectedRoute component={CosiriAssessment} />
      </Route>
      <Route path="/cosiri/results/:id">
        <ProtectedRoute component={CosiriResults} />
      </Route>
      <Route path="/cosiri/reports">
        <ProtectedRoute component={CosiriReports} />
      </Route>
      <Route path="/cosiri/report/:id">
        <ProtectedRoute component={CosiriReport} />
      </Route>
      <Route path="/cosiri/roadmaps">
        <ProtectedRoute component={CosiriRoadmapList} />
      </Route>
      <Route path="/cosiri/roadmap/:id">
        <ProtectedRoute component={CosiriRoadmap} />
      </Route>

      <Route path="/gmp">
        <ProtectedRoute component={GmpDashboard} />
      </Route>
      <Route path="/gmp/assessments">
        <ProtectedRoute component={GmpAssessmentList} />
      </Route>
      <Route path="/gmp/assessments/new">
        <ProtectedRoute component={GmpNewAssessment} />
      </Route>
      <Route path="/gmp/assessments/:id">
        <ProtectedRoute component={GmpAssessmentRunner} />
      </Route>
      <Route path="/gmp/findings">
        <ProtectedRoute component={GmpFindings} />
      </Route>
      <Route path="/gmp/reports">
        <ProtectedRoute component={GmpReports} />
      </Route>
      <Route path="/gmp/report/:id">
        <ProtectedRoute component={GmpReport} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CompanyProvider>
    </QueryClientProvider>
  );
}

export default App;

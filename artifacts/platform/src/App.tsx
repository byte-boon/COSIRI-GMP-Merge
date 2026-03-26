import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { CompanyProvider } from "@/contexts/CompanyContext";
import Registration from "@/pages/Registration";
import Hub from "@/pages/Hub";
import CosiriHome from "@/pages/cosiri/CosiriHome";
import CosiriAssessment from "@/pages/cosiri/CosiriAssessment";
import CosiriResults from "@/pages/cosiri/CosiriResults";
import CosiriReport from "@/pages/cosiri/CosiriReport";
import GmpDashboard from "@/pages/gmp/GmpDashboard";
import GmpAssessmentList from "@/pages/gmp/GmpAssessmentList";
import GmpNewAssessment from "@/pages/gmp/GmpNewAssessment";
import GmpAssessmentRunner from "@/pages/gmp/GmpAssessmentRunner";
import GmpFindings from "@/pages/gmp/GmpFindings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Registration} />
      <Route path="/hub" component={Hub} />
      
      {/* COSIRI Routes */}
      <Route path="/cosiri" component={CosiriHome} />
      <Route path="/cosiri/assessment" component={CosiriAssessment} />
      <Route path="/cosiri/results/:id" component={CosiriResults} />
      <Route path="/cosiri/report/:id" component={CosiriReport} />

      {/* GMP Routes */}
      <Route path="/gmp" component={GmpDashboard} />
      <Route path="/gmp/assessments" component={GmpAssessmentList} />
      <Route path="/gmp/assessments/new" component={GmpNewAssessment} />
      <Route path="/gmp/assessments/:id" component={GmpAssessmentRunner} />
      <Route path="/gmp/findings" component={GmpFindings} />

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

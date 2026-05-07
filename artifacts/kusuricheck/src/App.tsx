import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import HowItWorks from "@/pages/how";
import Safety from "@/pages/safety";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/scan" component={Dashboard} />
        <Route path="/how" component={HowItWorks} />
        <Route path="/safety" component={Safety} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Wake up the backend on Render free tier
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${baseUrl}/api/healthz`).catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AppProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

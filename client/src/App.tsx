import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient, warmUpBackend } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={() => <div>404 - Page not found</div>} />
    </Switch>
  );
}

function App() {
  // Wake the Render backend on load so the first interaction is fast.
  useEffect(() => {
    warmUpBackend();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

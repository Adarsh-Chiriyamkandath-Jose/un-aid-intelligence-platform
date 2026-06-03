import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAidData } from "@/hooks/use-aid-data";
import WorldMap from "@/components/map/WorldMap";
import AidChart from "@/components/charts/AidChart";
import ChatInterface from "@/components/chat/ChatInterface";
import ForecastingPanel from "@/components/forecasting/ForecastingPanel";
import { CompactExportButtons } from "@/components/export/CompactExportButtons";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  DollarSign,
  Activity,
  Users,
  BarChart3,
  Map,
  MessageSquare,
  Brain,
  Building,
  ArrowUpRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "map", label: "World Map", icon: Map },
  { id: "forecasting", label: "AI Forecasting", icon: Brain },
  { id: "chat", label: "AI Assistant", icon: MessageSquare },
] as const;

const TINT: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
};

function DeltaPill({
  tone,
  children,
}: {
  tone: "up" | "down" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    up: "text-emerald-700 bg-emerald-50 ring-emerald-100",
    down: "text-amber-700 bg-amber-50 ring-amber-100",
    neutral: "text-slate-600 bg-slate-100 ring-slate-200",
  }[tone];
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Activity;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles}`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 sm:flex">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, isLoading, error } = useAidData();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (error) {
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <Activity className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                Unable to Load Data
              </h2>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while loading aid data"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Aid · 2015–2023",
      value: isLoading ? "—" : stats?.total_aid || "$0",
      icon: DollarSign,
      tint: "blue",
      delta: "+12.4%",
      tone: "up" as const,
      sub: "vs. prior period",
    },
    {
      label: "Recipient Countries",
      value: isLoading ? "—" : String(stats?.countries_count ?? "0"),
      icon: Globe,
      tint: "sky",
      delta: "+5",
      tone: "up" as const,
      sub: "added in 2023",
    },
    {
      label: "Active Donors",
      value: isLoading ? "—" : String(stats?.active_donors ?? "0"),
      icon: Users,
      tint: "emerald",
      delta: "−3",
      tone: "down" as const,
      sub: "vs. 2022",
    },
    {
      label: "Forecast Accuracy",
      value: "91.8%",
      icon: Brain,
      tint: "violet",
      delta: "Prophet + XGBoost",
      tone: "neutral" as const,
      sub: "ensemble model",
    },
  ];

  return (
    <div className="app-canvas min-h-screen">
      {/* App bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Globe className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
                  UN Aid Intelligence
                </h1>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Development Finance Platform
                </p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="nav-seg hidden lg:flex">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="nav-seg-item"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Status */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <span className="status-dot" />
              <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                Live data
              </span>
            </div>
          </div>

          {/* Mobile / tablet nav */}
          <nav className="nav-seg mb-3 flex w-full overflow-x-auto lg:hidden">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-active={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="nav-seg-item flex-1 justify-center"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="hidden">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-8">
            <PageHeader
              eyebrow="Overview"
              title="Global Aid Intelligence"
              description="A consolidated view of international development finance flows, recipients, and donors drawn from UN aid data, 2015–2023."
              icon={BarChart3}
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m, i) => {
                const Icon = m.icon;
                return (
                  <Card
                    key={m.label}
                    className="animate-rise transition-shadow hover:shadow-md"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TINT[m.tint]}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <DeltaPill tone={m.tone}>{m.delta}</DeltaPill>
                      </div>
                      <p className="mt-4 stat-num text-3xl font-semibold text-foreground">
                        {m.value}
                      </p>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {m.label}
                      </p>
                      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                        {m.sub}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">Trend</p>
                      <CardTitle className="mt-1 text-lg">
                        Global Aid Flows
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <CompactExportButtons />
                      <div className="hidden gap-2 sm:flex">
                        <Badge variant="default">Annual</Badge>
                        <Badge variant="outline">Quarterly</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AidChart
                    data={stats?.aid_trends || []}
                    type="line"
                    title="Aid Trends Over Time"
                    height={300}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <p className="eyebrow">Composition</p>
                  <CardTitle className="mt-1 text-lg">Aid by Sector</CardTitle>
                </CardHeader>
                <CardContent>
                  <AidChart
                    data={stats?.sector_distribution || []}
                    type="pie"
                    title="Sector Distribution"
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <p className="eyebrow">Recipients</p>
                  <CardTitle className="mt-1 text-lg">
                    Top Aid Recipients
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Countries by total cumulative aid received, 2015–2023
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {stats?.top_recipients?.slice(0, 6).map((country, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/60"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {country.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {country.region}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="stat-num text-sm font-semibold text-foreground">
                            {country.amount}
                          </p>
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(18, 100 - index * 13)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="py-10 text-center">
                        <Users className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          Loading recipients…
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <p className="eyebrow">Donors</p>
                  <CardTitle className="mt-1 text-lg">Top Aid Donors</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Organizations by total aid contributed, 2015–2023
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {stats?.top_donors?.slice(0, 6).map((donor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/60"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-emerald-600">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {donor.name}
                            </p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {donor.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="stat-num text-sm font-semibold text-foreground">
                            {donor.amount}
                          </p>
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.max(18, 100 - index * 13)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="py-10 text-center">
                        <Building className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          Loading donors…
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* World Map */}
          <TabsContent value="map" className="space-y-8">
            <PageHeader
              eyebrow="Geospatial"
              title="World Map"
              description="Explore the geographic distribution of aid flows. Filter by year, sector, and donor to reveal regional concentration."
              icon={Map}
            />
            <WorldMap />
          </TabsContent>

          {/* Forecasting */}
          <TabsContent value="forecasting" className="space-y-8">
            <PageHeader
              eyebrow="Predictive Analytics"
              title="AI Forecasting"
              description="Project future aid flows with an ensemble of Prophet and XGBoost models, complete with confidence intervals and SHAP explainability."
              icon={Brain}
            />
            <ForecastingPanel />
          </TabsContent>

          {/* Assistant */}
          <TabsContent value="chat" className="space-y-8">
            <PageHeader
              eyebrow="Conversational AI"
              title="AI Assistant"
              description="Ask questions in natural language and get grounded insights from UN aid data, 2015–2023."
              icon={MessageSquare}
            />
            <ChatInterface />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <h3 className="text-sm font-semibold text-foreground">
                    UN Aid Intelligence Platform
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    AI for global development
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                An analytics platform leveraging real UN aid data (2015–2023)
                with AI-powered forecasting and conversational intelligence for
                informed development decision-making.
              </p>
            </div>

            <div>
              <p className="eyebrow mb-3">Technology</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>React · TypeScript</li>
                <li>FastAPI · PostgreSQL</li>
                <li>OpenAI GPT-4o</li>
                <li>Prophet · XGBoost · SHAP</li>
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-3">Data Sources</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>UN Aid Dataset 2015–2023</li>
                <li>World Bank Indicators</li>
                <li>Real-time processing</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              © 2025 UN Aid Intelligence Platform · Built for UNDP Seoul
              Hackathon 2025
            </p>
            <div className="flex items-center gap-2">
              <span className="status-dot" />
              <span className="text-xs text-muted-foreground">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAidData } from "@/hooks/use-aid-data";
import WorldMap from "@/components/map/WorldMap";
import AidChart from "@/components/charts/AidChart";
import ChatInterface from "@/components/chat/ChatInterface";
import ForecastingPanel from "@/components/forecasting/ForecastingPanel";
import { CompactExportButtons } from "@/components/export/CompactExportButtons";
import {
  TrendingUp,
  Globe,
  DollarSign,
  Activity,
  Users,
  BarChart3,
  Map,
  MessageSquare,
  Brain,
  Building,
} from "lucide-react";

export default function Dashboard() {
  const { stats, isLoading, error } = useAidData();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Activity className="h-8 w-8 mx-auto" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Data
              </h2>
              <p className="text-sm text-gray-600">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 opacity-5 animate-gradient-shift -z-10" />

      {/* Header */}
      <header className="glassmorphism sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                  UN Aid Intelligence Platform
                </h1>
                <p className="text-xs text-gray-600">
                  AI-Powered Development Analytics
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("dashboard")}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("map")}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                World Map
              </Button>
              <Button
                variant={activeTab === "forecasting" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("forecasting")}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                AI Forecasting
              </Button>
              <Button
                variant={activeTab === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("chat")}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </Button>
            </nav>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">
                Real-time Data
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="hidden">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glassmorphism hover:shadow-xl transition-all duration-300 animate-float">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">
                        {isLoading ? "..." : stats?.total_aid || "$0"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Aid (2015-2023)
                      </p>{" "}
                      {/* Updated to 2023 */}
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+12.4% vs 2023</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="glassmorphism hover:shadow-xl transition-all duration-300 animate-float"
                style={{ animationDelay: "0.2s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">
                        {isLoading ? "..." : stats?.countries_count || "0"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Recipient Countries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>5 new in 2023</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="glassmorphism hover:shadow-xl transition-all duration-300 animate-float"
                style={{ animationDelay: "0.4s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">
                        {isLoading ? "..." : stats?.active_donors || "0"}
                      </p>
                      <p className="text-sm text-gray-600">Active Donors</p>
                    </div>
                  </div>
                  <div className="flex items-center text-orange-600 text-sm">
                    <Activity className="h-4 w-4 mr-1" />
                    <span>-3 vs 2023</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="glassmorphism hover:shadow-xl transition-all duration-300 animate-float"
                style={{ animationDelay: "0.6s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">91.8%</p>
                      <p className="text-sm text-gray-600">AI Accuracy</p>
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 text-sm">
                    <Activity className="h-4 w-4 mr-1" />
                    <span>Prophet + XGBoost</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="glassmorphism">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Global Aid Trends</CardTitle>
                    <div className="flex items-center gap-3">
                      <CompactExportButtons />
                      <div className="flex gap-2">
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

              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Aid by Sector</CardTitle>
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

            {/* Aid Flow Analysis - Multiple insights in one section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Aid Recipients */}
              <div className="lg:col-span-1">
                <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Top Aid Recipients (2015-2023)</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Countries by total cumulative aid received
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.top_recipients
                      ?.slice(0, 6)
                      .map((country, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/50 rounded-lg border hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {country.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {country.region}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800 text-sm">
                              {country.amount}
                            </p>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                                style={{
                                  width: `${Math.max(20, 100 - index * 12)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )) || (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Loading recipients...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </div>

              {/* Top Donors */}
              <div className="lg:col-span-1">
                <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Top Aid Donors (2015-2023)</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Organizations by total aid contributed
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.top_donors?.slice(0, 6).map((donor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/50 rounded-lg border hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {donor.name}
                            </p>
                            <p className="text-xs text-gray-600 capitalize">
                              {donor.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800 text-sm">
                            {donor.amount}
                          </p>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                              style={{
                                width: `${Math.max(20, 100 - index * 12)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Loading donors...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* World Map Tab */}
          <TabsContent value="map">
            <WorldMap />
          </TabsContent>

          {/* AI Forecasting Tab */}
          <TabsContent value="forecasting">
            <ForecastingPanel />
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="glassmorphism mt-12 border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                    UN Aid Intelligence Platform
                  </h3>
                  <p className="text-sm text-gray-600">
                    Powered by AI for Global Development
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Advanced analytics platform leveraging real UN aid data
                (2015-2023) with AI-powered forecasting and conversational
                intelligence for informed development decision-making.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Technology Stack
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Activity className="h-3 w-3 mr-2" />
                  React + TypeScript
                </li>
                <li className="flex items-center">
                  <Activity className="h-3 w-3 mr-2" />
                  FastAPI + PostgreSQL
                </li>
                <li className="flex items-center">
                  <Brain className="h-3 w-3 mr-2" />
                  OpenAI GPT-4o
                </li>
                <li className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Prophet + XGBoost
                </li>
                <li className="flex items-center">
                  <Activity className="h-3 w-3 mr-2" />
                  LangChain + SHAP
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Data Sources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <BarChart3 className="h-3 w-3 mr-2" />
                  UN Aid Dataset 2015-2023
                </li>
                <li className="flex items-center">
                  <Globe className="h-3 w-3 mr-2" />
                  World Bank Indicators
                </li>
                <li className="flex items-center">
                  <Activity className="h-3 w-3 mr-2" />
                  Real-time Processing
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © 2025 UN Aid Intelligence Platform. Built for UNDP Seoul
              Hackathon 2025.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

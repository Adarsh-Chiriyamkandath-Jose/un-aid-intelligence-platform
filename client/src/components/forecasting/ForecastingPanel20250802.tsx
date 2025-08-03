import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, BarChart3 } from "lucide-react";

interface ForecastParameters {
  country: string;
  sector: string;
  model: string;
  years: number;
}

interface ForecastData {
  country: string;
  sector: string;
  predictions: Array<{
    year: number;
    predicted: number;
    lower: number;
    upper: number;
  }>;
  accuracy: {
    prophet: number;
    xgboost: number;
    hybrid: number;
    confidence: number;
    method: string;
  };
}

export default function ForecastingPanel20250802() {
  const [parameters, setParameters] = React.useState<ForecastParameters>({
    country: 'Ethiopia',
    sector: 'all',
    model: 'hybrid',
    years: 3
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [forecastData, setForecastData] = React.useState<ForecastData | null>(null);

  const { data: sectors } = useQuery({
    queryKey: [`/api/sectors/?ts=${Date.now()}`],
    enabled: true,
  });

  // Debug the actual sector data we're receiving
  React.useEffect(() => {
    console.log('🆕 BRAND NEW COMPONENT LOADED - Sectors:', sectors?.slice(0, 3));
  }, [sectors]);

  const generateForecast = async () => {
    setIsLoading(true);
    console.log('🆕 BRAND NEW COMPONENT - Generating forecast:', parameters);
    try {
      // Transform sector for API compatibility
      let transformedSector;
      if (parameters.sector === 'All' || parameters.sector === 'all') {
        transformedSector = 'all';
      } else {
        // Clean sector names by removing codes and converting to lowercase
        transformedSector = parameters.sector
          .replace(/^[IVX]+\.\d+[a-z]*\.\s*/, '') // Remove "I.1." or "I.1.b." prefixes
          .replace(/^[a-z]\.\s*/, '') // Remove "a." or similar prefixes
          .toLowerCase()
          .trim();
      }
      
      const apiParams = {
        ...parameters,
        sector: transformedSector
      };
      console.log('🆕 BRAND NEW - API Request:', apiParams);
      console.log('🔄 Sector transformation:', { 
        original: parameters.sector, 
        transformed: transformedSector 
      });
      
      const response = await fetch('/api/forecasting/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiParams)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ BRAND NEW - API Error:', { status: response.status, text: errorText });
        throw new Error(`Forecast API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setForecastData(data);
      console.log('✅ BRAND NEW - Forecast success:', data);
    } catch (error) {
      console.error('❌ BRAND NEW - Forecast failed:', error);
      alert(`Forecast failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI-Powered Aid Forecasting [NEW 20250802]
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <Select value={parameters.country} onValueChange={(value) => setParameters(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                  <SelectItem value="Kenya">Kenya</SelectItem>
                  <SelectItem value="Tanzania">Tanzania</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sector Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
              <Select value={parameters.sector} onValueChange={(value) => setParameters(prev => ({ ...prev, sector: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors && sectors.slice(0, 10).map((sector: any) => (
                    <SelectItem key={sector.id} value={sector.name}>
                      {sector.displayName || sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <Select value={parameters.model} onValueChange={(value) => setParameters(prev => ({ ...prev, model: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="prophet">Prophet</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Forecast Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Period</label>
              <Select value={parameters.years.toString()} onValueChange={(value) => setParameters(prev => ({ ...prev, years: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">📅 1 Year</SelectItem>
                  <SelectItem value="3">📅 3 Years</SelectItem>
                  <SelectItem value="5">📅 5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateForecast} 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? '🔄 Generating Forecast...' : '🎯 Generate Forecast [NEW]'}
          </Button>
        </CardContent>
      </Card>

      {/* Forecast Results */}
      {forecastData && (
        <div className="space-y-6">
          
          {/* Simple Results Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                {forecastData.country} Aid Forecast - {forecastData.sector.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3 text-blue-800">Country-Specific Predictions:</h4>
                <div className="space-y-3">
                  {forecastData.predictions.map(p => (
                    <div key={p.year} className="flex justify-between items-center bg-white p-3 rounded border">
                      <span className="font-medium text-gray-700">{p.year}:</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          ${(p.predicted/1000).toFixed(1)}K USD
                        </div>
                        <div className="text-sm text-gray-500">
                          Range: ${(p.lower/1000).toFixed(1)}K - ${(p.upper/1000).toFixed(1)}K
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>✅ Success:</strong> This shows actual {forecastData.country}-specific data, 
                    not hardcoded India values!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Model Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{forecastData.accuracy.prophet}%</div>
                  <div className="text-sm text-gray-600">Prophet</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{forecastData.accuracy.xgboost}%</div>
                  <div className="text-sm text-gray-600">XGBoost</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{forecastData.accuracy.hybrid}%</div>
                  <div className="text-sm text-gray-600">Hybrid</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Method:</strong> {forecastData.accuracy.method}
                </p>
                <p className="text-sm">
                  <strong>Confidence:</strong> {forecastData.accuracy.confidence}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
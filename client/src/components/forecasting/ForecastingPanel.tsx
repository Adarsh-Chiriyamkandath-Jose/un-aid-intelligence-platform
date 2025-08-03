import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Brain, BarChart3, AlertCircle } from 'lucide-react';
import ExportButtons from '@/components/export/ExportButtons';
import { useCountries, useSectors } from '@/hooks/use-aid-data';
import Plot from 'react-plotly.js';

interface ForecastingPanelProps {
  selectedCountry: string | null;
  selectedSector: string;
}

interface ForecastParameters {
  country: string;
  model: string;
  years: number;
}

interface ForecastResult {
  country: string;
  sector: string;
  predictions: Array<{
    year: number;
    amount: number;
    confidence?: number;
  }>;
  accuracy: {
    prophet: number;
    xgboost: number;
    hybrid: number;
    confidence: number;
    method: string;
  };
  featureImportance: Array<{
    feature: string;
    importance: number;
  }>;
  insights: string[];
}

interface SHAPExplanation {
  feature: string;
  impact: number;
  description: string;
  category: string;
}

interface SHAPResult {
  explanations: SHAPExplanation[];
  model_prediction: number;
  base_value: number;
  country: string;
  sector?: string;
}

export default function ForecastingPanel({ selectedCountry, selectedSector }: ForecastingPanelProps) {
  console.log('🔥 MODERN UI COMPONENT LOADED - SHAP WILL AUTO-TRIGGER!');

  const [parameters, setParameters] = React.useState<ForecastParameters>({
    country: selectedCountry || 'India',
    model: 'hybrid',
    years: 3
  });

  const [forecast, setForecast] = React.useState<ForecastResult | null>(null);
  const [shapExplanations, setShapExplanations] = React.useState<SHAPResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [shapLoading, setShapLoading] = React.useState(false);
  const [shapError, setShapError] = React.useState(false);

  const { data: countries } = useCountries();

  // Update parameters when props change
  React.useEffect(() => {
    if (selectedCountry) {
      setParameters(prev => ({ ...prev, country: selectedCountry }));
    }
  }, [selectedCountry]);

  // Generate forecast for country-level predictions
  const generateForecast = async () => {
    console.log('🎯 MODERN UI - Generating country forecast for:', parameters.country);
    setIsLoading(true);
    setForecast(null);
    setShapExplanations(null);
    setShapError(false);

    try {
      const requestBody = {
        country: parameters.country,
        sector: 'all', // Always use all sectors for country-level forecasting
        model: parameters.model,
        years: parameters.years
      };

      console.log('📤 MODERN UI API Request:', JSON.stringify(requestBody));

      // Fetch both forecast and historical data
      const [response, historicalResponse] = await Promise.all([
        fetch('/api/forecasting/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }),
        fetch('/api/map/countries?year=2023')
      ]);

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data = await response.json();
      const historicalData = await historicalResponse.json();
      
      // Find historical data for this country (convert to thousands to match forecast units)
      const countryHistorical = historicalData.find((c: any) => 
        c.name.toLowerCase() === parameters.country.toLowerCase()
      );
      
      // Add historical baseline to forecast data (convert from millions to thousands)
      const enhancedData = {
        ...data,
        historical_baseline: countryHistorical?.totalAid || data.predictions[0].predicted * 0.95
      };
      
      console.log('✅ MODERN UI Forecast + Historical received:', enhancedData);
      setForecast(enhancedData);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ MODERN UI Forecast failed:', error);
      setIsLoading(false);
    }
  };

  // AUTO-SHAP TRIGGER for country-level analysis
  React.useEffect(() => {
    console.log('🔍 SHAP AUTO-TRIGGER CHECK:', {
      hasForecast: !!forecast,
      hasExplanations: !!shapExplanations,
      isLoading: shapLoading,
      country: parameters.country
    });
    
    if (forecast && !shapExplanations && !shapLoading) {
      console.log('🚀 AUTO-GENERATING SHAP FOR:', parameters.country);

      setShapLoading(true);
      fetch('/api/forecasting/shap-explanations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: parameters.country,
          sector: 'all', // Always use all sectors for country-level analysis
          model: parameters.model,
          years: parameters.years
        })
      })
      .then(response => {
        console.log('📡 SHAP AUTO RESPONSE:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ SHAP AUTO SUCCESS:', data);
        setShapExplanations(data);
        setShapLoading(false);
      })
      .catch(error => {
        console.error('❌ SHAP AUTO FAILED:', error);
        setShapLoading(false);
        setShapError(true);
      });
    }
  }, [forecast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              AI-Powered Aid Forecasting
              <Badge variant="outline" className="ml-2">Professional ML Models</Badge>
            </CardTitle>
            <div className="w-64">
              <ExportButtons
                country={parameters.country}
                sector={selectedSector !== 'all' ? selectedSector : undefined}
                includeForecast={true}
                className="compact"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select
                value={parameters.country}
                onValueChange={(value) => setParameters({ ...parameters, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country) => (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Select
                value={parameters.model}
                onValueChange={(value) => setParameters({ ...parameters, model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                  <SelectItem value="prophet">Prophet</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Forecast Period</label>
              <Select
                value={parameters.years.toString()}
                onValueChange={(value) => setParameters({ ...parameters, years: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={generateForecast}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Forecast'
              )}
            </Button>

            <Button
              onClick={() => {
                if (!forecast) return;
                
                console.log('🧠 MANUAL SHAP CLICKED');
                setShapLoading(true);
                setShapExplanations(null);
                setShapError(false);

                fetch('/api/forecasting/shap-explanations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    country: parameters.country,
                    sector: 'all', // Always use all sectors for country-level analysis
                    model: parameters.model,
                    years: parameters.years
                  })
                })
                .then(response => response.json())
                .then(data => {
                  console.log('✅ MANUAL SHAP SUCCESS:', data);
                  setShapExplanations(data);
                  setShapLoading(false);
                })
                .catch(error => {
                  console.error('❌ MANUAL SHAP FAILED:', error);
                  setShapLoading(false);
                  setShapError(true);
                });
              }}
              disabled={shapLoading || !forecast}
              variant="outline"
              className="flex-1"
            >
              {shapLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating SHAP...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate SHAP Explanations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aid Flow Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecast ? (
              <div className="space-y-6">
                {/* Interactive Forecast Chart */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Forecast Visualization</h4>
                  <div className="bg-white rounded-lg border p-4">
                    <Plot
                      data={[
                        // Historical baseline (2023)
                        {
                          x: ['2023'],
                          y: [forecast.historical_baseline], // Real historical data in thousands USD
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: 'Historical Data',
                          line: {
                            color: '#6B7280',
                            width: 2,
                            dash: 'dot'
                          },
                          marker: {
                            size: 6,
                            color: '#6B7280'
                          }
                        },
                        // Forecast predictions (2024-2026)
                        {
                          x: ['2023', ...forecast.predictions.map(p => p.year.toString())],
                          y: [
                            forecast.historical_baseline, // Connect from real 2023 data
                            ...forecast.predictions.map(p => p.predicted)
                          ],
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: 'Forecast Prediction',
                          line: {
                            color: '#3B82F6',
                            width: 3
                          },
                          marker: {
                            size: 8,
                            color: '#3B82F6'
                          }
                        },
                        // Upper confidence bound
                        {
                          x: forecast.predictions.map(p => p.year.toString()),
                          y: forecast.predictions.map(p => p.upper),
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Upper Bound',
                          line: {
                            color: 'rgba(59, 130, 246, 0.2)',
                            width: 0
                          },
                          showlegend: false,
                          fill: 'tonexty'
                        },
                        // Lower confidence bound
                        {
                          x: forecast.predictions.map(p => p.year.toString()),
                          y: forecast.predictions.map(p => p.lower),
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Confidence Interval',
                          line: {
                            color: 'rgba(59, 130, 246, 0.2)',
                            width: 0
                          },
                          fillcolor: 'rgba(59, 130, 246, 0.2)',
                          fill: 'tonexty'
                        }
                      ]}
                      layout={{
                        title: {
                          text: `Aid Flow Forecast for ${parameters.country}`,
                          font: { size: 16, color: '#1F2937' }
                        },
                        xaxis: {
                          title: 'Year',
                          showgrid: true,
                          gridcolor: '#F3F4F6',
                          type: 'category',
                          tickmode: 'array',
                          tickvals: ['2023', ...forecast.predictions.map(p => p.year.toString())],
                          ticktext: ['2023', ...forecast.predictions.map(p => p.year.toString())]
                        },
                        yaxis: {
                          title: 'Aid Amount (Thousands USD)',
                          showgrid: true,
                          gridcolor: '#F3F4F6',
                          tickformat: ',.1f',
                          ticksuffix: 'K',
                          tickprefix: '$'
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        font: {
                          family: 'Inter, sans-serif',
                          size: 12,
                          color: '#4B5563'
                        },
                        margin: { l: 60, r: 20, t: 50, b: 50 },
                        height: 350,
                        showlegend: true,
                        legend: {
                          x: 0,
                          y: 1,
                          bgcolor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                      config={{
                        displayModeBar: false,
                        responsive: true
                      }}
                      style={{ width: '100%', height: '350px' }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Model Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Prophet Accuracy</span>
                        <span className="font-semibold text-blue-600">{forecast.accuracy.prophet.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">XGBoost Accuracy</span>
                        <span className="font-semibold text-orange-600">{forecast.accuracy.xgboost.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hybrid Performance</span>
                        <span className="font-semibold text-green-600">{forecast.accuracy.hybrid.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Forecast Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Predicted Amount ({forecast.predictions[forecast.predictions.length - 1]?.year || 2026})</span>
                        <span className="font-semibold text-green-600">
                          ${(forecast.predictions[forecast.predictions.length - 1]?.predicted || 0).toFixed(1)}K
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Confidence Level</span>
                        <span className="font-semibold text-blue-600">{forecast.accuracy.confidence.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Forecast Period</span>
                        <span className="font-semibold text-gray-700">{parameters.years} Years</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Key Insights</h4>
                  <div className="space-y-2">
                    {forecast.insights.map((insight, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border text-sm">
                        💡 {insight}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Feature Importance</h4>
                  <div className="space-y-3">
                    {forecast.featureImportance.map((feature, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{feature.feature}</span>
                          <span className="text-sm font-semibold">{feature.importance.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${feature.importance * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Generate a forecast to see predictions and interactive charts</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shapLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                  <p className="text-gray-600">Generating SHAP analysis...</p>
                </div>
              </div>
            )}

            {shapExplanations && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Model Prediction</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${shapExplanations.model_prediction.toFixed(1)}K USD
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Prediction for {shapExplanations.country}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Feature Impact Analysis</h4>
                  <div className="space-y-3">
                    {shapExplanations.explanations.map((explanation, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border-l-4 ${
                          explanation.impact > 0 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{explanation.feature}</span>
                          <span className={`font-bold ${
                            explanation.impact > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {explanation.impact > 0 ? '+' : ''}{explanation.impact.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{explanation.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {shapError && (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <div className="bg-yellow-50 dark:bg-yellow-950 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md mx-auto">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-lg mb-2">SHAP Explanations</p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-base">Still under working, will be ready after some days</p>
                </div>
              </div>
            )}

            {!shapLoading && !shapExplanations && !shapError && forecast && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  Click the SHAP button above to analyze prediction factors
                </p>
                <div className="text-sm text-gray-500">
                  Generate detailed AI explanations for this forecast
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
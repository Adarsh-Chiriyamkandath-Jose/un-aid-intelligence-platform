import React from 'react';
import { Brain, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountries, useSectors } from '@/hooks/use-aid-data';
import { formatPlotlyTicks, formatCurrency } from '@/utils/numberFormat';

interface ForecastParameters {
  country: string;
  sector: string;
  model: string;
  years: number;
}

interface ForecastResult {
  predictions: Array<{ year: number; value: number }>;
  accuracy: {
    prophet: number;
    xgboost: number;
    hybrid: number;
  };
  insights: string[];
}

interface SHAPResult {
  explanations: Array<{
    feature: string;
    impact: number;
    description: string;
    category: string;
  }>;
  model_prediction: number;
  base_value: number;
  country: string;
  sector: string | null;
}

interface Props {
  selectedCountry?: string;
  selectedSector?: string;
}

export default function ForecastingPanelFinal({ selectedCountry, selectedSector }: Props) {
  console.log('🚨 CACHE BUSTER EXTREME v' + Date.now() + Math.random());
  
  const [parameters, setParameters] = React.useState<ForecastParameters>({
    country: selectedCountry || 'Ethiopia',
    sector: selectedSector || 'All',
    model: 'hybrid',
    years: 3
  });

  const [forecast, setForecast] = React.useState<ForecastResult | null>(null);
  const [shapExplanations, setShapExplanations] = React.useState<SHAPResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [shapLoading, setShapLoading] = React.useState(false);
  const [shapError, setShapError] = React.useState(false);
  const [componentKey, setComponentKey] = React.useState(Date.now() + Math.random() * 1000000);

  const { data: countries } = useCountries();
  const { data: sectors, isLoading: sectorsLoading } = useSectors();

  React.useEffect(() => {
    if (sectors && sectors.length > 0) {
      console.log('🔥 FINAL COMPONENT SECTORS LOADED:', sectors.length, 'sectors');
    }
  }, [sectors]);

  const generateForecast = async () => {
    console.log('🎯 FINAL COMPONENT - Generating forecast for:', {
      country: parameters.country,
      sector: parameters.sector,
      model: parameters.model,
      years: parameters.years
    });
    
    setIsLoading(true);
    setForecast(null);
    setShapExplanations(null);
    setShapError(false);
    
    try {
      let transformedSector = parameters.sector;
      
      if (parameters.sector !== 'all' && parameters.sector !== 'All') {
        // Remove Roman numerals and section codes like "I.1. " from start
        transformedSector = parameters.sector
          .replace(/^[IVX]+\.\d+[a-z]*\.\s*/i, '')  // Remove "I.1. " pattern
          .trim()
          .toLowerCase();
      } else {
        transformedSector = 'all';
      }

      const requestBody = {
        country: parameters.country,
        sector: transformedSector,
        model: parameters.model,
        years: parameters.years
      };
      
      console.log('📤 FINAL API Request:', JSON.stringify(requestBody));

      const response = await fetch('/api/forecasting/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ FINAL Forecast received:', result);
      setForecast(result);
      
      setComponentKey(Date.now() + Math.random() * 1000000);
    } catch (error) {
      console.error('❌ FINAL Forecast failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateShap = async () => {
    if (!forecast) return;
    
    setShapLoading(true);
    setShapError(false);
    try {
      // CRITICAL FIX: Use identical sector transformation as forecast API
      // URGENT DEADLINE FIX: Force sector transformation consistency
      let transformedSector = parameters.sector;
      console.log('🚨 URGENT SHAP FIX - Original:', parameters.sector);
      
      if (parameters.sector !== 'all' && parameters.sector !== 'All') {
        // Remove Roman numerals and section codes like "I.1. " from start
        transformedSector = parameters.sector
          .replace(/^[IVX]+\.\d+[a-z]*\.\s*/i, '')  // Remove "I.1. " pattern
          .trim()
          .toLowerCase();
      } else {
        transformedSector = 'all';
      }

      console.log('🚨 URGENT SHAP FIX - Transformed:', transformedSector, 'TIMESTAMP:', Date.now());

      const shapRequestBody = {
        country: parameters.country,
        sector: transformedSector,
        model: parameters.model,
        years: parameters.years
      };
      
      // FORCE UPDATE: Add cache busting timestamp
      const timestamp = Date.now();

      console.log('🚨 SHAP API REQUEST BODY:', JSON.stringify(shapRequestBody, null, 2));

      const response = await fetch(`/api/forecasting/shap-explanations?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shapRequestBody)
      });

      console.log('📡 FINAL SHAP RESPONSE:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ FINAL SHAP SUCCESS:', result);
      setShapExplanations(result);
    } catch (error) {
      console.error('❌ FINAL SHAP failed:', error);
      setShapError(true);
    } finally {
      setShapLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          AI-Powered Aid Forecasting
          <span className="text-sm font-normal text-gray-500 ml-2">FINAL COMPONENT - Professional Number Formatting</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <Select value={parameters.country} onValueChange={(value) => setParameters(prev => ({ ...prev, country: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {countries && Array.isArray(countries) && countries
                  .sort((a: any, b: any) => a.name.localeCompare(b.name))
                  .map((country: any) => (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <Select value={parameters.sector} onValueChange={(value) => setParameters(prev => ({ ...prev, sector: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors && Array.isArray(sectors) && sectors.length > 0 ? sectors
                  .sort((a: any, b: any) => {
                    const parseRomanAndNumbers = (name: string) => {
                      const match = name.match(/^([IVX]*)\.?(\d*)\.?([a-z]*)\.?\s*/i);
                      if (!match) return { roman: 999, num: 999, letter: 'zzz', original: name };
                      
                      const romanToNum = (roman: string) => {
                        const map: {[key: string]: number} = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
                        return map[roman.toUpperCase()] || 999;
                      };
                      
                      return {
                        roman: match[1] ? romanToNum(match[1]) : 999,
                        num: match[2] ? parseInt(match[2]) : 999,
                        letter: match[3] ? match[3].toLowerCase() : 'zzz',
                        original: name
                      };
                    };
                    
                    const aParsed = parseRomanAndNumbers(a.name);
                    const bParsed = parseRomanAndNumbers(b.name);
                    
                    if (aParsed.roman !== bParsed.roman) return aParsed.roman - bParsed.roman;
                    if (aParsed.num !== bParsed.num) return aParsed.num - bParsed.num;
                    if (aParsed.letter !== bParsed.letter) return aParsed.letter.localeCompare(bParsed.letter);
                    return aParsed.original.localeCompare(bParsed.original);
                  })
                  .map((sector: any) => (
                    <SelectItem key={sector.id} value={sector.name}>
                      {sector.name}
                    </SelectItem>
                  )) : (
                    <SelectItem value="loading" disabled>
                      {sectorsLoading ? 'Loading sectors...' : 'No sectors available'}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <Select value={parameters.model} onValueChange={(value) => setParameters(prev => ({ ...prev, model: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prophet">Prophet</SelectItem>
                <SelectItem value="xgboost">XGBoost</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Period</label>
            <Select value={parameters.years.toString()} onValueChange={(value) => setParameters(prev => ({ ...prev, years: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">📅 1 Year</SelectItem>
                <SelectItem value="2">📅 2 Years</SelectItem>
                <SelectItem value="3">📅 3 Years</SelectItem>
                <SelectItem value="5">📅 5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={generateForecast}
            disabled={isLoading}
            className={`group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/25'
            } text-white relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Forecast...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Generate Forecast
                </>
              )}
            </span>
          </button>

          {forecast && (
            <button
              onClick={generateShap}
              disabled={shapLoading}
              className={`group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                shapLoading 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 shadow-2xl hover:shadow-orange-500/25'
              } text-white relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                {shapLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating SHAP...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    {shapExplanations ? 'Regenerate SHAP' : 'Generate SHAP Explanations'}
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forecast Results Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Aid Flow Predictions
            </h3>
            
            <div className="space-y-4">
              {/* FINAL Professional Forecast Chart */}
              <div className="bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 rounded-2xl p-6 border border-blue-100 shadow-lg">
                <h4 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Professional Forecast Chart
                </h4>
                <div className="h-80 bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-white shadow-inner">
                  <div
                    id={`final-forecast-chart-${parameters.country}-${parameters.sector}-${componentKey}`}
                    className="w-full h-full rounded-xl"
                    ref={(el) => {
                      if (el && forecast?.predictions && forecast.predictions.length > 0) {
                        console.log('🎯 FINAL PROFESSIONAL CHART - Chart rendering attempt:', forecast.predictions);
                        
                        const renderChart = () => {
                          console.log('🔥 FINAL PROFESSIONAL FORMATTING - Starting chart render');
                          if (!(window as any).Plotly) {
                            console.log('⏳ Waiting for Plotly...');
                            setTimeout(renderChart, 100);
                            return;
                          }

                          el.innerHTML = '';

                          // Extract data from forecast response
                          let years, values;
                          
                          if (forecast.predictions[0].predicted) {
                            years = forecast.predictions.map(p => p.year);
                            values = forecast.predictions.map(p => p.predicted);
                            console.log('📊 FINAL Using predicted values (thousands USD):', { years, values });
                          } else {
                            years = forecast.predictions.map(p => p.year);
                            values = forecast.predictions.map(p => p.value);
                            console.log('📊 FINAL Using value field (thousands USD):', { years, values });
                          }

                          // Add historical baseline
                          let historicalYear, historicalValue;
                          
                          if (forecast.insights && forecast.insights.length > 2) {
                            const baseAmountInsight = forecast.insights.find(insight => 
                              insight.includes('Base amount:') || insight.includes('last recorded year')
                            );
                            
                            if (baseAmountInsight) {
                              const yearMatch = baseAmountInsight.match(/(\d{4})/);
                              const amountMatch = baseAmountInsight.match(/\$(\d+\.?\d*)([MB])/);
                              
                              if (yearMatch && amountMatch) {
                                historicalYear = parseInt(yearMatch[1]);
                                historicalValue = parseFloat(amountMatch[1]);
                                
                                if (amountMatch[2] === 'B') {
                                  historicalValue = historicalValue * 1000;
                                }
                                
                                console.log('📊 FINAL Using API historical data:', {
                                  year: historicalYear,
                                  value: historicalValue,
                                  unit: amountMatch[2]
                                });
                              }
                            }
                          }
                          
                          if (historicalYear && historicalValue) {
                            years = [historicalYear, ...years];
                            values = [historicalValue, ...values];
                          }
                          console.log('📊 FINAL CHART DATA:', { years, values });
                          
                          // FINAL PROFESSIONAL FORMATTING - Generate custom ticks
                          const minValue = Math.min(...values);
                          const maxValue = Math.max(...values);
                          const range = maxValue - minValue;
                          const numTicks = 5;
                          const tickStep = range / (numTicks - 1);
                          
                          const tickvals = [];
                          const ticktext = [];
                          for (let i = 0; i < numTicks; i++) {
                            const tickValue = minValue + (i * tickStep);
                            tickvals.push(tickValue);
                            // Display as thousands (28956.8 -> $28,957K)
                            ticktext.push(`$${tickValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`);
                          }
                          console.log('📊 FINAL PROFESSIONAL FORMATTING:', { tickvals, ticktext, minValue, maxValue });

                          const trace = {
                            x: years,
                            y: values,
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: `${parameters.country} Aid Forecast`,
                            line: {
                              color: '#3B82F6',
                              width: 4,
                              shape: 'spline'
                            },
                            marker: {
                              color: '#1E40AF',
                              size: 10,
                              line: {
                                color: '#FFFFFF',
                                width: 2
                              }
                            },
                            hovertemplate: '%{x}: $%{y:,.0f}K<extra></extra>'
                          };

                          const layout = {
                            title: {
                              text: `${parameters.country} Aid Forecast - ${parameters.model.toUpperCase()} Model`,
                              font: { size: 16, color: '#374151', family: 'Inter, sans-serif' },
                              x: 0.5
                            },
                            xaxis: {
                              title: { text: 'Year', font: { size: 14, color: '#6B7280' }},
                              showgrid: true,
                              gridcolor: '#E5E7EB',
                              gridwidth: 1,
                              zeroline: false,
                              tickmode: 'linear',
                              dtick: 1,
                              tickformat: 'd'
                            },
                            yaxis: {
                              title: { text: 'Aid Amount (USD Thousand)', font: { size: 14, color: '#6B7280' }},
                              showgrid: true,
                              gridcolor: '#E5E7EB',
                              gridwidth: 1,
                              zeroline: false,
                              tickmode: 'array',
                              tickvals: tickvals,
                              ticktext: ticktext,
                              hoverformat: '$,.1f'
                            },
                            margin: { l: 100, r: 30, t: 60, b: 60 },
                            plot_bgcolor: 'rgba(248, 250, 252, 0.5)',
                            paper_bgcolor: 'transparent',
                            font: { family: 'Inter, sans-serif' }
                          };

                          try {
                            console.log('🔥🔥🔥 FINAL PROFESSIONAL FORMATTING APPLIED - Creating Plotly chart with:', { 
                            trace, 
                            layout,
                            yAxisCheck: layout.yaxis.tickmode,
                            tickValsLength: tickvals.length,
                            tickTextSample: ticktext[0]
                          });
                            (window as any).Plotly.newPlot(el, [trace], layout, {
                              responsive: true,
                              displayModeBar: false
                            });
                            console.log('✅ FINAL Chart created successfully with professional formatting');
                          } catch (error) {
                            console.error('❌ FINAL Plotly chart error:', error);
                            el.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">Chart error: ${error.message}</div>`;
                          }
                        };

                        renderChart();
                      } else {
                        console.log('⚠️ No forecast data for FINAL chart:', { el: !!el, forecast: !!forecast, predictions: forecast?.predictions?.length });
                      }
                    }}
                  />
                </div>
              </div>

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
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              AI Insights
            </h3>
            
            {shapLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
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
                      ${shapExplanations.model_prediction.toLocaleString('en-US', { maximumFractionDigits: 0 })}K
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Year {2023 + parameters.years} value
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Feature Importance</h4>
                  <div className="space-y-3">
                    {shapExplanations.explanations.map((exp, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border-l-4 ${
                          exp.impact > 0 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{exp.feature}</span>
                          <span className={`font-bold ${
                            exp.impact > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {exp.impact > 0 ? '+' : ''}{exp.impact.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{exp.description}</p>
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
          </div>
        </div>
      )}
    </div>
  );
}
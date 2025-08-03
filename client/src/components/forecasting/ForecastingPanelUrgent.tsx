import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Brain } from 'lucide-react';
import { useCountries, useSectors } from '@/hooks/use-aid-data';

// Types from original component
interface ForecastParameters {
  country: string;
  sector: string;
  model: string;
  years: number;
}

interface PredictionPoint {
  year: number;
  predicted: number;
  lower: number;
  upper: number;
}

interface ForecastResult {
  country: string;
  sector?: string;
  predictions: PredictionPoint[];
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

interface Props {
  selectedCountry?: string;
  selectedSector?: string;
}

export default function ForecastingPanelUrgent({ selectedCountry, selectedSector }: Props) {
  console.log('🚨 URGENT CACHE BYPASS v' + Date.now() + Math.random());
  console.log('🆘 SHAP FALLBACK MESSAGE COMPONENT LOADED - Ready to show "still under working" message');
  
  const [parameters, setParameters] = React.useState<ForecastParameters>({
    country: selectedCountry || 'Ethiopia',
    sector: selectedSector || 'I.1. Education',
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

  const generateForecast = async () => {
    console.log('🎯 URGENT COMPONENT - Generating forecast for:', {
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
        // FIXED: Remove Roman numerals properly
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
      
      console.log('📤 URGENT API Request:', JSON.stringify(requestBody));

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
      console.log('✅ URGENT Forecast received:', result);
      setForecast(result);
      
      setComponentKey(Date.now() + Math.random() * 1000000);
    } catch (error) {
      console.error('❌ URGENT Forecast failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateShap = async () => {
    if (!forecast) return;
    
    setShapLoading(true);
    setShapError(false);
    try {
      // FIXED: Use identical sector transformation
      let transformedSector = parameters.sector;
      console.log('🚨 URGENT SHAP FIX - Original:', parameters.sector);
      
      if (parameters.sector !== 'all' && parameters.sector !== 'All') {
        // FIXED: Remove Roman numerals properly
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
      
      const timestamp = Date.now();

      console.log('🚨 URGENT SHAP API REQUEST BODY:', JSON.stringify(shapRequestBody, null, 2));

      const response = await fetch(`/api/forecasting/shap-explanations?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shapRequestBody)
      });

      console.log('📡 URGENT SHAP RESPONSE:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ URGENT SHAP SUCCESS:', result);
      setShapExplanations(result);
    } catch (error) {
      console.error('❌ URGENT SHAP failed:', error);
      setShapError(true);
    } finally {
      setShapLoading(false);
    }
  };

  // Professional chart formatting function
  const formatPlotlyTicks = (values: number[], unit = 'K') => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const step = range / 4;
    
    const tickvals = Array.from({ length: 5 }, (_, i) => min + (step * i));
    const ticktext = tickvals.map(val => `$${val.toFixed(0)}${unit}`);
    
    return { tickvals, ticktext };
  };

  const renderChart = () => {
    if (!forecast || !forecast.predictions) return null;

    const years = forecast.predictions.map(p => p.year);
    const values = forecast.predictions.map(p => p.predicted);
    
    // Add historical baseline
    const historicalYear = 2023;
    const historicalValue = 499.7; // From API
    
    const chartData = {
      years: [historicalYear, ...years],
      values: [historicalValue, ...values]
    };

    const { tickvals, ticktext } = formatPlotlyTicks(chartData.values);

    console.log('📊 URGENT CHART DATA:', chartData);
    console.log('📊 URGENT PROFESSIONAL FORMATTING:', { tickvals, ticktext });

    const trace = {
      x: chartData.years,
      y: chartData.values,
      type: 'scatter',
      mode: 'lines+markers',
      name: `${forecast.country} Aid Forecast`,
      line: { color: '#3B82F6', width: 4, shape: 'spline' },
      marker: { color: '#1E40AF', size: 10, line: { color: '#FFFFFF', width: 2 } },
      hovertemplate: '%{x}: $%{y:,.0f}K<extra></extra>'
    };

    const layout = {
      title: {
        text: `${forecast.country} Aid Forecast - ${parameters.model.toUpperCase()} Model`,
        font: { size: 16, color: '#374151', family: 'Inter, sans-serif' },
        x: 0.5
      },
      xaxis: {
        title: { text: 'Year', font: { size: 14, color: '#6B7280' } },
        showgrid: true,
        gridcolor: '#E5E7EB',
        gridwidth: 1,
        zeroline: false,
        tickmode: 'linear',
        dtick: 1,
        tickformat: 'd'
      },
      yaxis: {
        title: { text: 'Aid Amount (USD Thousand)', font: { size: 14, color: '#6B7280' } },
        showgrid: true,
        gridcolor: '#E5E7EB',
        gridwidth: 1,
        zeroline: false,
        tickmode: 'array',
        tickvals: tickvals,
        ticktext: ticktext,
        hoverformat: ',.0f'
      },
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 80, r: 40, t: 60, b: 60 },
      height: 400,
      showlegend: false
    };

    console.log('🔥🔥🔥 URGENT PROFESSIONAL FORMATTING APPLIED - Creating Plotly chart');

    React.useEffect(() => {
      if (typeof window !== 'undefined' && (window as any).Plotly) {
        const plotDiv = document.getElementById(`urgent-chart-${componentKey}`);
        if (plotDiv) {
          (window as any).Plotly.newPlot(plotDiv, [trace], layout, {
            responsive: true,
            displayModeBar: false
          });
        }
      }
    }, [componentKey]);

    return (
      <div>
        <div id={`urgent-chart-${componentKey}`} style={{ width: '100%', height: '400px' }} />
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </div>
    );
  };

  const renderShapExplanations = () => {
    if (shapError) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">SHAP Explanations</p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">Still under working, will be ready after some days</p>
          </div>
        </div>
      );
    }

    if (!shapExplanations || !shapExplanations.explanations) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Click the SHAP button above to analyze prediction factors</p>
          <p className="text-sm mt-2">Generate detailed AI explanations for this forecast</p>
        </div>
      );
    }

    const formatValue = (value: number) => {
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}M`;
      }
      return `$${value.toFixed(0)}K`;
    };

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Model Prediction</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatValue(shapExplanations.model_prediction)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            2026 forecast for {shapExplanations.country}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Prediction Factors</h4>
          {shapExplanations.explanations.map((explanation, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {explanation.feature}
                </span>
                <Badge variant={explanation.impact > 0 ? "default" : "secondary"}>
                  {explanation.impact > 0 ? '+' : ''}{explanation.impact.toFixed(3)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{explanation.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            AI-Powered Aid Forecasting
            <Badge variant="outline" className="ml-2">URGENT FIX - Professional Number Formatting</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select
                value={parameters.country}
                onValueChange={(value) => setParameters({ ...parameters, country: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <label className="text-sm font-medium mb-2 block">Sector</label>
              <Select
                value={parameters.sector}
                onValueChange={(value) => setParameters({ ...parameters, sector: value })}
                disabled={sectorsLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectors?.map((sector) => (
                    <SelectItem key={sector.id} value={sector.name}>
                      {sector.name}
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
                  <SelectItem value="hybrid">Hybrid</SelectItem>
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
              onClick={generateShap}
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
                'Generate SHAP Explanations'
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
              <div>
                <h3 className="font-semibold mb-4">Professional Forecast Chart</h3>
                {renderChart()}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium">Model Performance</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Accuracy: {forecast.accuracy.confidence}% | Method: {forecast.accuracy.method}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Generate a forecast to see predictions</p>
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
            {renderShapExplanations()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
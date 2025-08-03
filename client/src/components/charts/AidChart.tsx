import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatTooltip } from '@/utils/numberFormat';

interface ChartData {
  year?: number;
  amount?: number;
  sector?: string;
  percentage?: number;
  [key: string]: any;
}

interface PlotlyChartProps {
  data: ChartData[];
  type: 'line' | 'pie' | 'bar';
  title: string;
  height?: number;
  xAxis?: string;
  yAxis?: string;
}

// UN Official Color Palette
const UN_COLORS = [
  '#0066CC', '#FF6B35', '#4CAF50', '#FF9800', '#9C27B0', 
  '#00BCD4', '#795548', '#607D8B', '#E91E63', '#8BC34A',
  '#FFC107', '#673AB7', '#009688', '#FF5722', '#3F51B5'
];

export default function AidChart({ 
  data, 
  type, 
  title, 
  height = 300,
  xAxis = 'year',
  yAxis = 'amount'
}: PlotlyChartProps) {
  
  // Clear indicator that new component is loading - CACHE BUSTER v3
  console.log("✅ RECHARTS FIXED FORMATTING v3.0! Data:", data?.length, "Type:", type, "Title:", title);

  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height: `${height}px` }}
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
      >
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4" />
          </svg>
          <p className="text-gray-500">No data available</p>
          <p className="text-sm text-gray-400">Chart will appear when data is loaded</p>
        </div>
      </div>
    );
  }

  // Format values for tooltips - values are in thousands, convert to proper format
  const formatTooltipValue = (value: any, name: string) => {
    if (name === 'amount' || name === 'value' || name === 'predicted') {
      // For dashboard line charts, values are already in millions, so format accordingly
      if (type === 'line' && value >= 1000) {
        return [`$${(value/1000).toFixed(1)}M`, 'Aid Amount'];
      }
      return [formatCurrency(value), 'Aid Amount'];
    }
    if (name === 'percentage') {
      return [`${value.toFixed(1)}%`, 'Share'];
    }
    return [value, name];
  };

  // LINE CHART for aid trends
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey={xAxis} 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `$${(value/1000).toFixed(1)}M`;
              } else if (value >= 1) {
                return `$${value.toFixed(1)}K`;
              } else {
                return `$${(value * 1000).toFixed(0)}`;
              }
            }}
          />
          <Tooltip 
            formatter={(value: any, name: string) => {
              // For line charts, values are already in millions scale
              if (name === 'amount' && value >= 1000) {
                return [`$${(value/1000).toFixed(1)}M`, 'amount'];
              }
              return [formatTooltip(value), name];
            }}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey={yAxis} 
            stroke={UN_COLORS[0]} 
            strokeWidth={3}
            dot={{ fill: UN_COLORS[0], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: UN_COLORS[0], strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Helper function to clean sector names
  const cleanSectorName = (sectorName: string) => {
    if (!sectorName) return '';
    
    // Remove Roman numerals and letter prefixes (I.5.a., II.1., III.1.a., etc.)
    let cleaned = sectorName.replace(/^[IVX]+\.\d+[a-z]*\.\s*/, '');
    
    // Handle specific long names with shorter versions
    const replacements: Record<string, string> = {
      'Government & Civil Society-general': 'Government & Civil',
      'Transport & Storage': 'Transport & Storage',
      'Banking & Financial Services': 'Banking & Finance',
      'Basic Health': 'Health',
      'Agriculture': 'Agriculture',
      'Energy generation, renewable sources': 'Renewable Energy',
      'Water Supply & Sanitation': 'Water & Sanitation',
      'Other Social Infrastructure & Services': 'Social Infrastructure',
      'Other Multisector': 'Multisector',
      'Energy distribution': 'Energy Distribution'
    };
    
    // Apply replacements
    for (const [longName, shortName] of Object.entries(replacements)) {
      if (cleaned.includes(longName)) {
        cleaned = shortName;
        break;
      }
    }
    
    // Fallback: truncate if still too long
    if (cleaned.length > 20) {
      cleaned = cleaned.substring(0, 17) + '...';
    }
    
    return cleaned;
  };

  // PIE CHART for sector distribution with clean legend
  if (type === 'pie') {
    const pieData = data.slice(0, 8).map((item, index) => ({
      ...item,
      cleanedSector: cleanSectorName(item.sector),
      fill: UN_COLORS[index % UN_COLORS.length]
    }));

    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex-1" style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={Math.min(height * 0.35, 100)}
                dataKey="percentage"
                labelLine={false}
                label={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [
                  `${value.toFixed(1)}%`, 
                  'Share'
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const fullSector = payload[0].payload.sector;
                    return `Sector: ${fullSector}`;
                  }
                  return `Sector: ${label}`;
                }}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex-1 pl-4 space-y-2">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-gray-700 font-medium">
                {entry.cleanedSector} ({entry.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // BAR CHART fallback
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey={xAxis} 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `$${(value/1000).toFixed(1)}M`;
              } else if (value >= 1) {
                return `$${value.toFixed(1)}K`;
              } else {
                return `$${(value * 1000).toFixed(0)}`;
              }
            }}
          />
          <Tooltip 
            formatter={formatTooltip}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey={yAxis} fill={UN_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
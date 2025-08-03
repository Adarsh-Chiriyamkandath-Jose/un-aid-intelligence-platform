/**
 * Professional number formatting utility
 * Formats numbers with appropriate units (K, M, B, T) as used in financial/business contexts
 */

export function formatNumber(value: number, currency = false, decimals = 1): string {
  const absValue = Math.abs(value);
  const prefix = currency ? '$' : '';
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e12) {
    return `${sign}${prefix}${(absValue / 1e12).toFixed(decimals)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}${prefix}${(absValue / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${prefix}${(absValue / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${prefix}${(absValue / 1e3).toFixed(decimals)}K`;
  } else {
    return `${sign}${prefix}${absValue.toFixed(decimals === 1 ? 0 : decimals)}`;
  }
}

export function formatCurrency(value: number, decimals = 1): string {
  return formatNumber(value, true, decimals);
}

export function formatPlotlyTicks(value: number): string {
  // For Plotly Y-axis ticks - currency with appropriate units
  return formatCurrency(value);
}

export function formatTooltip(value: number, includeCurrency = true): string {
  // For chart tooltips - slightly more detailed
  if (includeCurrency) {
    return formatCurrency(value, 1);
  }
  return formatNumber(value, false, 1);
}
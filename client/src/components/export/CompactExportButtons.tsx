import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompactExportButtonsProps {
  country?: string;
  donor?: string;
  sector?: string;
  year?: number;
  includeForecast?: boolean;
}

export function CompactExportButtons({ 
  country, 
  donor, 
  sector, 
  year, 
  includeForecast = false 
}: CompactExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);
  const { toast } = useToast();

  const buildExportUrl = (format: 'csv' | 'pdf') => {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (donor) params.append('donor', donor);
    if (sector) params.append('sector', sector);
    if (year) params.append('year', year.toString());
    if (includeForecast) params.append('include_forecast', 'true');
    
    return `/api/export/${format}?${params.toString()}`;
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(format);
    
    try {
      const response = await fetch(buildExportUrl(format));
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filters = [country, donor, sector, year].filter(Boolean).join('_');
      const filename = `aid_data_${filters ? filters + '_' : ''}${timestamp}.${format}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${format.toUpperCase()} file downloaded successfully`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to download ${format.toUpperCase()} file. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting !== null}
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 transition-colors"
      >
        {isExporting === 'csv' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Download className="mr-1 h-3 w-3" />
        )}
        Export CSV
      </Button>
      
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting !== null}
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 transition-colors"
      >
        {isExporting === 'pdf' ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <FileText className="mr-1 h-3 w-3" />
        )}
        PDF Report
      </Button>
    </div>
  );
}
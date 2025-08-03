import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  country?: string;
  donor?: string;
  sector?: string;
  year?: number;
  startYear?: number;
  endYear?: number;
  includeForecast?: boolean;
  className?: string;
}

export default function ExportButtons({
  country,
  donor,
  sector,
  year,
  startYear,
  endYear,
  includeForecast = false,
  className = ""
}: ExportButtonsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  const buildParams = () => {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (donor) params.append('donor', donor);
    if (sector) params.append('sector', sector);
    if (year) params.append('year', year.toString());
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    if (includeForecast) params.append('include_forecast', 'true');
    return params.toString();
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const handleCSVExport = async () => {
    setIsExportingCSV(true);
    try {
      const params = buildParams();
      const url = `/api/export/csv?${params}`;
      
      // Generate filename based on filters
      const filenameParts = [];
      if (country) filenameParts.push(country.toLowerCase().replace(/\s+/g, '_'));
      if (sector) filenameParts.push(sector.toLowerCase().replace(/\s+/g, '_'));
      if (year) filenameParts.push(year.toString());
      
      const filename = filenameParts.length > 0 
        ? `${filenameParts.join('_')}_aid_data.csv`
        : 'aid_data.csv';
      
      await downloadFile(url, filename);
      
      toast({
        title: "CSV Export Successful",
        description: "Aid data has been downloaded successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export CSV data",
        variant: "destructive"
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      const params = buildParams();
      const url = `/api/export/pdf?${params}`;
      
      // Generate filename based on filters
      const filenameParts = [];
      if (country) filenameParts.push(country.toLowerCase().replace(/\s+/g, '_'));
      if (sector) filenameParts.push(sector.toLowerCase().replace(/\s+/g, '_'));
      if (year) filenameParts.push(year.toString());
      
      const filename = filenameParts.length > 0 
        ? `${filenameParts.join('_')}_report.pdf`
        : 'aid_report.pdf';
      
      await downloadFile(url, filename);
      
      toast({
        title: "PDF Report Generated",
        description: "Your comprehensive aid analysis report has been downloaded.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed", 
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const isCompact = className?.includes('compact');
  
  return (
    <Card className={`${className}`}>
      <CardContent className={isCompact ? "p-2" : "p-4"}>
        <div className={`flex ${isCompact ? 'flex-row space-x-2' : 'flex-col space-y-3'}`}>
          {!isCompact && <h4 className="font-semibold text-gray-800 mb-2">Export Data</h4>}
          
          <Button
            onClick={handleCSVExport}
            disabled={isExportingCSV}
            variant="outline"
            className={`${isCompact ? 'justify-center' : 'w-full justify-start'} gap-2`}
            size={isCompact ? "sm" : "default"}
          >
            {isExportingCSV ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {!isCompact && (isExportingCSV ? 'Exporting...' : 'Export CSV')}
          </Button>
          
          <Button
            onClick={handlePDFExport}
            disabled={isExportingPDF}
            variant="outline"
            className={`${isCompact ? 'justify-center' : 'w-full justify-start'} gap-2`}
            size={isCompact ? "sm" : "default"}
          >
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {!isCompact && (isExportingPDF ? 'Generating...' : 'Download PDF Report')}
          </Button>
          
          {!isCompact && (country || sector || year) && (
            <div className="text-xs text-gray-500 mt-2">
              <p>Filters applied:</p>
              {country && <p>• Country: {country}</p>}
              {sector && <p>• Sector: {sector}</p>}
              {year && <p>• Year: {year}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { useQuery } from "@tanstack/react-query";

// TypeScript interface for FastAPI response
interface AidStats {
  total_aid: string;
  countries_count: number;
  active_donors: number;
  top_recipients: Array<{
    name: string;
    region: string;
    amount: string;
  }>;
  aid_trends: Array<{
    year: number;
    amount: number;
  }>;
  sector_distribution: Array<{
    sector: string;
    amount: number;
    percentage: number;
  }>;
  top_donors: Array<{
    name: string;
    type: string;
    amount: string;
  }>;
  regional_distribution: Array<{
    region: string;
    amount: string;
    percentage: number;
    countries: number;
  }>;
}

export function useAidData() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  return {
    stats: stats as AidStats | undefined,
    isLoading,
    error,
  };
}

export function useCountries() {
  return useQuery({
    queryKey: ['/api/countries/'],
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDonors() {
  return useQuery({
    queryKey: ['/api/donors/'],
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ['/api/sectors/'],
    enabled: true,
    staleTime: 0,
    gcTime: 0, // TanStack Query v5 uses gcTime instead of cacheTime
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useAidRecords(filters?: {
  year?: number;
  countryId?: string;
  sectorId?: string;
  donorId?: string;
}) {
  return useQuery({
    queryKey: ['/api/aid-records', filters],
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCountryIntelligence(countryName: string) {
  return useQuery({
    queryKey: [`/api/countries/${countryName}/intelligence/`],
    enabled: !!countryName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMapData(filters?: {
  year?: string;
  sector?: string;
  donor?: string;
}) {
  return useQuery({
    queryKey: ['/api/map/countries', filters],
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

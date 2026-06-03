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

export interface Country {
  id: string;
  name: string;
  iso_code: string;
  region: string;
  latitude: number | string;
  longitude: number | string;
}

export interface Sector {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Donor {
  id: string;
  name: string;
  donor_type?: string;
  country?: string;
}

// Build a "/path?query" string from a base path and a filters object,
// skipping empty/"all" values. Used so filtered queries hit a valid URL
// instead of the default queryFn joining an object into the path.
function buildUrl(path: string, filters?: Record<string, string | number | undefined>): string {
  if (!filters) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== "all") {
      params.append(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function useAidData() {
  const { data: stats, isLoading, error } = useQuery<AidStats>({
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
  return useQuery<Country[]>({
    queryKey: ['/api/countries/'],
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDonors() {
  return useQuery<Donor[]>({
    queryKey: ['/api/donors/'],
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSectors() {
  return useQuery<Sector[]>({
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
    queryFn: () => fetch(buildUrl('/api/aid-records', filters)).then((res) => res.json()),
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
    queryFn: () => fetch(buildUrl('/api/map/countries', filters)).then((res) => res.json()),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

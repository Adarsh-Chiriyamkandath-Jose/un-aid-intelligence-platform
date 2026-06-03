import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Map, TrendingUp, Globe, DollarSign } from "lucide-react";

interface MapData {
  id: string;
  name: string;
  isoCode: string;
  region: string;
  latitude: string;
  longitude: string;
  totalAid: number;
  aidIntensity: number;
  aidCount: number;
}

interface MapFilters {
  year?: string;
  sector?: string;
  donor?: string;
}

export default function WorldMap() {
  const [selectedCountry, setSelectedCountry] = useState<MapData | null>(null);
  const [filters, setFilters] = useState<MapFilters>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Force invalidate cache on mount
  useEffect(() => {
    queryClient.clear(); // Clear entire cache
  }, [queryClient]);

  const { data: mapData, isLoading } = useQuery<MapData[]>({
    queryKey: ['/api/map/countries', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== 'all') params.append('year', filters.year);
      if (filters.sector && filters.sector !== 'all') params.append('sector', filters.sector);
      if (filters.donor && filters.donor !== 'all') params.append('donor', filters.donor);
      
      const url = `/api/map/countries${params.toString() ? '?' + params.toString() : ''}`;
      return fetch(url).then(res => res.json());
    },
    enabled: true,
  });

  const { data: countries } = useQuery<any[]>({
    queryKey: ['/api/countries/'],
    enabled: true,
  });

  const { data: sectors } = useQuery<any[]>({
    queryKey: ['/api/sectors/'],
    enabled: true,
  });

  const { data: donors } = useQuery<any[]>({
    queryKey: ['/api/donors'],
    enabled: true,
  });

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current || !mapData || !Array.isArray(mapData) || mapData.length === 0) return;

    // Wait for MapLibre GL to load (loaded async via CDN in index.html)
    const initMap = () => {
      if (typeof window.maplibregl === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }

      // MapLibre GL is an open-source, token-free drop-in for Mapbox GL.
      // OpenFreeMap provides a free hosted style (no API key, no usage limits).
      const map = new window.maplibregl.Map({
        container: mapRef.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [77.2090, 28.6139], // Centered on India (largest recipient)
        zoom: 2
      });

      map.on('load', () => {
        // Add country aid data as source
        const countryFeatures = mapData.map(country => ({
          type: 'Feature',
          properties: {
            name: country.name,
            totalAid: country.totalAid,
            aidIntensity: country.aidIntensity,
            region: country.region,
            isoCode: country.isoCode
          },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(country.longitude), parseFloat(country.latitude)]
          }
        }));

        map.addSource('aid-data', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: countryFeatures
          }
        });

        // Add circle layer for aid visualization
        map.addLayer({
          id: 'aid-circles',
          type: 'circle',
          source: 'aid-data',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'aidIntensity'],
              0, 5,
              10, 30
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'aidIntensity'],
              0, '#e2e8f0',
              2, '#3b82f6',
              4, '#1d4ed8',
              6, '#1e40af',
              10, '#7c3aed'
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-opacity': 0.8
          }
        });

        // Add click event for country selection
        map.on('click', 'aid-circles', (e: any) => {
          const feature = e.features[0];
          const countryData = mapData.find(c => c.name === feature.properties.name);
          if (countryData) {
            setSelectedCountry(countryData);
          }
        });

        // Change cursor on hover
        map.on('mouseenter', 'aid-circles', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'aid-circles', () => {
          map.getCanvas().style.cursor = '';
        });
      });
    };

    initMap();
  }, [mapData]);



  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-200";
    if (intensity < 2) return "bg-blue-200";
    if (intensity < 4) return "bg-blue-400";
    if (intensity < 6) return "bg-blue-600";
    return "bg-purple-700";
  };

  // Select a default country for demo
  useEffect(() => {
    if (mapData && Array.isArray(mapData) && mapData.length > 0 && !selectedCountry) {
      setSelectedCountry(mapData[0]);
    }
  }, [mapData, selectedCountry]);

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <p className="eyebrow">Filters</p>
          <CardTitle className="mt-1 flex items-center gap-2 text-lg">
            <Map className="h-5 w-5 text-primary" />
            Refine the view
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Year</label>
              <Select value={filters.year} onValueChange={(value) => setFilters({...filters, year: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                  <SelectItem value="2019">2019</SelectItem>
                  <SelectItem value="2018">2018</SelectItem>
                  <SelectItem value="2017">2017</SelectItem>
                  <SelectItem value="2016">2016</SelectItem>
                  <SelectItem value="2015">2015</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Sector</label>
              <Select value={filters.sector} onValueChange={(value) => setFilters({...filters, sector: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors && Array.isArray(sectors) && sectors
                    .sort((a: any, b: any) => {
                      // Custom sort function for proper Roman numeral ordering
                      const parseRomanAndNumbers = (name: string) => {
                        // Extract Roman numeral, numbers, and letters from sector names like "I.2.b. Basic Health"
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
                      
                      // Sort by Roman numeral first, then number, then letter
                      if (aParsed.roman !== bParsed.roman) return aParsed.roman - bParsed.roman;
                      if (aParsed.num !== bParsed.num) return aParsed.num - bParsed.num;
                      if (aParsed.letter !== bParsed.letter) return aParsed.letter.localeCompare(bParsed.letter);
                      return aParsed.original.localeCompare(bParsed.original);
                    })
                    .map((sector: any) => {
                      const displayName = sector.name;
                      return (
                        <SelectItem key={sector.id} value={sector.name.toLowerCase()}>
                          {displayName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Donor</label>
              <Select value={filters.donor} onValueChange={(value) => setFilters({...filters, donor: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select donor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Donors</SelectItem>
                  {donors && Array.isArray(donors) && donors.map((donor: any) => (
                    <SelectItem key={donor.id} value={donor.name.toLowerCase()}>
                      {donor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Distribution</p>
              <CardTitle className="mt-1 text-lg">Global Aid Distribution</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              {/* Legend */}
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <span className="text-xs font-medium text-muted-foreground">Intensity</span>
                <div className="h-3 w-3 rounded-sm bg-sky-200" />
                <div className="h-3 w-3 rounded-sm bg-primary/60" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
                <div className="h-3 w-3 rounded-sm bg-violet-600" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Map Container */}
          <div
            ref={mapRef}
            className="relative h-[600px] overflow-hidden rounded-xl border border-border bg-secondary/40"
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/40">
                <div className="text-center">
                  <div className="spinner-un mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading map data…</p>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {!isLoading && mapData && Array.isArray(mapData) && mapData.length === 0 && (filters.year || filters.sector || filters.donor) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/40">
                <div className="surface surface-raised max-w-sm p-8 text-center">
                  <div className="mb-3 text-5xl">📊</div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">No Aid Data Available</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    No aid records found for the selected filters:
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {filters.year && <p>Year: {filters.year}</p>}
                    {filters.sector && filters.sector !== 'all' && <p>Sector: {filters.sector}</p>}
                    {filters.donor && filters.donor !== 'all' && <p>Donor: {filters.donor}</p>}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground/70">
                    Try adjusting your filters or selecting different years
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Country Details Panel */}
          {selectedCountry && (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="eyebrow mb-2">Selected Country</p>
                <p className="text-lg font-semibold text-foreground">{selectedCountry.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Total Aid:{" "}
                  <span className="stat-num font-medium text-foreground">
                    {selectedCountry.totalAid >= 1000
                      ? `$${(selectedCountry.totalAid / 1000).toFixed(1)}M`
                      : selectedCountry.totalAid >= 1
                      ? `$${selectedCountry.totalAid.toFixed(1)}K`
                      : `$${(selectedCountry.totalAid * 1000).toFixed(0)}`}
                  </span>
                </p>
                <Badge variant="outline" className="mt-3">
                  {selectedCountry.region}
                </Badge>
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="eyebrow mb-2">Aid Intensity</p>
                <div className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded ${getIntensityColor(selectedCountry.aidIntensity)}`} />
                  <span className="text-lg font-semibold text-foreground">
                    {selectedCountry.aidIntensity > 0 ? "High" : "Low"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Intensity Score:{" "}
                  <span className="stat-num">{selectedCountry.aidIntensity.toFixed(1)}</span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="eyebrow mb-2">Aid Records</p>
                <p className="stat-num text-2xl font-semibold text-foreground">
                  {selectedCountry.aidCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total aid transactions</p>
                <Badge variant="secondary" className="mt-3">
                  {selectedCountry.isoCode}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

  const { data: mapData, isLoading } = useQuery({
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

  const { data: countries } = useQuery({
    queryKey: ['/api/countries/'],
    enabled: true,
  });

  const { data: sectors } = useQuery({
    queryKey: ['/api/sectors/'],
    enabled: true,
  });

  const { data: donors } = useQuery({
    queryKey: ['/api/donors'],
    enabled: true,
  });

  // Initialize Mapbox when component mounts
  useEffect(() => {
    if (!mapRef.current || !mapData || !Array.isArray(mapData) || mapData.length === 0) return;

    // Wait for Mapbox GL to load
    const initMap = () => {
      if (typeof window.mapboxgl === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }

      window.mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
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
        map.on('click', 'aid-circles', (e) => {
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
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Interactive World Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Donor</label>
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
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Global Aid Distribution</CardTitle>
            <div className="flex items-center space-x-4">
              {/* Legend */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-blue-200 rounded" />
                <span className="text-gray-600">Low</span>
                <div className="w-4 h-4 bg-blue-400 rounded" />
                <span className="text-gray-600">Medium</span>
                <div className="w-4 h-4 bg-blue-700 rounded" />
                <span className="text-gray-600">High</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mapbox Container */}
          <div 
            ref={mapRef}
            className="h-[600px] rounded-lg overflow-hidden relative border"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading map data...</p>
                </div>
              </div>
            )}
            
            {/* No Data Message */}
            {!isLoading && mapData && Array.isArray(mapData) && mapData.length === 0 && (filters.year || filters.sector || filters.donor) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="text-gray-500 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Aid Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    No aid records found for the selected filters:
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    {filters.year && <p>Year: {filters.year}</p>}
                    {filters.sector && filters.sector !== 'all' && <p>Sector: {filters.sector}</p>}
                    {filters.donor && filters.donor !== 'all' && <p>Donor: {filters.donor}</p>}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Try adjusting your filters or selecting different years
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Country Details Panel */}
          {selectedCountry && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-800 mb-2">Selected Country</h4>
                <p className="text-lg font-bold text-blue-600">{selectedCountry.name}</p>
                <p className="text-sm text-gray-600">
                  Total Aid: {
                    selectedCountry.totalAid >= 1000 
                      ? `$${(selectedCountry.totalAid/1000).toFixed(1)}M`
                      : selectedCountry.totalAid >= 1
                      ? `$${selectedCountry.totalAid.toFixed(1)}K`  
                      : `$${(selectedCountry.totalAid * 1000).toFixed(0)}`
                  }
                </p>
                <Badge variant="outline" className="mt-2">
                  {selectedCountry.region}
                </Badge>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-800 mb-2">Aid Intensity</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getIntensityColor(selectedCountry.aidIntensity)}`} />
                  <span className="text-lg font-bold text-purple-600">
                    {selectedCountry.aidIntensity > 0 ? "High" : "Low"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Intensity Score: {selectedCountry.aidIntensity.toFixed(1)}
                </p>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-800 mb-2">Aid Records</h4>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCountry.aidCount || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total aid transactions
                  </p>
                </div>
                <Badge variant="secondary" className="mt-2">
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

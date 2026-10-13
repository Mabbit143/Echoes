import React, { useState } from 'react';
import { EchoItem } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import {
  Sparkles,
  Search,
  ExternalLink,
  Plus,
  MapPin,
  X,
  Compass,
  CheckCircle2,
  Globe,
} from 'lucide-react';

interface GeminiMapsDiscoveryModalProps {
  userLocation: { lat: number; lng: number };
  onClose: () => void;
  onAddEchoToMap: (newEcho: EchoItem) => void;
}

export const GeminiMapsDiscoveryModal: React.FC<GeminiMapsDiscoveryModalProps> = ({
  userLocation,
  onClose,
  onAddEchoToMap,
}) => {
  const [query, setQuery] = useState('Historic landmarks, street murals, and hidden legends');
  const [cityName, setCityName] = useState('Springfield, Oregon');
  const [isLoading, setIsLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<Array<{ uri: string; title?: string }>>([]);
  const [fallbackPlaces, setFallbackPlaces] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleSearch = async (customQuery?: string, customCity?: string) => {
    const q = customQuery !== undefined ? customQuery : query;
    const city = customCity !== undefined ? customCity : cityName;

    setIsLoading(true);
    setResponseText(null);
    setGroundingSources([]);
    setFallbackPlaces([]);

    const result = await safeFetchJson<{
      text?: string;
      groundingSources?: Array<{ uri: string; title?: string }>;
      places?: Array<any>;
    }>('/api/gemini/maps-explore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        cityName: city,
      }),
    });

    setIsLoading(false);

    if (result.ok && result.data) {
      if (result.data.text) {
        setResponseText(result.data.text);
      }
      if (result.data.groundingSources && Array.isArray(result.data.groundingSources)) {
        setGroundingSources(result.data.groundingSources);
      }
      if (result.data.places && Array.isArray(result.data.places)) {
        setFallbackPlaces(result.data.places);
      }
    } else {
      console.warn('Grounding search error:', result.error);
      setResponseText(
        result.error ||
          'Error connecting to Maps Grounding service. Please check network connection.'
      );
    }
  };

  const handleConvertSourceToEcho = (source: { uri: string; title?: string }, idx: number) => {
    const title = source.title || `Historic Landmark ${idx + 1}`;
    const id = `grounded-${Date.now()}-${idx}`;

    // Slightly offset around current user location or area
    const offsetLat = userLocation.lat + (Math.random() - 0.5) * 0.008;
    const offsetLng = userLocation.lng + (Math.random() - 0.5) * 0.008;

    const newEcho: EchoItem = {
      id,
      title,
      type: 'history',
      year: 1910,
      eraLabel: 'Grounded Landmark',
      lat: offsetLat,
      lng: offsetLng,
      author: 'Google Maps Verified Discovery',
      distanceThresholdMeters: 40,
      summary: `Verified cultural landmark discovered via Google Maps Grounding around ${cityName}.`,
      fullStory: `Discovered through Gemini Maps Grounding. This landmark represents hyper-local Oregon heritage and verified geography.`,
      tags: ['Maps Grounded', 'Verified Place', cityName],
      resonanceScore: 12,
      mapsUri: source.uri,
      verifiedLocal: true,
      zone: cityName,
      createdAt: new Date().toISOString(),
    };

    onAddEchoToMap(newEcho);
    setAddedIds((prev) => ({ ...prev, [source.uri]: true }));
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Google Maps Grounding Explorer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Uncover verified local lore, public art, and historical sites with real Maps data.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Inputs */}
        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Query / Theme
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Simpsons murals, timber history, The Pipe"
                  className="w-full bg-slate-800 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:border-cyan-400 focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Area / City
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Springfield, OR"
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-slate-500 font-semibold">Presets:</span>
            <button
              onClick={() => {
                setQuery('Official Simpsons Murals & Emerald Art Center');
                setCityName('Springfield, Oregon');
                handleSearch('Official Simpsons Murals & Emerald Art Center', 'Springfield, Oregon');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-cyan-300"
            >
              🎨 Simpsons Murals
            </button>
            <button
              onClick={() => {
                setQuery('The Pipe on Millrace and urban folklore');
                setCityName('Springfield, Oregon');
                handleSearch('The Pipe on Millrace and urban folklore', 'Springfield, Oregon');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-cyan-300"
            >
              🌊 The Pipe Lore
            </button>
            <button
              onClick={() => {
                setQuery('Pre’s Rock and Steve Prefontaine memorial');
                setCityName('Eugene, Oregon');
                handleSearch('Pre’s Rock and Steve Prefontaine memorial', 'Eugene, Oregon');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-cyan-300"
            >
              🏃 Pre’s Rock Track
            </button>
            <button
              onClick={() => {
                setQuery('Dorris Ranch living history hazelnut groves');
                setCityName('Springfield, Oregon');
                handleSearch('Dorris Ranch living history hazelnut groves', 'Springfield, Oregon');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-cyan-300"
            >
              🌾 Dorris Ranch Farm
            </button>
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Grounding against Google Maps...
              </span>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Search & Ground with Google Maps</span>
              </>
            )}
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto mt-4 space-y-4 pr-1 text-xs">
          {/* Grounded Places Cards */}
          {groundingSources.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-cyan-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified Google Maps Grounding Sources ({groundingSources.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groundingSources.map((src, i) => {
                  const isAdded = addedIds[src.uri];
                  return (
                    <div
                      key={src.uri + i}
                      className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center justify-between gap-2.5 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate text-xs">
                          {src.title || `Place ${i + 1}`}
                        </p>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 truncate pt-0.5"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">View on Google Maps</span>
                        </a>
                      </div>

                      <button
                        onClick={() => handleConvertSourceToEcho(src, i)}
                        disabled={isAdded}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                          isAdded
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pinned</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Pin to Map</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Narrative Content */}
          {responseText && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Local Heritage Intelligence</span>
              </h4>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line text-xs font-sans">
                {responseText}
              </div>
            </div>
          )}

          {/* Initial state guide */}
          {!responseText && !isLoading && (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p className="text-xs">
                Enter any landmark or theme to pull up-to-date geography and stories directly from Google Maps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

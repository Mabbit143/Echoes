import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { EchoItem, EchoType } from '../types';

interface RippleMapProps {
  echoes: EchoItem[];
  selectedEcho: EchoItem | null;
  userLocation: { lat: number; lng: number };
  activeFilter: EchoType | 'all';
  timeSliderYear: number;
  isHistoricalMode?: boolean;
  isDropMode: boolean;
  onSelectEcho: (echo: EchoItem) => void;
  onMapClickForDrop: (lat: number, lng: number) => void;
}

export const RippleMap: React.FC<RippleMapProps> = ({
  echoes,
  selectedEcho,
  userLocation,
  activeFilter,
  timeSliderYear,
  isHistoricalMode = false,
  isDropMode,
  onSelectEcho,
  onMapClickForDrop,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // Esri World Dark Gray Canvas basemap - clean, high performance, zero watermark, no API key required
    const baseTileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri &copy; OpenStreetMap contributors',
        maxZoom: 16,
      }
    ).addTo(map);

    // Reference labels overlay
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
        maxZoom: 16,
      }
    ).addTo(map);

    // Fallback CartoDB Dark Matter tile layer in case ArcGIS is slow or blocked
    let fallbackLayer: L.TileLayer | null = null;
    baseTileLayer.on('tileerror', () => {
      if (!fallbackLayer) {
        console.warn('Primary map tiles encountering issues, mounting fallback layer.');
        fallbackLayer = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; CartoDB &copy; OpenStreetMap',
            maxZoom: 19,
            subdomains: 'abcd',
          }
        ).addTo(map);
      }
    });

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Fix grey/blank tile issue by invalidating map size once DOM layout is settled
    const invalidateTimer1 = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    const invalidateTimer2 = setTimeout(() => {
      map.invalidateSize();
    }, 800);

    // ResizeObserver ensures map recalibrates if window, panel, or modal resizes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Click handler for dropping pins
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (e.latlng && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        onMapClickForDrop(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      clearTimeout(invalidateTimer1);
      clearTimeout(invalidateTimer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const userHtml = `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 pointer-events-none">
        <div class="absolute w-10 h-10 rounded-full bg-cyan-500/20 animate-ping"></div>
        <div class="absolute w-7 h-7 rounded-full bg-cyan-400/30 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_8px_#38bdf8]"></div>
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest text-cyan-200 uppercase bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-500/40">You</div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'user-location-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Center on selected Echo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEcho) return;

    map.flyTo([selectedEcho.lat, selectedEcho.lng], 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedEcho]);

  // Render echoes with animated glowing ripples scaled by upvote resonance
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filteredEchoes = echoes.filter((echo) => {
      if (activeFilter !== 'all' && echo.type !== activeFilter) return false;
      return true;
    });

    filteredEchoes.forEach((echo) => {
      // Coordinate sanity check: prevent invalid lat/lng from crashing the entire map
      if (
        typeof echo.lat !== 'number' ||
        typeof echo.lng !== 'number' ||
        isNaN(echo.lat) ||
        isNaN(echo.lng)
      ) {
        console.warn('Skipping echo with invalid coordinates:', echo.id);
        return;
      }

      try {
        const isSelected = selectedEcho?.id === echo.id;
        const isHistoricalMatch = !echo.year || echo.year <= timeSliderYear;
        const opacity = isHistoricalMatch ? '1' : isHistoricalMode ? '0.1' : '0.25';

        // Resonance intensity scaling (community upvotes make pin radiate wider)
        const isLegendary = (echo.resonanceScore || 0) >= 400;
        const isTrending = (echo.resonanceScore || 0) >= 150;

        // Colors and ripple styles by type
        let ringColor = 'border-amber-400/70 bg-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.6)]';
        let centerColor = 'bg-amber-400 text-slate-950';
        let rippleWaveColor = 'border-amber-400/40 bg-amber-400/10';
        let tagBadge = echo.year ? `${echo.year}` : 'Hist';

        if (echo.type === 'whisper') {
          ringColor = 'border-cyan-400/80 bg-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.7)]';
          centerColor = 'bg-cyan-400 text-slate-950';
          rippleWaveColor = 'border-cyan-400/50 bg-cyan-400/15';
          tagBadge = echo.isLockedWhisper || echo.isPrivateWhisper ? '🔒 Whisper' : 'Whisper';
        } else if (echo.type === 'shout') {
          ringColor = 'border-rose-400/80 bg-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.7)]';
          centerColor = 'bg-rose-400 text-slate-950';
          rippleWaveColor = 'border-rose-400/50 bg-rose-400/15';
          tagBadge = 'Shout';
        } else if (echo.type === 'quest') {
          ringColor = 'border-emerald-400/80 bg-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.7)]';
          centerColor = 'bg-emerald-400 text-slate-950';
          rippleWaveColor = 'border-emerald-400/50 bg-emerald-400/15';
          tagBadge = `Quest ${echo.questStep || 1}`;
        }

        // Add extra halo if community upvoted heavily
        const haloClass = isLegendary
          ? 'ring-4 ring-amber-400/40 animate-pulse'
          : isTrending
          ? 'ring-2 ring-cyan-400/40'
          : '';

        const markerHtml = `
          <div class="relative flex items-center justify-center w-14 h-14 -ml-7 -mt-7 cursor-pointer group transition-all duration-300" style="opacity: ${opacity}">
            <!-- Radiating Ripple Waves -->
            <div class="absolute w-14 h-14 rounded-full border ${rippleWaveColor} animate-ripple pointer-events-none"></div>
            <div class="absolute w-14 h-14 rounded-full border ${rippleWaveColor} animate-ripple-delayed pointer-events-none"></div>
            
            ${isLegendary ? `<div class="absolute w-20 h-20 rounded-full border border-amber-400/20 animate-ping pointer-events-none"></div>` : ''}

            <!-- Selected aura glow -->
            ${isSelected ? '<div class="absolute w-16 h-16 rounded-full bg-white/20 animate-pulse"></div>' : ''}

            <!-- Outer boundary ring -->
            <div class="w-8 h-8 rounded-full border-2 ${ringColor} ${haloClass} flex items-center justify-center backdrop-blur-xs transition-transform duration-200 group-hover:scale-125">
              <div class="w-3.5 h-3.5 rounded-full ${centerColor} font-bold flex items-center justify-center text-[8px]">
                ${echo.isLockedWhisper || echo.isPrivateWhisper ? '•' : ''}
              </div>
            </div>

            <!-- Micro tooltip label with community resonance -->
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900/90 text-slate-200 border border-slate-700/80 shadow-md opacity-85 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <span>${tagBadge}</span>
              ${echo.resonanceScore ? `<span class="text-amber-400 font-mono text-[9px] font-bold">★${echo.resonanceScore}</span>` : ''}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'echo-ripple-marker',
          iconSize: [56, 56],
          iconAnchor: [28, 28],
        });

        const marker = L.marker([echo.lat, echo.lng], { icon: customIcon });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectEcho(echo);
        });

        marker.addTo(markersLayer);
      } catch (err) {
        console.error('Error creating marker for echo:', echo.id, err);
      }
    });
  }, [echoes, activeFilter, timeSliderYear, isHistoricalMode, selectedEcho]);

  return (
    <div className={`relative w-full h-full transition-all duration-700 ${
      isHistoricalMode ? 'filter sepia-[0.55] contrast-[1.12] brightness-[0.88]' : ''
    }`}>
      {/* Leaflet map mount */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Historical Archival Vignette Overlay */}
      {isHistoricalMode && (
        <div className="absolute inset-0 pointer-events-none border-[12px] border-amber-950/40 shadow-[inset_0_0_100px_rgba(120,53,15,0.4)] z-[500]" />
      )}

      {/* Drop Mode Active Banner */}
      {isDropMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-cyan-950/90 border border-cyan-500/80 text-cyan-200 px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 backdrop-blur-md animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          Click any spot on the map to drop an Echo or Whisper!
        </div>
      )}
    </div>
  );
};

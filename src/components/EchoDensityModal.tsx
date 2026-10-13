import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  X,
  Activity,
  Flame,
  Radio,
  MapPin,
  Sparkles,
  TrendingUp,
  Compass,
  ArrowRight,
  BarChart3,
  Radar as RadarIcon,
  ShieldAlert,
} from 'lucide-react';
import { EchoItem } from '../types';

export interface TeleportZone {
  name: string;
  lat: number;
  lng: number;
  label: string;
}

interface EchoDensityModalProps {
  isOpen: boolean;
  onClose: () => void;
  echoes: EchoItem[];
  zones: TeleportZone[];
  activeZoneName: string;
  onTeleportToZone: (zone: TeleportZone) => void;
}

// Compute distance in km between two lat/lng coordinates (Haversine formula)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function EchoDensityModal({
  isOpen,
  onClose,
  echoes,
  zones,
  activeZoneName,
  onTeleportToZone,
}: EchoDensityModalProps) {
  const [chartMode, setChartMode] = useState<'histogram' | 'resonance' | 'radar'>('histogram');
  const [selectedZoneName, setSelectedZoneName] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'resonance' | 'density' | 'whispers' | 'name'>('resonance');

  // Process Echoes and calculate density per zone
  const zoneStats = useMemo(() => {
    return zones.map((zone) => {
      // Find echoes assigned directly to zone or physically closest to this zone
      const zoneEchoes = echoes.filter((echo) => {
        if (echo.zone && echo.zone.toLowerCase() === zone.name.toLowerCase()) {
          return true;
        }
        // If no strict string match, calculate distance to closest zone
        if (typeof echo.lat === 'number' && typeof echo.lng === 'number') {
          const distToThis = getDistanceKm(echo.lat, echo.lng, zone.lat, zone.lng);
          // Check if this zone is the closest among all zones and within 4.5km
          if (distToThis <= 4.5) {
            let isClosest = true;
            for (const other of zones) {
              if (other.name !== zone.name) {
                const distOther = getDistanceKm(echo.lat, echo.lng, other.lat, other.lng);
                if (distOther < distToThis) {
                  isClosest = false;
                  break;
                }
              }
            }
            return isClosest;
          }
        }
        return false;
      });

      const whispers = zoneEchoes.filter((e) => e.type === 'whisper');
      const shouts = zoneEchoes.filter((e) => e.type === 'shout');
      const history = zoneEchoes.filter((e) => e.type === 'history');
      const quests = zoneEchoes.filter((e) => e.type === 'quest');

      const totalResonance = zoneEchoes.reduce((sum, e) => sum + (e.resonanceScore || 0), 0);
      const avgResonance = zoneEchoes.length > 0 ? Math.round(totalResonance / zoneEchoes.length) : 0;

      // Find top resonant echo in this zone
      const topEcho = zoneEchoes.slice().sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0))[0] || null;

      // Clean short label for chart axis
      const shortName = zone.name.replace('Springfield ', '').replace('Eugene ', '');

      return {
        zone,
        name: zone.name,
        shortName,
        label: zone.label || '',
        whisperCount: whispers.length,
        shoutCount: shouts.length,
        historyCount: history.length,
        questCount: quests.length,
        totalDensity: zoneEchoes.length,
        totalResonance,
        avgResonance,
        topEcho,
        echoes: zoneEchoes,
      };
    });
  }, [zones, echoes]);

  // Sorted list based on user preference
  const sortedStats = useMemo(() => {
    return [...zoneStats].sort((a, b) => {
      if (sortBy === 'resonance') return b.totalResonance - a.totalResonance;
      if (sortBy === 'density') return b.totalDensity - a.totalDensity;
      if (sortBy === 'whispers') return b.whisperCount - a.whisperCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [zoneStats, sortBy]);

  // Overall leader metrics
  const peakResonantZone = useMemo(() => {
    return [...zoneStats].sort((a, b) => b.totalResonance - a.totalResonance)[0];
  }, [zoneStats]);

  const peakDensityZone = useMemo(() => {
    return [...zoneStats].sort((a, b) => b.totalDensity - a.totalDensity)[0];
  }, [zoneStats]);

  const totalGlobalResonance = useMemo(() => {
    return zoneStats.reduce((sum, z) => sum + z.totalResonance, 0);
  }, [zoneStats]);

  if (!isOpen) return null;

  const currentDetailZone = selectedZoneName
    ? zoneStats.find((z) => z.name === selectedZoneName) || peakResonantZone
    : peakResonantZone;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Echo Density & Resonance Radar
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Recharts Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Density breakdown of whispers, shouts & history across teleport zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL CONTENT SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Most Resonant Area */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900/80 border border-amber-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Peak Resonance
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {peakResonantZone?.totalResonance || 0} pts
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-white truncate">
                {peakResonantZone?.name || 'Unknown'}
              </div>
              <div className="text-[11px] text-amber-200/80 mt-0.5 truncate">
                {peakResonantZone?.topEcho?.title || 'Highest collective resonance'}
              </div>
            </div>

            {/* Density Leader */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border border-cyan-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  Density Leader
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {peakDensityZone?.totalDensity || 0} echoes
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-white truncate">
                {peakDensityZone?.name || 'Unknown'}
              </div>
              <div className="text-[11px] text-cyan-200/80 mt-0.5 truncate">
                Most echoes recorded
              </div>
            </div>

            {/* Total Global Energy */}
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Total Resonance
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {totalGlobalResonance}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-white">
                {echoes.length} Echoes Total
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Across {zones.length} active sectors
              </div>
            </div>

            {/* Current Teleport Sector */}
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-cyan-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Current Sector
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ACTIVE
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-white truncate">
                {activeZoneName}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                User location simulated
              </div>
            </div>
          </div>

          {/* VISUALIZATION PANEL WITH RECHARTS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  View Mode:
                </span>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setChartMode('histogram')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartMode === 'histogram'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Stacked Density Histogram</span>
                  </button>

                  <button
                    onClick={() => setChartMode('resonance')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartMode === 'resonance'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Resonance Energy Score</span>
                  </button>

                  <button
                    onClick={() => setChartMode('radar')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartMode === 'radar'
                        ? 'bg-purple-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <RadarIcon className="w-3.5 h-3.5" />
                    <span>Multi-Zone Radar</span>
                  </button>
                </div>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="resonance">Resonance Score (Desc)</option>
                  <option value="density">Total Density (Desc)</option>
                  <option value="whispers">Whisper Count</option>
                  <option value="name">Zone Name</option>
                </select>
              </div>
            </div>

            {/* CHART RENDER CONTAINER */}
            <div className="w-full h-72 sm:h-80">
              {chartMode === 'histogram' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedStats}
                    margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        setSelectedZoneName(e.activePayload[0].payload.name);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="shortName"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-cyan-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs max-w-xs">
                            <div className="font-bold text-white text-sm border-b border-slate-800 pb-1 mb-2 flex items-center justify-between">
                              <span>{data.name}</span>
                              <span className="text-amber-400 font-mono text-xs">{data.totalResonance} pts</span>
                            </div>
                            <div className="space-y-1 text-slate-300">
                              <div className="flex justify-between items-center text-cyan-400">
                                <span>🔒 Whispers:</span>
                                <span className="font-bold">{data.whisperCount}</span>
                              </div>
                              <div className="flex justify-between items-center text-rose-400">
                                <span>📢 Shouts & Colabs:</span>
                                <span className="font-bold">{data.shoutCount}</span>
                              </div>
                              <div className="flex justify-between items-center text-amber-400">
                                <span>🏛️ Archival History:</span>
                                <span className="font-bold">{data.historyCount}</span>
                              </div>
                              {data.questCount > 0 && (
                                <div className="flex justify-between items-center text-emerald-400">
                                  <span>🎯 Quests:</span>
                                  <span className="font-bold">{data.questCount}</span>
                                </div>
                              )}
                              <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between font-bold text-white">
                                <span>Total Density:</span>
                                <span>{data.totalDensity} Echoes</span>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] text-cyan-300/80 italic">
                              Click bar or zone card below to teleport!
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                      formatter={(val) => <span className="text-slate-300">{val}</span>}
                    />
                    <Bar
                      dataKey="whisperCount"
                      name="Whispers (Secret/Audio)"
                      stackId="density"
                      fill="#06b6d4"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="shoutCount"
                      name="Shouts (Community Colabs)"
                      stackId="density"
                      fill="#f43f5e"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="historyCount"
                      name="Archival History"
                      stackId="density"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="questCount"
                      name="Quests & Landmarks"
                      stackId="density"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'resonance' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedStats}
                    margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        setSelectedZoneName(e.activePayload[0].payload.name);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="shortName"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-amber-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs max-w-xs">
                            <div className="font-bold text-white text-sm border-b border-slate-800 pb-1 mb-2">
                              {data.name}
                            </div>
                            <div className="space-y-1.5 text-slate-300">
                              <div className="flex justify-between items-center text-amber-300 font-bold">
                                <span>Total Resonance Energy:</span>
                                <span>{data.totalResonance} pts</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-400">
                                <span>Average per Echo:</span>
                                <span>{data.avgResonance} pts</span>
                              </div>
                              <div className="flex justify-between items-center text-cyan-300">
                                <span>Echo Density:</span>
                                <span>{data.totalDensity} items</span>
                              </div>
                              {data.topEcho && (
                                <div className="border-t border-slate-800 pt-1 mt-1">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold">Most Resonant Item:</div>
                                  <div className="text-white font-medium truncate">{data.topEcho.title}</div>
                                  <div className="text-amber-400 text-[10px]">{data.topEcho.resonanceScore} pts</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                      formatter={(val) => <span className="text-slate-300">{val}</span>}
                    />
                    <Bar
                      dataKey="totalResonance"
                      name="Total Resonance Energy (Points)"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={zoneStats}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} />
                    <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                    <Radar
                      name="Whispers"
                      dataKey="whisperCount"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Shouts"
                      dataKey="shoutCount"
                      stroke="#f43f5e"
                      fill="#f43f5e"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="History"
                      dataKey="historyCount"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.3}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                      formatter={(val) => <span className="text-slate-300">{val}</span>}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ZONE RESONANCE DIRECTORY & TELEPORT ACCORDION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Zone Resonance Breakdown & Instant Teleport</span>
              </h3>
              <span className="text-xs text-slate-400">
                Click a zone to teleport directly on the map
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedStats.map((item) => {
                const isSelected = item.name === currentDetailZone?.name;
                const isUserActive = item.name === activeZoneName;
                const isPeak = item.name === peakResonantZone?.name;

                return (
                  <div
                    key={item.name}
                    onClick={() => setSelectedZoneName(item.name)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Top status badges */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPeak && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            <Flame className="w-3 h-3 fill-amber-400" /> Peak
                          </span>
                        )}
                        {isUserActive && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Current GPS
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.label}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {item.totalResonance} pts
                        </span>
                      </div>
                    </div>

                    {/* Zone Name */}
                    <div className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                      <span>{item.name}</span>
                      <span className="text-xs font-normal text-slate-400">
                        {item.totalDensity} echoes
                      </span>
                    </div>

                    {/* Mini density pill breakdown */}
                    <div className="flex items-center gap-1 text-[11px] mb-3">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono">
                        {item.whisperCount}w
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800/60 text-rose-300 font-mono">
                        {item.shoutCount}s
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 font-mono">
                        {item.historyCount}h
                      </span>
                      {item.questCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-mono">
                          {item.questCount}q
                        </span>
                      )}
                    </div>

                    {/* Top echo teaser */}
                    {item.topEcho && (
                      <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mb-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Most Resonant Echo
                        </div>
                        <div className="font-semibold text-white truncate mt-0.5">
                          {item.topEcho.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.topEcho.summary}
                        </div>
                      </div>
                    )}

                    {/* Teleport Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeleportToZone(item.zone);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-cyan-500/40 text-xs font-bold transition-all group cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Teleport to {item.shortName}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Live telemetry synchronized with Leaflet map markers</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Radar
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { EchoItem, EchoType, ProximityAlert, ColabContribution } from './types';
import { RippleMap } from './components/RippleMap';
import { EchoViewerDrawer } from './components/EchoViewerDrawer';
import { CompassRadar } from './components/CompassRadar';
import { ProximityNotificationBanner } from './components/ProximityNotificationBanner';
import { DropEchoModal } from './components/DropEchoModal';
import { GeminiMapsDiscoveryModal } from './components/GeminiMapsDiscoveryModal';
import { TimeTravelSlider } from './components/TimeTravelSlider';
import { WhisperInviteModal } from './components/WhisperInviteModal';
import { IncomingWhisperInviteBanner } from './components/IncomingWhisperInviteBanner';
import { soundSynth } from './utils/audioSynth';
import {
  Radio,
  Plus,
  Compass,
  Sparkles,
  MapPin,
  SlidersHorizontal,
  Bell,
  RefreshCw,
  LocateFixed,
  Globe,
  Info,
  Lock,
  Send,
} from 'lucide-react';

const MAX_NOTIFICATIONS_PER_ZONE = 3;

// Preset exploration zones in Eugene/Springfield for interactive quick-teleport
const TELEPORT_ZONES = [
  { name: 'Downtown Springfield', lat: 44.0463, lng: -123.0182, label: 'Murals & Cafes' },
  { name: 'Springfield Millrace', lat: 44.0416, lng: -123.0082, label: 'The Pipe & Water' },
  { name: 'Washburne District', lat: 44.0505, lng: -123.0162, label: '1890s Timber' },
  { name: 'South Springfield', lat: 44.0298, lng: -123.0168, label: 'Dorris Ranch' },
  { name: 'Eugene Hills', lat: 44.0435, lng: -123.0488, label: 'Pre’s Rock' },
  { name: 'Eugene Riverfront', lat: 44.0583, lng: -123.0915, label: 'Skinner Butte' },
];

export default function App() {
  const [echoes, setEchoes] = useState<EchoItem[]>([]);
  const [selectedEcho, setSelectedEcho] = useState<EchoItem | null>(null);
  const [radarTargetEcho, setRadarTargetEcho] = useState<EchoItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<EchoType | 'all'>('all');
  const [timeSliderYear, setTimeSliderYear] = useState<number>(2026);
  const [isHistoricalMode, setIsHistoricalMode] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 44.0463,
    lng: -123.0182,
  });
  const [activeZoneName, setActiveZoneName] = useState<string>('Downtown Springfield');

  // Modals & Panels
  const [isDropMode, setIsDropMode] = useState<boolean>(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState<boolean>(false);
  const [dropCoordinates, setDropCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 44.0463,
    lng: -123.0182,
  });
  const [isExploreModalOpen, setIsExploreModalOpen] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<ProximityAlert | null>(null);

  // Whisper Engine: Invitation states
  const [whisperInviteEcho, setWhisperInviteEcho] = useState<EchoItem | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{
    targetEcho: EchoItem;
    key: string;
    sender: string;
  } | null>(null);
  const [activeInviteKey, setActiveInviteKey] = useState<string | undefined>(undefined);

  // Zone Notification Anti-fatigue history { [zoneName]: count }
  const [zoneAlertCounts, setZoneAlertCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('echoes_zone_alert_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Load Echoes from server
  const fetchEchoes = async () => {
    try {
      const res = await fetch('/api/echoes');
      const data = await res.json();
      if (data.echoes && Array.isArray(data.echoes)) {
        setEchoes(data.echoes);
        checkUrlInvite(data.echoes);
      }
    } catch (e) {
      console.error('Failed to load Echoes:', e);
    }
  };

  // Check URL query parameters for Whisper invite (?invite=...&key=...&sender=...)
  const checkUrlInvite = (loadedEchoes: EchoItem[]) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('invite');
      const inviteKey = params.get('key');
      const sender = params.get('sender') || 'A Friend';

      if (inviteId && inviteKey) {
        const found = loadedEchoes.find((e) => e.id === inviteId);
        if (found) {
          setIncomingInvite({ targetEcho: found, key: inviteKey, sender });
          setActiveInviteKey(inviteKey);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchEchoes();
  }, []);

  // Sync alert counts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('echoes_zone_alert_counts', JSON.stringify(zoneAlertCounts));
    } catch (e) {
      // ignore
    }
  }, [zoneAlertCounts]);

  // Request browser Notification permission politely
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Distance helper
  const getDistanceFeet = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 3.28084);
  };

  // Evaluate Area Entry & Trigger Smart Proximity Alert (First few times)
  const triggerZoneEvaluation = (loc: { lat: number; lng: number }, newZoneName?: string) => {
    if (echoes.length === 0) return;

    let nearest: EchoItem = echoes[0];
    let minFeet = Infinity;

    for (const e of echoes) {
      const dist = getDistanceFeet(loc.lat, loc.lng, e.lat, e.lng);
      if (dist < minFeet) {
        minFeet = dist;
        nearest = e;
      }
    }

    const currentZone = newZoneName || nearest.zone || 'Downtown Springfield';
    setActiveZoneName(currentZone);

    const zoneEchoes = echoes.filter((e) => e.zone === currentZone);
    const whispersCount = zoneEchoes.filter((e) => e.type === 'whisper').length;
    const shoutsCount = zoneEchoes.filter((e) => e.type === 'shout').length;
    const historyCount = zoneEchoes.filter((e) => e.type === 'history').length;

    const currentCount = zoneAlertCounts[currentZone] || 0;

    // Only notify if within first few times (< MAX_NOTIFICATIONS_PER_ZONE) and whispers/shouts exist
    if (currentCount < MAX_NOTIFICATIONS_PER_ZONE) {
      const nextCount = currentCount + 1;
      setZoneAlertCounts((prev) => ({
        ...prev,
        [currentZone]: nextCount,
      }));

      const alertPayload: ProximityAlert = {
        id: `alert-${Date.now()}-${currentZone}`,
        zone: currentZone,
        whispersCount,
        shoutsCount,
        historyCount,
        nearestEcho: nearest,
        distanceFeet: Math.min(minFeet, 350),
        notificationNumber: nextCount,
        maxCap: MAX_NOTIFICATIONS_PER_ZONE,
      };

      setActiveAlert(alertPayload);

      // Trigger Web Push Notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`⚡ Echoes: Resonance in ${currentZone}`, {
            body: `${whispersCount} Whispers & ${shoutsCount} Shouts nearby! Nearest: "${nearest.title}"`,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      }
    }
  };

  // Check on initial load once echoes arrive
  useEffect(() => {
    if (echoes.length > 0) {
      const timer = setTimeout(() => {
        triggerZoneEvaluation(userLocation, 'Downtown Springfield');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [echoes.length]);

  // Teleport to a new zone
  const handleTeleportToZone = (zone: typeof TELEPORT_ZONES[0]) => {
    setUserLocation({ lat: zone.lat, lng: zone.lng });
    triggerZoneEvaluation({ lat: zone.lat, lng: zone.lng }, zone.name);
  };

  // Map Click handler in Drop Mode
  const handleMapClickForDrop = (lat: number, lng: number) => {
    if (isDropMode) {
      setDropCoordinates({ lat, lng });
      setIsDropModalOpen(true);
      setIsDropMode(false);
    }
  };

  // React (+1 Resonance)
  const handleReactEcho = async (echoId: string) => {
    try {
      await fetch(`/api/echoes/${echoId}/react`, { method: 'POST' });
      setEchoes((prev) =>
        prev.map((e) => (e.id === echoId ? { ...e, resonanceScore: e.resonanceScore + 1 } : e))
      );
    } catch {
      // ignore
    }
  };

  // Colab Engine: Upvote/downvote parent pin
  const handleVotePin = async (echoId: string, direction: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/echoes/${echoId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (data.success) {
        setEchoes((prev) =>
          prev.map((e) =>
            e.id === echoId
              ? {
                  ...e,
                  resonanceScore: data.resonanceScore,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                }
              : e
          )
        );
        if (selectedEcho && selectedEcho.id === echoId) {
          setSelectedEcho((prev) =>
            prev ? { ...prev, resonanceScore: data.resonanceScore } : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to vote pin:', err);
    }
  };

  // Colab Engine: Add community contribution
  const handleContributionAdded = (newContrib: ColabContribution, newResonanceScore: number) => {
    if (!selectedEcho) return;

    setEchoes((prev) =>
      prev.map((e) => {
        if (e.id === selectedEcho.id) {
          const updatedContribs = [newContrib, ...(e.contributions || [])];
          return {
            ...e,
            contributions: updatedContribs,
            resonanceScore: newResonanceScore,
          };
        }
        return e;
      })
    );

    setSelectedEcho((prev) =>
      prev
        ? {
            ...prev,
            contributions: [newContrib, ...(prev.contributions || [])],
            resonanceScore: newResonanceScore,
          }
        : null
    );

    soundSynth.playZoneAlertChime();
  };

  // Colab Engine: Upvote/downvote a contribution
  const handleVoteContribution = async (
    echoId: string,
    contribId: string,
    direction: 'up' | 'down'
  ) => {
    try {
      const res = await fetch(`/api/echoes/${echoId}/contributions/${contribId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (data.success) {
        setEchoes((prev) =>
          prev.map((e) => {
            if (e.id === echoId && e.contributions) {
              const updated = e.contributions.map((c) =>
                c.id === contribId
                  ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes }
                  : c
              );
              return { ...e, contributions: updated, resonanceScore: data.echoResonanceScore };
            }
            return e;
          })
        );
      }
    } catch (err) {
      console.error('Failed to vote contribution:', err);
    }
  };

  // Whisper Engine: Simulate friend receiving invite
  const handleSimulateReceiveInvite = (inviteEchoId: string, key: string, sender: string) => {
    const target = echoes.find((e) => e.id === inviteEchoId);
    if (!target) return;

    setIncomingInvite({ targetEcho: target, key, sender });
    setActiveInviteKey(key);
  };

  // Visible count under time filter
  const visibleEchoes = echoes.filter(
    (e) =>
      (!e.year || e.year <= timeSliderYear) &&
      (activeFilter === 'all' || e.type === activeFilter)
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. TOP HEADER / APP BAR */}
      <header className="absolute top-0 inset-x-0 z-[1000] p-3 sm:p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Logo & Zone Info */}
          <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-xl">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-white uppercase">
                  Echoes
                </h1>
                <span className="text-[10px] text-cyan-300 font-bold px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800">
                  The Human Map
                </span>
                {isHistoricalMode && (
                  <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 animate-pulse">
                    Archival View
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-xs">
                  {activeZoneName}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  Alerts: {zoneAlertCounts[activeZoneName] || 0}/{MAX_NOTIFICATIONS_PER_ZONE}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Real Device GPS Tracking Button */}
            <button
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const newLoc = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                      };
                      setUserLocation(newLoc);
                      triggerZoneEvaluation(newLoc, 'My Current Location');
                      soundSynth.playZoneAlertChime();
                    },
                    (err) => {
                      console.warn('Geolocation error:', err);
                    },
                    { enableHighAccuracy: true }
                  );
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-cyan-300 text-xs font-bold shadow-lg backdrop-blur-xl transition-all hover:scale-105"
              title="Use your phone's real GPS coordinates"
            >
              <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Use My Real GPS</span>
              <span className="sm:hidden">GPS</span>
            </button>

            {/* Grounding Explorer Button */}
            <button
              onClick={() => setIsExploreModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-lg backdrop-blur-xl transition-all hover:scale-105"
              title="Ground new landmarks using Google Maps & Gemini"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Google Maps Grounding</span>
              <span className="sm:hidden">Ground</span>
            </button>

            {/* Drop Echo Button */}
            <button
              onClick={() => {
                if (isDropMode) {
                  setIsDropMode(false);
                } else {
                  setDropCoordinates(userLocation);
                  setIsDropModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 backdrop-blur-xl transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Drop Echo</span>
            </button>
          </div>
        </div>

        {/* Teleport / Quick Zone Hopper & Layer Filter Bar */}
        <div className="max-w-7xl mx-auto mt-2 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          {/* Layer Filters */}
          <div className="flex items-center gap-1 bg-slate-900/85 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({echoes.length})
            </button>

            <button
              onClick={() => setActiveFilter('whisper')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeFilter === 'whisper'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <span>🔒 Whispers</span>
              <span className="text-[10px] opacity-80">
                ({echoes.filter((e) => e.type === 'whisper').length})
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('history')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeFilter === 'history'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span>🏛️ History</span>
              <span className="text-[10px] opacity-80">
                ({echoes.filter((e) => e.type === 'history').length})
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('shout')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeFilter === 'shout'
                  ? 'bg-rose-500 text-slate-950 font-bold shadow-xs'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span>📢 Colabs</span>
              <span className="text-[10px] opacity-80">
                ({echoes.filter((e) => e.type === 'shout').length})
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('quest')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeFilter === 'quest'
                  ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span>🎯 Quests</span>
              <span className="text-[10px] opacity-80">
                ({echoes.filter((e) => e.type === 'quest').length})
              </span>
            </button>
          </div>

          {/* Quick Zone Hopper */}
          <div className="flex items-center gap-1 bg-slate-900/85 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-xl overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase text-slate-500 px-2 flex items-center gap-1">
              <LocateFixed className="w-3 h-3 text-cyan-400" />
              <span>Jump:</span>
            </span>
            {TELEPORT_ZONES.map((zone) => (
              <button
                key={zone.name}
                onClick={() => handleTeleportToZone(zone)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeZoneName === zone.name
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Simulate walking into ${zone.name}`}
              >
                {zone.name.replace('Springfield ', '').replace('Eugene ', '')}
              </button>
            ))}

            {/* Reset zone notification quota button */}
            <button
              onClick={() => {
                setZoneAlertCounts({});
                soundSynth.playZoneAlertChime();
                if (echoes.length > 0) {
                  triggerZoneEvaluation(userLocation, activeZoneName);
                }
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors ml-1"
              title="Reset zone notification counts (test push alerts again)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. FULL-SCREEN RIPPLE MAP */}
      <main className="w-full h-full">
        <RippleMap
          echoes={echoes}
          selectedEcho={selectedEcho}
          userLocation={userLocation}
          activeFilter={activeFilter}
          timeSliderYear={timeSliderYear}
          isHistoricalMode={isHistoricalMode}
          isDropMode={isDropMode}
          onSelectEcho={(echo) => setSelectedEcho(echo)}
          onMapClickForDrop={handleMapClickForDrop}
        />
      </main>

      {/* 3. PROXIMITY PUSH NOTIFICATION BANNER (First few times in area) */}
      {activeAlert && (
        <ProximityNotificationBanner
          alert={activeAlert}
          onDismiss={() => setActiveAlert(null)}
          onTrackWithRadar={(echo) => {
            setActiveAlert(null);
            setRadarTargetEcho(echo);
          }}
          onViewEcho={(echo) => {
            setActiveAlert(null);
            setSelectedEcho(echo);
          }}
        />
      )}

      {/* 4. WHISPER ENGINE: INCOMING INVITATION BANNER */}
      {incomingInvite && (
        <IncomingWhisperInviteBanner
          sender={incomingInvite.sender}
          targetEcho={incomingInvite.targetEcho}
          secretKey={incomingInvite.key}
          onAcceptAndLaunchRadar={() => {
            setRadarTargetEcho(incomingInvite.targetEcho);
            setIncomingInvite(null);
          }}
          onDismiss={() => setIncomingInvite(null)}
        />
      )}

      {/* 5. BOTTOM TIME-TRAVEL SLIDER WITH HISTORICAL VS CURRENT TOGGLE */}
      <footer className="absolute bottom-4 inset-x-0 z-[1000] px-3 sm:px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <TimeTravelSlider
            currentYear={timeSliderYear}
            onChangeYear={(year) => setTimeSliderYear(year)}
            visibleCount={visibleEchoes.length}
            totalCount={echoes.length}
            isHistoricalMode={isHistoricalMode}
            onToggleHistoricalMode={(mode) => setIsHistoricalMode(mode)}
          />
        </div>
      </footer>

      {/* 6. ECHO VIEWER DRAWER WITH COLAB THREAD & WHISPER INVITE */}
      {selectedEcho && (
        <EchoViewerDrawer
          echo={selectedEcho}
          userLocation={userLocation}
          onClose={() => setSelectedEcho(null)}
          onReact={handleReactEcho}
          onStartQuest={(echo) => {
            setSelectedEcho(null);
            setRadarTargetEcho(echo);
          }}
          onOpenWhisperInviteModal={(echo) => setWhisperInviteEcho(echo)}
          onContributionAdded={handleContributionAdded}
          onVotePin={handleVotePin}
          onVoteContribution={handleVoteContribution}
          loadedInviteKey={activeInviteKey}
        />
      )}

      {/* 7. AIRTAG COMPASS RADAR HUD (With Whisper Proximity Decrypt) */}
      {radarTargetEcho && (
        <CompassRadar
          targetEcho={radarTargetEcho}
          userLocation={userLocation}
          onClose={() => setRadarTargetEcho(null)}
          onOpenEchoDrawer={(echo) => setSelectedEcho(echo)}
          onSimulateStepTowards={(newLat, newLng) => {
            setUserLocation({ lat: newLat, lng: newLng });
          }}
          inviteKey={activeInviteKey}
          inviteSender={incomingInvite?.sender}
        />
      )}

      {/* 8. WHISPER ENGINE: GENERATE INVITATION MODAL */}
      {whisperInviteEcho && (
        <WhisperInviteModal
          echo={whisperInviteEcho}
          onClose={() => setWhisperInviteEcho(null)}
          onSimulateReceiveInvite={handleSimulateReceiveInvite}
        />
      )}

      {/* 9. DROP ECHO MODAL */}
      {isDropModalOpen && (
        <DropEchoModal
          initialLat={dropCoordinates.lat}
          initialLng={dropCoordinates.lng}
          onClose={() => setIsDropModalOpen(false)}
          onEchoCreated={(newEcho) => {
            setEchoes((prev) => [newEcho, ...prev]);
            setSelectedEcho(newEcho);
            soundSynth.playZoneAlertChime();
          }}
        />
      )}

      {/* 10. GEMINI MAPS GROUNDING DISCOVERY MODAL */}
      {isExploreModalOpen && (
        <GeminiMapsDiscoveryModal
          userLocation={userLocation}
          onClose={() => setIsExploreModalOpen(false)}
          onAddEchoToMap={(newEcho) => {
            setEchoes((prev) => [newEcho, ...prev]);
            setSelectedEcho(newEcho);
            soundSynth.playZoneAlertChime();
          }}
        />
      )}
    </div>
  );
}

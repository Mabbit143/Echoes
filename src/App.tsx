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
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { EchoDensityModal } from './components/EchoDensityModal';
import { soundSynth } from './utils/audioSynth';
import { DEFAULT_ECHOES } from './data/defaultEchoes';
import { safeFetchJson } from './utils/apiClient';
import { UserProfileModal } from './components/UserProfileModal';
import { loadUserProfile, recordEchoDrop, recordCommunityVoteBonus, QuestStep } from './utils/userProfile';
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
  HelpCircle,
  BarChart2,
  ChevronDown,
  User,
  Trophy,
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
  const [echoes, setEchoes] = useState<EchoItem[]>(() => {
    try {
      const cached = localStorage.getItem('echoes_cached_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_ECHOES;
  });
  const [isLoadingEchoes, setIsLoadingEchoes] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
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
  const [isDensityModalOpen, setIsDensityModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState(() => loadUserProfile());
  const [isZoneMenuOpen, setIsZoneMenuOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<ProximityAlert | null>(null);

  // Sync profile when updated
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setUserProfile(e.detail);
      }
    };
    window.addEventListener('echoes-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('echoes-profile-updated', handleProfileUpdate);
  }, []);

  // Whisper Engine: Invitation states
  const [whisperInviteEcho, setWhisperInviteEcho] = useState<EchoItem | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{
    targetEcho: EchoItem;
    key: string;
    sender: string;
  } | null>(null);
  const [activeInviteKey, setActiveInviteKey] = useState<string | undefined>(undefined);

  // Interactive Onboarding Tour state (launches automatically on first visit)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('echoes_has_seen_onboarding');
    } catch {
      return false;
    }
  });

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem('echoes_has_seen_onboarding', 'true');
    } catch {
      // ignore
    }
  };

  const handleOnboardingAction = (actionType: string) => {
    if (actionType === 'open-drop') {
      setDropCoordinates(userLocation);
      setIsDropModalOpen(true);
      handleCloseOnboarding();
    } else if (actionType === 'toggle-history') {
      setIsHistoricalMode((prev) => !prev);
      if (!isHistoricalMode) {
        setTimeSliderYear(1892);
      }
    } else if (actionType === 'open-density') {
      setIsDensityModalOpen(true);
      soundSynth.playZoneAlertChime();
      handleCloseOnboarding();
    }
  };

  // Zone Notification Anti-fatigue history { [zoneName]: count }
  const [zoneAlertCounts, setZoneAlertCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('echoes_zone_alert_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Load Echoes from server with offline cache fallback and auto-recovery
  const fetchEchoes = async (isManual = false) => {
    if (isManual) {
      setIsLoadingEchoes(true);
      setConnectionStatus('reconnecting');
    }

    const result = await safeFetchJson<{ success: boolean; echoes: EchoItem[] }>('/api/echoes');
    setIsLoadingEchoes(false);

    if (result.ok && result.data?.echoes && Array.isArray(result.data.echoes)) {
      setEchoes(result.data.echoes);
      setConnectionStatus('connected');
      setSyncNotice(null);
      try {
        localStorage.setItem('echoes_cached_data', JSON.stringify(result.data.echoes));
      } catch {
        // ignore
      }
      checkUrlInvite(result.data.echoes);
    } else {
      console.warn('API sync unavailable, running on local/cached archives:', result.error);
      setConnectionStatus('offline');
      setSyncNotice('Operating in offline cache mode. Oregon archives preserved.');
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

  // Get user's real browser GPS coordinates
  const handleGetDeviceGps = () => {
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
    // Optimistic UI update
    setEchoes((prev) =>
      prev.map((e) => (e.id === echoId ? { ...e, resonanceScore: e.resonanceScore + 1 } : e))
    );
    await safeFetchJson(`/api/echoes/${echoId}/react`, { method: 'POST' });
  };

  // Colab Engine: Upvote/downvote parent pin
  const handleVotePin = async (echoId: string, direction: 'up' | 'down') => {
    const result = await safeFetchJson<{
      success: boolean;
      resonanceScore: number;
      upvotes: number;
      downvotes: number;
    }>(`/api/echoes/${echoId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });

    if (result.ok && result.data?.success) {
      setEchoes((prev) =>
        prev.map((e) =>
          e.id === echoId
            ? {
                ...e,
                resonanceScore: result.data!.resonanceScore,
                upvotes: result.data!.upvotes,
                downvotes: result.data!.downvotes,
              }
            : e
        )
      );
      if (selectedEcho && selectedEcho.id === echoId) {
        setSelectedEcho((prev) =>
          prev ? { ...prev, resonanceScore: result.data!.resonanceScore } : null
        );
      }
    } else {
      console.warn('Failed to vote pin:', result.error);
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
    const result = await safeFetchJson<{
      success: boolean;
      upvotes: number;
      downvotes: number;
      echoResonanceScore: number;
    }>(`/api/echoes/${echoId}/contributions/${contribId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });

    if (result.ok && result.data?.success) {
      setEchoes((prev) =>
        prev.map((e) => {
          if (e.id === echoId && e.contributions) {
            const updated = e.contributions.map((c) =>
              c.id === contribId
                ? { ...c, upvotes: result.data!.upvotes, downvotes: result.data!.downvotes }
                : c
            );
            return { ...e, contributions: updated, resonanceScore: result.data!.echoResonanceScore };
          }
          return e;
        })
      );
    } else {
      console.warn('Failed to vote contribution:', result.error);
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
      {/* Backdrop click dismisser for open menus */}
      {(isZoneMenuOpen || isToolsMenuOpen) && (
        <div
          className="fixed inset-0 z-[950] bg-transparent"
          onClick={() => {
            setIsZoneMenuOpen(false);
            setIsToolsMenuOpen(false);
          }}
        />
      )}

      {/* 1. CLEAN TOP APP BAR */}
      <header className="absolute top-0 inset-x-0 z-[1000] p-3 sm:p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
          {/* Left Zone: Brand & Neighborhood Picker */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1.5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 pl-2 pr-1">
              <span className="font-bold tracking-tight text-white text-sm">Echoes</span>
              {isHistoricalMode ? (
                <span className="text-[10px] text-amber-400 font-medium">· Archival</span>
              ) : (
                <span className="text-[11px] text-slate-400 font-normal hidden lg:inline">· Living Map</span>
              )}
            </div>

            {/* Quick Zone Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsZoneMenuOpen(!isZoneMenuOpen);
                  setIsToolsMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
                title="Jump to another neighborhood"
              >
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="max-w-[130px] sm:max-w-none truncate">{activeZoneName}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isZoneMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isZoneMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl p-2 z-[1050] animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>Teleport Neighborhood</span>
                    <button
                      onClick={() => {
                        setZoneAlertCounts({});
                        soundSynth.playZoneAlertChime();
                        triggerZoneEvaluation(userLocation, activeZoneName);
                      }}
                      className="text-[10px] text-slate-500 hover:text-cyan-400 cursor-pointer"
                      title="Reset notification limit"
                    >
                      Reset quota
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {TELEPORT_ZONES.map((zone) => {
                      const zoneCount = echoes.filter((e) => e.zone === zone.name).length;
                      return (
                        <button
                          key={zone.name}
                          onClick={() => {
                            handleTeleportToZone(zone);
                            soundSynth.playZoneAlertChime();
                            setIsZoneMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            activeZoneName === zone.name
                              ? 'bg-cyan-950 text-cyan-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div>
                            <div>{zone.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{zone.label}</div>
                          </div>
                          {zoneCount > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {zoneCount} echoes
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Zone: Segmented Category Filter */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 p-1 rounded-2xl shadow-xl backdrop-blur-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({echoes.length})
            </button>
            <button
              onClick={() => setActiveFilter('whisper')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'whisper'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Whispers
            </button>
            <button
              onClick={() => setActiveFilter('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'history'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveFilter('shout')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'shout'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Colabs
            </button>
            <button
              onClick={() => setActiveFilter('quest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'quest'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Quests
            </button>
          </div>

          {/* Right Zone: Profile, Primary Action (Drop Echo) & Clean Tools Dropdown */}
          <div className="flex items-center gap-2">
            {/* User Profile & Resonance Badge Button */}
            <button
              id="tour-user-profile"
              onClick={() => {
                setIsProfileModalOpen(true);
                soundSynth.playZoneAlertChime();
                setIsZoneMenuOpen(false);
                setIsToolsMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold shadow-lg backdrop-blur-xl transition-all cursor-pointer hover:border-cyan-500/50 group"
              title="View Explorer Profile, Dropped Echoes, Quests & Resonance History"
            >
              <div className="w-5 h-5 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
                <User className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-white font-medium hidden md:inline max-w-[100px] truncate">
                {userProfile.username}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                {userProfile.resonanceScore}
              </span>
            </button>

            {/* Primary CTA: Drop Echo */}
            <button
              id="tour-drop-echo"
              onClick={() => {
                if (isDropMode) {
                  setIsDropMode(false);
                } else {
                  setDropCoordinates(userLocation);
                  setIsDropModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 backdrop-blur-xl transition-all cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Drop Echo</span>
            </button>

            {/* Tools Menu Dropdown */}
            <div className="relative">
              <button
                id="tour-tools-menu"
                onClick={() => {
                  setIsToolsMenuOpen(!isToolsMenuOpen);
                  setIsZoneMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium shadow-lg backdrop-blur-xl transition-all cursor-pointer"
                title="Explore tools & analytics"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Tools</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl p-2 z-[1050] animate-in fade-in slide-in-from-top-2">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Map Tools & Features
                  </div>

                  {/* User Profile & Quests */}
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      soundSynth.playZoneAlertChime();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Explorer Profile & Quests</div>
                      <div className="text-[10px] text-slate-400">Echoes, active quests & resonance history</div>
                    </div>
                  </button>

                  {/* Echo Density & Resonance Histogram */}
                  <button
                    id="tour-density-radar"
                    onClick={() => {
                      setIsDensityModalOpen(true);
                      soundSynth.playZoneAlertChime();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Density & Resonance Radar</div>
                      <div className="text-[10px] text-slate-400">Recharts histogram across zones</div>
                    </div>
                  </button>

                  {/* Google Maps Grounding */}
                  <button
                    id="tour-maps-grounding"
                    onClick={() => {
                      setIsExploreModalOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Google Maps Grounding</div>
                      <div className="text-[10px] text-slate-400">Gemini landmark discovery</div>
                    </div>
                  </button>

                  {/* Real Device GPS */}
                  <button
                    onClick={() => {
                      handleGetDeviceGps();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <LocateFixed className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Use My Real GPS</div>
                      <div className="text-[10px] text-slate-400">Center to current device location</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  {/* Interactive Tour */}
                  <button
                    onClick={() => {
                      setIsOnboardingOpen(true);
                      soundSynth.playZoneAlertChime();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-medium">Interactive Feature Tour</div>
                      <div className="text-[10px] text-slate-500">How to use Echoes</div>
                    </div>
                  </button>

                  {/* Offline / Reconnect */}
                  {connectionStatus !== 'connected' && (
                    <button
                      onClick={() => {
                        fetchEchoes(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-amber-300 hover:bg-amber-950/40 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 text-amber-400 shrink-0 ${isLoadingEchoes ? 'animate-spin' : ''}`} />
                      <div>
                        <div className="font-medium">Reconnect Data Grid</div>
                        <div className="text-[10px] text-amber-500/80">Operating in offline cache mode</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Bar (only visible on mobile screens) */}
        <div className="md:hidden mt-2 pointer-events-auto flex items-center justify-center">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-xl backdrop-blur-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                activeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('whisper')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                activeFilter === 'whisper' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Whispers
            </button>
            <button
              onClick={() => setActiveFilter('history')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                activeFilter === 'history' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveFilter('shout')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                activeFilter === 'shout' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
              }`}
            >
              Colabs
            </button>
            <button
              onClick={() => setActiveFilter('quest')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                activeFilter === 'quest' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
              }`}
            >
              Quests
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

      {/* Floating Map Controls (Bottom-Right GPS button) */}
      <div className="absolute right-4 bottom-20 z-[900] pointer-events-auto">
        <button
          onClick={handleGetDeviceGps}
          className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-400 shadow-xl backdrop-blur-xl transition-all cursor-pointer hover:scale-105"
          title="Center on my real GPS location"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

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
        <div id="tour-time-slider" className="pointer-events-auto">
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
            recordEchoDrop(newEcho);
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
            recordEchoDrop(newEcho);
            soundSynth.playZoneAlertChime();
          }}
        />
      )}

      {/* 11. RECHARTS ECHO DENSITY & RESONANCE HISTOGRAM MODAL */}
      <EchoDensityModal
        isOpen={isDensityModalOpen}
        onClose={() => setIsDensityModalOpen(false)}
        echoes={echoes}
        zones={TELEPORT_ZONES}
        activeZoneName={activeZoneName}
        onTeleportToZone={(zone) => {
          handleTeleportToZone(zone);
          soundSynth.playZoneAlertChime();
        }}
      />

      {/* 12. INTERACTIVE ONBOARDING OVERLAY */}
      <OnboardingOverlay
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
        onAction={handleOnboardingAction}
        isHistoricalMode={isHistoricalMode}
      />

      {/* 13. USER PROFILE & QUESTS MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        echoes={echoes}
        userLocation={userLocation}
        onTeleportToEcho={(echo) => {
          setUserLocation({ lat: echo.lat, lng: echo.lng });
          setSelectedEcho(echo);
          soundSynth.playZoneAlertChime();
        }}
        onOpenEchoDrawer={(echo) => setSelectedEcho(echo)}
        onTrackQuestWaypoint={(step: QuestStep) => {
          const matchingEcho = echoes.find((e) => e.id === step.echoId);
          if (matchingEcho) {
            setRadarTargetEcho(matchingEcho);
          } else {
            setRadarTargetEcho({
              id: `quest-${step.stepNumber}`,
              title: step.title,
              type: 'quest',
              lat: step.lat,
              lng: step.lng,
              author: 'Quest Master',
              distanceThresholdMeters: 30,
              summary: step.summary,
              fullStory: step.hint,
              tags: ['Active Quest', step.zone],
              resonanceScore: 100,
              zone: step.zone,
              createdAt: new Date().toISOString(),
            });
          }
          // Set user position slightly nearby so the radar displays bearing and distance
          setUserLocation({ lat: step.lat - 0.0004, lng: step.lng - 0.0004 });
          soundSynth.playZoneAlertChime();
        }}
        onOpenDropModal={() => {
          setDropCoordinates(userLocation);
          setIsDropModalOpen(true);
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { EchoItem } from '../types';
import { soundSynth } from '../utils/audioSynth';
import {
  Navigation2,
  X,
  Sparkles,
  Footprints,
  Radio,
  MapPin,
  CheckCircle,
  Eye,
} from 'lucide-react';

import { decryptWhisper } from '../utils/crypto';

interface CompassRadarProps {
  targetEcho: EchoItem;
  userLocation: { lat: number; lng: number };
  onClose: () => void;
  onOpenEchoDrawer: (echo: EchoItem) => void;
  onSimulateStepTowards?: (newLat: number, newLng: number) => void;
  inviteKey?: string;
  inviteSender?: string;
}

export const CompassRadar: React.FC<CompassRadarProps> = ({
  targetEcho,
  userLocation,
  onClose,
  onOpenEchoDrawer,
  onSimulateStepTowards,
  inviteKey,
  inviteSender,
}) => {
  const [simulatedDistanceFeet, setSimulatedDistanceFeet] = useState<number>(240);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [decryptedSecret, setDecryptedSecret] = useState<string | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);

  // Calculate real distance & bearing
  const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
    const x =
      Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
      Math.sin(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.cos((lon2 - lon1) * (Math.PI / 180));
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

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

  const realDistance = getDistanceFeet(userLocation.lat, userLocation.lng, targetEcho.lat, targetEcho.lng);
  const targetBearing = getBearing(userLocation.lat, userLocation.lng, targetEcho.lat, targetEcho.lng);

  // Initialize simulated distance based on real distance (capped for interactive demo)
  useEffect(() => {
    const startDist = Math.min(Math.max(realDistance, 45), 320);
    setSimulatedDistanceFeet(startDist);
    if (startDist <= 50) {
      setIsUnlocked(true);
    }
  }, [targetEcho]);

  // Listen to device orientation if on mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setDeviceHeading(360 - e.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Compute rotation angle for directional arrow
  const arrowRotation = (targetBearing - deviceHeading + 360) % 360;

  // Signal resonance percentage: 100% when <= 40ft, 0% when >= 350ft
  const resonancePercent = Math.max(
    0,
    Math.min(100, Math.round(100 - (simulatedDistanceFeet / 350) * 100))
  );

  const triggerDecrypt = async () => {
    if (targetEcho.encryptedPayload && inviteKey) {
      try {
        const text = await decryptWhisper(
          targetEcho.encryptedPayload,
          inviteKey,
          targetEcho.encryptionIv || '',
          targetEcho.encryptionSalt || ''
        );
        setDecryptedSecret(text);
      } catch (err) {
        console.warn('Decryption issue:', err);
      }
    }
  };

  const handleApproachWalk = () => {
    const nextDist = Math.max(15, simulatedDistanceFeet - 45);
    setSimulatedDistanceFeet(nextDist);

    // Audio chirp as you get warmer
    soundSynth.playZoneAlertChime();

    if (nextDist <= 50 && !isUnlocked) {
      setIsUnlocked(true);
      triggerDecrypt();
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }

    // Step slightly closer in real coordinates if callback provided
    if (onSimulateStepTowards) {
      const stepRatio = 0.2;
      const nextLat = userLocation.lat + (targetEcho.lat - userLocation.lat) * stepRatio;
      const nextLng = userLocation.lng + (targetEcho.lng - userLocation.lng) * stepRatio;
      onSimulateStepTowards(nextLat, nextLng);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.25)] text-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>AirTag Directional Radar</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight truncate max-w-xs">
            {targetEcho.title}
          </h3>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" />
            {targetEcho.zone}
          </p>
        </div>

        {/* Circular Compass Visualizer */}
        <div className="relative w-56 h-56 flex items-center justify-center my-2 select-none">
          {/* Outer Pulsing Waves */}
          <div
            className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-40 pointer-events-none"
            style={{ animationDuration: `${Math.max(1.2, 4 - (resonancePercent / 100) * 2.8)}s` }}
          />
          <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-pulse pointer-events-none" />

          {/* Compass Dial Outer Ring */}
          <div className="absolute inset-6 rounded-full border-2 border-slate-700/80 bg-slate-900/90 shadow-inner flex items-center justify-center">
            {/* Degree tick markers */}
            <div className="absolute top-2 text-[9px] font-mono text-slate-500 font-bold">N</div>
            <div className="absolute bottom-2 text-[9px] font-mono text-slate-500 font-bold">S</div>
            <div className="absolute left-2 text-[9px] font-mono text-slate-500 font-bold">W</div>
            <div className="absolute right-2 text-[9px] font-mono text-slate-500 font-bold">E</div>

            {/* Direction Arrow Needle */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${arrowRotation}deg)` }}
            >
              <div className="absolute -top-1 flex flex-col items-center">
                <Navigation2
                  className={`w-12 h-12 transition-colors ${
                    isUnlocked
                      ? 'text-emerald-400 drop-shadow-[0_0_12px_#34d399]'
                      : resonancePercent > 60
                      ? 'text-cyan-300 drop-shadow-[0_0_12px_#38bdf8]'
                      : 'text-cyan-500'
                  }`}
                  fill="currentColor"
                />
              </div>
            </div>

            {/* Center Distance Ring */}
            <div className="absolute inset-14 rounded-full bg-slate-950/95 border border-cyan-500/40 flex flex-col items-center justify-center text-center p-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {isUnlocked ? (
                <div className="flex flex-col items-center text-emerald-400 animate-bounce">
                  <CheckCircle className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">REACHED!</span>
                </div>
              ) : (
                <>
                  <span className="text-2xl font-black font-mono tracking-tight text-white">
                    {simulatedDistanceFeet}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    FEET AWAY
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Signal Status Gauge */}
        <div className="w-full mt-4 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resonance Strength</span>
            </span>
            <span className="font-mono font-bold text-cyan-300">{resonancePercent}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isUnlocked
                  ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                  : resonancePercent > 70
                  ? 'bg-cyan-400 shadow-[0_0_10px_#38bdf8]'
                  : 'bg-cyan-600'
              }`}
              style={{ width: `${resonancePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-center text-slate-400 italic pt-1">
            {isUnlocked
              ? '✨ You are within resonant range! Memory unlocked.'
              : resonancePercent > 75
              ? '🔥 Extremely Warm! The echo is right in front of you.'
              : resonancePercent > 40
              ? '⚡ Getting warmer... Follow the cyan needle.'
              : '📡 Walking towards signal perimeter...'}
          </p>
        </div>

        {/* Decrypted Whisper Message Box if unlocked */}
        {decryptedSecret && (
          <div className="w-full mt-3 p-3 bg-cyan-950/90 border border-cyan-400 rounded-2xl space-y-1 text-xs animate-in zoom-in-95">
            <span className="text-[10px] uppercase font-bold text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Decrypted Secret Message from {inviteSender || 'Friend'}
            </span>
            <p className="text-white italic leading-relaxed font-sans">
              "{decryptedSecret}"
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full mt-5 flex flex-col gap-2.5">
          {isUnlocked ? (
            <button
              onClick={() => {
                onClose();
                onOpenEchoDrawer(targetEcho);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all flex items-center justify-center gap-2 animate-pulse"
            >
              <Eye className="w-4 h-4" />
              <span>Inspect Unlocked Echo</span>
            </button>
          ) : (
            <button
              onClick={handleApproachWalk}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 hover:border-cyan-400"
            >
              <Footprints className="w-4 h-4" />
              <span>Simulate Walking Closer (-45 ft)</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenEchoDrawer(targetEcho);
            }}
            className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            Open Story Drawer directly
          </button>
        </div>
      </div>
    </div>
  );
};

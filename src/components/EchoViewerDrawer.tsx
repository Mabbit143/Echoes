import React, { useState, useEffect } from 'react';
import { EchoItem, ColabContribution } from '../types';
import { soundSynth } from '../utils/audioSynth';
import { ColabThreadPanel } from './ColabThreadPanel';
import {
  Volume2,
  VolumeX,
  Compass,
  Lock,
  Unlock,
  Heart,
  Share2,
  ExternalLink,
  X,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface EchoViewerDrawerProps {
  echo: EchoItem;
  userLocation: { lat: number; lng: number };
  onClose: () => void;
  onReact: (echoId: string) => void;
  onStartQuest: (echo: EchoItem) => void;
  onOpenWhisperInviteModal: (echo: EchoItem) => void;
  onContributionAdded: (newContrib: ColabContribution, newResonanceScore: number) => void;
  onVotePin: (echoId: string, direction: 'up' | 'down') => void;
  onVoteContribution: (echoId: string, contribId: string, direction: 'up' | 'down') => void;
  loadedInviteKey?: string;
}

export const EchoViewerDrawer: React.FC<EchoViewerDrawerProps> = ({
  echo,
  userLocation,
  onClose,
  onReact,
  onStartQuest,
  onOpenWhisperInviteModal,
  onContributionAdded,
  onVotePin,
  onVoteContribution,
  loadedInviteKey,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    !echo.isLockedWhisper || (!!loadedInviteKey && loadedInviteKey === echo.inviteToken)
  );
  const [unlockError, setUnlockError] = useState<boolean>(false);
  const [hasReacted, setHasReacted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Stop audio on unmount or echo change
  useEffect(() => {
    setIsUnlocked(!echo.isLockedWhisper || (!!loadedInviteKey && loadedInviteKey === echo.inviteToken));
    setPasscodeAttempt('');
    setUnlockError(false);
    setIsAudioPlaying(false);
    soundSynth.stop();

    return () => {
      soundSynth.stop();
    };
  }, [echo, loadedInviteKey]);

  // Calculate distance
  const getDistanceFeet = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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

  const distanceFeet = getDistanceFeet(userLocation.lat, userLocation.lng, echo.lat, echo.lng);

  const toggleAudio = () => {
    if (isAudioPlaying) {
      soundSynth.stop();
      setIsAudioPlaying(false);
    } else {
      soundSynth.playAmbient(echo.soundType || 'ambient-water');
      setIsAudioPlaying(true);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      echo.secretPasscode &&
      passcodeAttempt.trim().toLowerCase() === echo.secretPasscode.toLowerCase()
    ) {
      setIsUnlocked(true);
      setUnlockError(false);
      soundSynth.playZoneAlertChime();
    } else {
      setUnlockError(true);
    }
  };

  const handleCopyShare = () => {
    const url = `${window.location.origin}?echo=${echo.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Color theme per echo type
  const theme = {
    history: {
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      accentColor: 'text-amber-400',
      btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    },
    whisper: {
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      accentColor: 'text-cyan-400',
      btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    },
    shout: {
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      accentColor: 'text-rose-400',
      btnBg: 'bg-rose-500 hover:bg-rose-400 text-slate-950',
    },
    quest: {
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      accentColor: 'text-emerald-400',
      btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    },
  }[echo.type];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] max-w-2xl mx-auto p-3 sm:p-4 pointer-events-auto">
      <div className="bg-slate-900/95 border border-slate-700/80 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] rounded-2xl backdrop-blur-xl overflow-hidden max-h-[85vh] flex flex-col text-slate-100 animate-in fade-in slide-in-from-bottom duration-300">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${theme.badgeBg}`}>
                {echo.type}
              </span>
              {echo.eraLabel && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {echo.eraLabel}
                </span>
              )}
              {echo.verifiedLocal && (
                <span className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Local
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {echo.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {echo.zone}
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-mono">
                {distanceFeet < 5280 ? `${distanceFeet} ft away` : `${(distanceFeet / 5280).toFixed(1)} miles`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-sm text-slate-300">
          {/* Then vs Now Image Comparison Slider */}
          {echo.thenImageUrl && echo.nowImageUrl && (
            <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-700/80 select-none group">
              {/* NOW image (base) */}
              <img
                src={echo.nowImageUrl}
                alt="Now"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 z-10">
                NOW (Present)
              </div>

              {/* THEN image (clipped overlay) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={echo.thenImageUrl}
                  alt="Then"
                  className="absolute inset-0 w-full h-full object-cover filter sepia-[0.35] contrast-125"
                />
                <div className="absolute top-2 left-2 bg-amber-950/80 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 z-10">
                  THEN ({echo.year || 'Archive'})
                </div>
              </div>

              {/* Slider Handle Divider */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center z-20 shadow-[0_0_12px_rgba(0,0,0,0.8)]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-7 h-7 -ml-3 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-lg text-[10px] text-white">
                  ↔
                </div>
              </div>

              {/* Drag controller bar */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/80 text-[11px] text-slate-300 px-3 py-1 rounded-full border border-slate-700/80 backdrop-blur-xs pointer-events-none">
                Slide ↔ to compare Time Travel
              </div>
            </div>
          )}

          {/* Audio Voice Memo / Sonic Aura */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
                  isAudioPlaying
                    ? 'bg-cyan-500 text-slate-950 animate-pulse'
                    : 'bg-slate-700 hover:bg-slate-600 text-cyan-300'
                }`}
                title="Play Audio Soundscape"
              >
                {isAudioPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Sonic Aura ({echo.soundType || 'Ambient Note'})</span>
                  {isAudioPlaying && (
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 h-3 bg-cyan-400 animate-bounce"></span>
                      <span className="w-0.5 h-2 bg-cyan-400 animate-bounce delay-75"></span>
                      <span className="w-0.5 h-3.5 bg-cyan-400 animate-bounce delay-150"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  "{echo.audioTranscript || echo.summary}"
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400">
              {echo.audioDuration || '0:35'}
            </span>
          </div>

          {/* Locked Whisper Check */}
          {echo.isLockedWhisper && !isUnlocked ? (
            <div className="p-4 bg-cyan-950/40 border border-cyan-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Locked Whisper — Memory Key Required</span>
              </div>
              <p className="text-xs text-slate-300">
                This memory was sealed by the author. Answer the local clue to decrypt:
              </p>
              {echo.passcodeHint && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-xs font-medium text-cyan-200 border border-cyan-900/60">
                  Clue: {echo.passcodeHint}
                </div>
              )}
              <form onSubmit={handleUnlock} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter passcode..."
                  value={passcodeAttempt}
                  onChange={(e) => setPasscodeAttempt(e.target.value)}
                  className="flex-1 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Decrypt
                </button>
              </form>
              {unlockError && (
                <p className="text-xs text-rose-400">Incorrect key. Re-read the clue!</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                The Narrative Footprint
              </h3>
              <p className="text-sm leading-relaxed text-slate-200">
                {echo.fullStory}
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {echo.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Colab Engine: Community photo & story thread for public pins */}
          <ColabThreadPanel
            echo={echo}
            onContributionAdded={onContributionAdded}
            onVotePin={onVotePin}
            onVoteContribution={onVoteContribution}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!hasReacted) {
                  onReact(echo.id);
                  setHasReacted(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                hasReacted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasReacted ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{echo.resonanceScore + (hasReacted ? 1 : 0)} Resonance</span>
            </button>

            {/* Whisper Engine: Generate Invitation for friend */}
            {echo.type === 'whisper' && (
              <button
                onClick={() => onOpenWhisperInviteModal(echo)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 transition-all hover:scale-105"
                title="Send unique compass invite to friend"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite Friend</span>
              </button>
            )}

            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartQuest(echo)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              <span>AirTag Compass Radar</span>
            </button>

            {echo.mapsUri ? (
              <a
                href={echo.mapsUri}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                title="View verified Google Maps location"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${echo.lat},${echo.lng}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { ProximityAlert, EchoItem } from '../types';
import { soundSynth } from '../utils/audioSynth';
import {
  Bell,
  Compass,
  X,
  Sparkles,
  Info,
  Radio,
  Eye,
} from 'lucide-react';

interface ProximityNotificationBannerProps {
  alert: ProximityAlert;
  onDismiss: () => void;
  onTrackWithRadar: (echo: EchoItem) => void;
  onViewEcho: (echo: EchoItem) => void;
}

export const ProximityNotificationBanner: React.FC<ProximityNotificationBannerProps> = ({
  alert,
  onDismiss,
  onTrackWithRadar,
  onViewEcho,
}) => {
  // Play chime and trigger device haptic on alert appearance
  useEffect(() => {
    soundSynth.playZoneAlertChime();
    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 120]);
    }

    // Auto dismiss after 14 seconds if untouched
    const timer = setTimeout(() => {
      onDismiss();
    }, 14000);

    return () => clearTimeout(timer);
  }, [alert.id]);

  return (
    <div className="fixed top-4 inset-x-0 z-[1300] max-w-lg mx-auto px-3 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 border border-cyan-500/70 shadow-[0_10px_35px_rgba(6,182,212,0.4)] rounded-2xl p-4 backdrop-blur-xl text-slate-100 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_#38bdf8]">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  New Zone Entered
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.2 rounded-full font-mono">
                  Alert {alert.notificationNumber} of {alert.maxCap}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {alert.zone}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story summary & distance */}
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {alert.whispersCount > 0 && `${alert.whispersCount} Whispers`}
                {alert.whispersCount > 0 && alert.shoutsCount > 0 && ' & '}
                {alert.shoutsCount > 0 && `${alert.shoutsCount} Shouts`}
                {alert.whispersCount === 0 && alert.shoutsCount === 0 && `${alert.historyCount} Historic Echoes`}{' '}
                pulsing nearby
              </span>
            </span>
            <span className="font-mono text-cyan-300 text-[11px]">
              ~{alert.distanceFeet} ft away
            </span>
          </div>

          <p className="text-xs text-slate-300 font-medium truncate">
            Nearest: <span className="text-white">"{alert.nearestEcho.title}"</span>
          </p>
          <p className="text-[11px] text-slate-400 italic line-clamp-1">
            "{alert.nearestEcho.summary}"
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={() => onTrackWithRadar(alert.nearestEcho)}
            className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Track with Radar</span>
          </button>

          <button
            onClick={() => onViewEcho(alert.nearestEcho)}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Echo</span>
          </button>
        </div>

        {/* Anti-fatigue notice caption */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
          <Info className="w-3 h-3 shrink-0 text-slate-500" />
          <span>
            Smart Proximity Shield: Notifies you the first {alert.maxCap} times you enter this neighborhood to avoid notification fatigue.
          </span>
        </div>
      </div>
    </div>
  );
};

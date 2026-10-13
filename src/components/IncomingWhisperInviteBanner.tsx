import React from 'react';
import { EchoItem } from '../types';
import {
  Lock,
  Compass,
  X,
  ShieldCheck,
  Sparkles,
  MapPin,
  Heart,
} from 'lucide-react';

interface IncomingWhisperInviteBannerProps {
  sender: string;
  targetEcho: EchoItem;
  secretKey: string;
  onAcceptAndLaunchRadar: () => void;
  onDismiss: () => void;
}

export const IncomingWhisperInviteBanner: React.FC<IncomingWhisperInviteBannerProps> = ({
  sender,
  targetEcho,
  secretKey,
  onAcceptAndLaunchRadar,
  onDismiss,
}) => {
  return (
    <div className="fixed top-4 inset-x-0 z-[1350] max-w-lg mx-auto px-3 pointer-events-auto animate-in slide-in-from-top-6 duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/90 to-slate-900 border-2 border-cyan-400 shadow-[0_10px_40px_rgba(6,182,212,0.5)] rounded-3xl p-4.5 backdrop-blur-2xl text-slate-100 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-cyan-400 text-slate-950 font-black shadow-[0_0_20px_#38bdf8]">
              <Lock className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded-full">
                  Private Whisper Invitation
                </span>
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Key Loaded
                </span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {sender} left an encrypted secret for you
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content detail */}
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/90 space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center justify-between text-white font-semibold">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target: "{targetEcho.title}"</span>
            </span>
            <span className="text-cyan-300 font-mono text-[11px]">{targetEcho.zone}</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            The narrative and photos in this pin are locked. Follow the directional compass needle to the physical location. When you get within 40 feet, the key unlocks the memory automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={onAcceptAndLaunchRadar}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <Compass className="w-4 h-4" />
            <span>Open Compass & Follow Signal</span>
          </button>

          <button
            onClick={onDismiss}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

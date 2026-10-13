import React, { useState, useEffect } from 'react';
import { soundSynth } from '../utils/audioSynth';
import {
  Sparkles,
  Compass,
  History,
  Plus,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Globe,
  Radio,
  Eye,
  Layers,
} from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  badge: string;
  description: string;
  targetId?: string;
  highlightPosition?: 'top-right' | 'bottom' | 'top-left' | 'center';
  tip: string;
  actionText?: string;
  actionType?: 'open-drop' | 'toggle-history' | 'open-density' | 'next';
}

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (actionType: string) => void;
  isHistoricalMode: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Echoes: The Human Map',
    badge: 'Overview',
    description:
      'Echoes is not just a navigation map—it is an enchanted layer of collective human memory, encrypted secrets, and living history.',
    tip: 'Look for radiating ripples across the city. The brighter and wider a ripple glows, the higher its community resonance!',
    highlightPosition: 'center',
  },
  {
    id: 'drop-echo',
    title: 'Drop an Echo: Leave Your Footprint',
    badge: 'Creator Tool',
    targetId: 'tour-drop-echo',
    highlightPosition: 'top-right',
    description:
      'Click "Drop Echo" to permanently pin a personal story, landmark memory, or private encrypted Whisper at any coordinate on Earth.',
    tip: 'Whisper Engine: Create zero-knowledge encrypted pins and generate an AirTag Compass invite link for a friend to unlock on-site.',
    actionText: 'Try Opening Drop Modal',
    actionType: 'open-drop',
  },
  {
    id: 'time-travel',
    title: 'Time-Travel Slider: Scrub Through Eras',
    badge: 'Chronology',
    targetId: 'tour-time-slider',
    highlightPosition: 'bottom',
    description:
      'Slide between 1846 founding pioneer days, the 1890s timber boom, 1970s cult folklore, and present-day art. Watch landmarks illuminate or fade based on the era.',
    tip: 'Toggle between "📜 Historical View" (archival sepia tone) and "🌐 Current View" to step back in time.',
    actionText: 'Toggle Historical Mode',
    actionType: 'toggle-history',
  },
  {
    id: 'density-radar',
    title: 'Echo Density Radar & Resonance Histogram',
    badge: 'Analytics',
    targetId: 'tour-tools-menu',
    highlightPosition: 'top-right',
    description:
      'Explore live Recharts histograms comparing whispers, shouts, and historical echo densities across teleport zones to see which sectors are most resonant.',
    tip: 'Find this anytime under "Tools > Density Radar" in the top bar, or click below to inspect right now.',
    actionText: 'Inspect Density Radar',
    actionType: 'open-density',
  },
  {
    id: 'compass-radar',
    title: 'AirTag Compass Radar & Proximity Alerts',
    badge: 'Navigation',
    highlightPosition: 'center',
    description:
      'Follow directional compass needles to hunt for secret memories. When you enter a new neighborhood, gentle proximity alerts notify you of nearby Whispers.',
    tip: 'Proximity Shield: The app notifies you when you enter a new area to ensure you never miss local lore without notification fatigue.',
  },
  {
    id: 'colab-grounding',
    title: 'Colab Threads & Google Maps Grounding',
    badge: 'Community',
    targetId: 'tour-tools-menu',
    highlightPosition: 'top-right',
    description:
      'Collaborate on public pins by uploading photos through the decades, upvoting quality stories, or discovering new landmarks with real-time Google Maps AI Grounding under Tools.',
    tip: 'Upvoted stories glow brighter and earn Legendary Lore status on the living map.',
    actionText: 'Start Exploring Now',
    actionType: 'next',
  },
];

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  isOpen,
  onClose,
  onAction,
  isHistoricalMode,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      soundSynth.playZoneAlertChime();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIdx]);

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIdx((prev) => prev + 1);
      soundSynth.playZoneAlertChime();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleCustomAction = () => {
    if (step.actionType && onAction) {
      onAction(step.actionType);
    }
    if (isLast) {
      onClose();
    }
  };

  // Target element highlight bounding box calculation
  let targetBox: DOMRect | null = null;
  if (step.targetId && typeof document !== 'undefined') {
    const el = document.getElementById(step.targetId);
    if (el) {
      targetBox = el.getBoundingClientRect();
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] pointer-events-auto flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-300">
      {/* Dark backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
      />

      {/* Target Element Glow Spotlight */}
      {targetBox && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.8)] z-[2010] animate-pulse transition-all duration-300"
          style={{
            top: `${targetBox.top - 6}px`,
            left: `${targetBox.left - 6}px`,
            width: `${targetBox.width + 12}px`,
            height: `${targetBox.height + 12}px`,
          }}
        >
          <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
            ★
          </div>
        </div>
      )}

      {/* Tour Dialogue Card */}
      <div
        className={`relative z-[2020] w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] text-slate-100 flex flex-col gap-4 transition-all duration-300 ${
          step.highlightPosition === 'top-right'
            ? 'sm:translate-x-12 sm:-translate-y-8'
            : step.highlightPosition === 'bottom'
            ? 'sm:-translate-y-20'
            : ''
        }`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/30">
              {step.id === 'welcome' && <Radio className="w-5 h-5 animate-pulse" />}
              {step.id === 'drop-echo' && <Plus className="w-5 h-5 stroke-[3]" />}
              {step.id === 'time-travel' && <History className="w-5 h-5" />}
              {step.id === 'compass-radar' && <Compass className="w-5 h-5" />}
              {step.id === 'colab-grounding' && <Globe className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-mono">
                  {step.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Step {currentStepIdx + 1} of {ONBOARDING_STEPS.length}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step description */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {step.description}
        </p>

        {/* Visual guide box / color legend */}
        {step.id === 'welcome' && (
          <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300 shadow-[0_0_8px_#fbbf24]" />
              <span className="text-amber-200 font-semibold">Gold: Historical Archives</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 border border-cyan-300 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-cyan-200 font-semibold">Cyan: Encrypted Whispers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-300 shadow-[0_0_8px_#f43f5e]" />
              <span className="text-rose-200 font-semibold">Coral: Colab Threads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_#34d399]" />
              <span className="text-emerald-200 font-semibold">Emerald: Quests & Murals</span>
            </div>
          </div>
        )}

        {/* Pro Tip Box */}
        <div className="p-3 bg-cyan-950/40 rounded-2xl border border-cyan-900/60 flex items-start gap-2.5 text-xs text-cyan-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{step.tip}</span>
        </div>

        {/* Footer controls & dots */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentStepIdx(idx);
                  soundSynth.playZoneAlertChime();
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIdx
                    ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation action buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {step.actionText && (
              <button
                type="button"
                onClick={handleCustomAction}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all hover:scale-105"
              >
                {step.actionText}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 hover:scale-105"
            >
              <span>{isLast ? 'Finish Tour' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

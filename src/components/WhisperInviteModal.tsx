import React, { useState } from 'react';
import { EchoItem } from '../types';
import { generateRandomKey } from '../utils/crypto';
import {
  Lock,
  Copy,
  Check,
  Share2,
  Compass,
  X,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface WhisperInviteModalProps {
  echo: EchoItem;
  onClose: () => void;
  onSimulateReceiveInvite: (inviteEchoId: string, key: string, sender: string) => void;
}

export const WhisperInviteModal: React.FC<WhisperInviteModalProps> = ({
  echo,
  onClose,
  onSimulateReceiveInvite,
}) => {
  const [recipientName, setRecipientName] = useState('Sarah');
  const [senderName, setSenderName] = useState('Devon');
  const [secretKey, setSecretKey] = useState<string>(() => {
    // Generate a secure 16-byte hex key
    const array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  });
  const [hasCopied, setHasCopied] = useState(false);

  // Build unique invite URL
  const inviteUrl = `${window.location.origin}?invite=${echo.id}&key=${secretKey}&sender=${encodeURIComponent(
    senderName
  )}&to=${encodeURIComponent(recipientName)}`;

  const simulatedSms = `Hey ${recipientName}, I hid a private encrypted Whisper memory for you at "${echo.title}" in Springfield. Follow this live compass radar to find it: ${inviteUrl}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[1400] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 my-auto animate-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                  Whisper Engine
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  End-to-End Encrypted
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Generate Private Whisper Invitation
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between text-white font-semibold">
            <span>Pinned Memory: {echo.title}</span>
            <span className="text-cyan-400 font-mono text-[11px]">{echo.zone}</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            This private pin is concealed from public maps. When your friend opens the unique link,
            their phone launches an <strong>AirTag Compass Radar</strong> directing them to the physical spot. The memory only decrypts when they step within 40 feet!
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Your Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Devon"
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Friend's Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Unique Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-semibold">Decryption Key (Auto-Generated)</label>
              <button
                type="button"
                onClick={async () => setSecretKey(await generateRandomKey())}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Regenerate Key
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={secretKey}
              className="w-full bg-slate-950 font-mono text-cyan-300 px-3 py-2 rounded-xl border border-slate-800 text-xs"
            />
          </div>

          {/* Link box */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Unique Compass Invite Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-slate-950 font-mono text-slate-300 px-3 py-2 rounded-xl border border-slate-800 text-[11px] truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-cyan-500/20"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SMS Preview */}
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              Simulated Text Message
            </span>
            <p className="text-[11px] text-slate-300 italic font-sans leading-relaxed">
              "{simulatedSms}"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSimulateReceiveInvite(echo.id, secretKey, senderName);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Test As Friend: Launch Compass Radar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { EchoType, EchoItem } from '../types';
import { generateRandomKey, encryptWhisper } from '../utils/crypto';
import {
  X,
  MapPin,
  Lock,
  Sparkles,
  Calendar,
  Volume2,
  Tag,
  CheckCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface DropEchoModalProps {
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  onEchoCreated: (newEcho: EchoItem) => void;
}

export const DropEchoModal: React.FC<DropEchoModalProps> = ({
  initialLat,
  initialLng,
  onClose,
  onEchoCreated,
}) => {
  const [type, setType] = useState<EchoType>('whisper');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [fullStory, setFullStory] = useState('');
  const [author, setAuthor] = useState('');
  const [zone, setZone] = useState('Downtown Springfield');
  const [year, setYear] = useState<number>(2024);
  const [isLockedWhisper, setIsLockedWhisper] = useState(false);
  const [isPrivateEncrypted, setIsPrivateEncrypted] = useState(false);
  const [inviteRecipient, setInviteRecipient] = useState('');
  const [passcodeHint, setPasscodeHint] = useState('');
  const [secretPasscode, setSecretPasscode] = useState('');
  const [soundType, setSoundType] = useState<string>('whisper-voice');
  const [tagsInput, setTagsInput] = useState('Local Memory, Secret');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setError('Please provide a title and summary for the Echo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      let encryptedPayload = '';
      let encryptionIv = '';
      let encryptionSalt = '';
      let inviteToken = '';

      if (type === 'whisper' && isPrivateEncrypted) {
        inviteToken = await generateRandomKey();
        const encrypted = await encryptWhisper(fullStory || summary, inviteToken);
        encryptedPayload = encrypted.ciphertext;
        encryptionIv = encrypted.iv;
        encryptionSalt = encrypted.salt;
      }

      const res = await fetch('/api/echoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          year,
          eraLabel: `${year} Footprint`,
          lat: initialLat,
          lng: initialLng,
          author: author || 'Springfield Traveler',
          summary,
          fullStory: isPrivateEncrypted ? '🔒 This private memory is encrypted. Open using your friend’s invite link and compass radar.' : (fullStory || summary),
          zone,
          tags,
          isLockedWhisper,
          passcodeHint: isLockedWhisper ? passcodeHint : '',
          secretPasscode: isLockedWhisper ? secretPasscode : '',
          isPrivateWhisper: isPrivateEncrypted,
          encryptedPayload,
          encryptionIv,
          encryptionSalt,
          inviteToken,
          inviteRecipient: inviteRecipient || '',
          soundType,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text.slice(0, 150) || 'Server returned an invalid response.');
      }

      if (res.ok && data.success && data.echo) {
        onEchoCreated(data.echo);
        onClose();
      } else {
        setError(data.error || 'Failed to save Echo.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Drop an Echo onto the Map
              </h3>
              <p className="text-xs text-slate-400">
                Leave a permanent or time-capsule narrative footprint at this coordinate.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300">
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Select Echo Layer Type:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('whisper');
                  setSoundType('whisper-voice');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'whisper'
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <span>🔒 Whisper</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Private memory or secret clue
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('history');
                  setSoundType('vintage-radio');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'history'
                    ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold">🏛️ History</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Time-travel archival landmark
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('shout');
                  setSoundType('city-echo');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'shout'
                    ? 'border-rose-400 bg-rose-950/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold">📢 Colab Shout</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Shared thread & community lore
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('quest');
                  setSoundType('ambient-water');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'quest'
                    ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-bold">🎯 Quest Step</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Scavenger trail challenge
                </div>
              </button>
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title *</label>
              <input
                type="text"
                placeholder="e.g. Secret Alleyway by Emerald Art Center"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Author Name / Handle</label>
              <input
                type="text"
                placeholder="e.g. Clara & Devon"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Zone & Era Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Zone / Neighborhood</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="Downtown Springfield">Downtown Springfield</option>
                <option value="Springfield Millrace">Springfield Millrace (The Pipe)</option>
                <option value="Washburne District">Washburne Historic District</option>
                <option value="South Springfield">South Springfield (Dorris Ranch)</option>
                <option value="Eugene Hills">Eugene Hills (Pre’s Rock)</option>
                <option value="Eugene Riverfront">Eugene Riverfront (Skinner Butte)</option>
                <option value="Oregon Explorer">Custom Explorer Zone</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Era / Year</span>
                <span className="font-mono text-cyan-300">{year}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1840"
                  max="2026"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />
                <input
                  type="number"
                  min="1840"
                  max="2026"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-16 bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 text-center font-mono"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Short Hook / Radar Clue * (shown in proximity alert)
            </label>
            <input
              type="text"
              placeholder="e.g. A hidden wish sealed into the riverbank in autumn 2018..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              required
            />
          </div>

          {/* Full Narrative */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Full Story Narrative (unlocked when within range)
            </label>
            <textarea
              rows={3}
              placeholder="Tell what happened at this exact physical spot..."
              value={fullStory}
              onChange={(e) => setFullStory(e.target.value)}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden resize-none"
            />
          </div>

          {/* Whisper Lock & Encryption Options */}
          {type === 'whisper' && (
            <div className="p-3.5 bg-cyan-950/40 border border-cyan-800/60 rounded-xl space-y-3">
              {/* Option A: End-to-end encrypted private invite */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-cyan-300">
                  <input
                    type="checkbox"
                    checked={isPrivateEncrypted}
                    onChange={(e) => setIsPrivateEncrypted(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Private Encrypted Pin (Zero-Knowledge, Invite Only)</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                  Conceals this pin from the public map. Generates a unique invitation link with a cryptographic key for your friend to discover via Compass Radar.
                </p>

                {isPrivateEncrypted && (
                  <div className="pl-6 pt-1">
                    <label className="block text-slate-300 text-[11px] mb-1">
                      Friend / Recipient Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah"
                      value={inviteRecipient}
                      onChange={(e) => setInviteRecipient(e.target.value)}
                      className="w-full bg-slate-900 text-white px-2.5 py-1.5 rounded border border-slate-700 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Option B: Riddle Passcode Lock */}
              <div className="pt-2 border-t border-cyan-900/40">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-cyan-300">
                  <input
                    type="checkbox"
                    checked={isLockedWhisper}
                    onChange={(e) => setIsLockedWhisper(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Also lock with an on-site riddle / clue</span>
                </label>

                {isLockedWhisper && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 pl-6">
                    <div>
                      <label className="block text-slate-300 text-[11px] mb-1">
                        Clue / Riddle Prompt
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. What color is the table umbrella?"
                        value={passcodeHint}
                        onChange={(e) => setPasscodeHint(e.target.value)}
                        className="w-full bg-slate-900 text-white px-2.5 py-1.5 rounded border border-slate-700 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[11px] mb-1">
                        Secret Key Answer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. yellow"
                        value={secretPasscode}
                        onChange={(e) => setSecretPasscode(e.target.value)}
                        className="w-full bg-slate-900 text-white px-2.5 py-1.5 rounded border border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sound Type & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Ambient Sound Vibe
              </label>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value)}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="whisper-voice">Intimate Whisper Drone</option>
                <option value="ambient-water">Millrace River Hum</option>
                <option value="vintage-radio">1900s Vintage Radio</option>
                <option value="pioneer-wind">Orchard Breeze / Wind</option>
                <option value="city-echo">Downtown Street Rhythm</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Murals, Secret, Nostalgia"
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Coordinates indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="flex items-center gap-1 font-mono">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Pinned at: {initialLat.toFixed(5)}, {initialLng.toFixed(5)}
            </span>
            <span className="text-cyan-400 font-semibold">Ready to radiate</span>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Radiating...' : 'Drop Echo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

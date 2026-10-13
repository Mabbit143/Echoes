import React, { useState } from 'react';
import { EchoItem, ColabContribution } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import {
  Upload,
  ArrowBigUp,
  ArrowBigDown,
  Image,
  Sparkles,
  Clock,
  User,
  Plus,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface ColabThreadPanelProps {
  echo: EchoItem;
  onContributionAdded: (newContrib: ColabContribution, newResonanceScore: number) => void;
  onVotePin: (echoId: string, direction: 'up' | 'down') => void;
  onVoteContribution: (echoId: string, contribId: string, direction: 'up' | 'down') => void;
}

export const ColabThreadPanel: React.FC<ColabThreadPanelProps> = ({
  echo,
  onContributionAdded,
  onVotePin,
  onVoteContribution,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [storyText, setStoryText] = useState('');
  const [contribYear, setContribYear] = useState<number>(2024);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [votedContribs, setVotedContribs] = useState<Record<string, 'up' | 'down'>>({});
  const [hasVotedPin, setHasVotedPin] = useState<'up' | 'down' | null>(null);

  // Compress & resize image client-side to keep payloads lightweight (~150KB) and instant
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image file upload with compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const compressedDataUrl = await compressImage(file);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      console.warn('Compression failed, using raw file:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetImage = (url: string) => {
    setImageUrl(url);
    setUploadError(null);
  };

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim()) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await safeFetchJson<{
        success: boolean;
        contribution: ColabContribution;
        resonanceScore: number;
      }>(`/api/echoes/${echo.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName || 'Springfield Resident',
          text: storyText.trim(),
          year: contribYear,
          imageUrl: imageUrl || '',
        }),
      });

      if (result.ok && result.data?.success && result.data.contribution) {
        onContributionAdded(result.data.contribution, result.data.resonanceScore);
        setStoryText('');
        setImageUrl('');
        setIsAdding(false);
      } else {
        setUploadError(result.error || 'Failed to submit contribution.');
      }
    } catch (err: any) {
      console.error('Failed to submit contribution:', err);
      setUploadError(err?.message || 'Network error occurred while submitting.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVotePin = (direction: 'up' | 'down') => {
    if (hasVotedPin === direction) return;
    setHasVotedPin(direction);
    onVotePin(echo.id, direction);
  };

  const handleVoteContrib = (contribId: string, direction: 'up' | 'down') => {
    if (votedContribs[contribId] === direction) return;
    setVotedContribs((prev) => ({ ...prev, [contribId]: direction }));
    onVoteContribution(echo.id, contribId, direction);
  };

  // Sort contributions by net upvotes (quality ranking)
  const contributionsList = (echo.contributions || []).slice().sort((a, b) => {
    const scoreA = a.upvotes - a.downvotes;
    const scoreB = b.upvotes - b.downvotes;
    return scoreB - scoreA;
  });

  // Calculate quality badge
  const qualityBadge = () => {
    if (echo.resonanceScore >= 500) {
      return {
        label: '🏆 Legendary Lore',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
      };
    }
    if (echo.resonanceScore >= 200) {
      return {
        label: '🔥 Trending Community Story',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
      };
    }
    if (echo.resonanceScore >= 50) {
      return {
        label: '✨ Verified Local Footprint',
        color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      };
    }
    return {
      label: '🌱 Emerging Colab Thread',
      color: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  const badge = qualityBadge();

  return (
    <div className="space-y-4 pt-3 border-t border-slate-800">
      {/* Top Colab Engine Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Colab Engine ({contributionsList.length} Community Threads)</span>
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Pin Upvote / Downvote buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleVotePin('up')}
            className={`p-1.5 rounded-lg transition-all ${
              hasVotedPin === 'up'
                ? 'bg-amber-400 text-slate-950 font-bold scale-110 shadow-xs'
                : 'text-slate-400 hover:text-amber-400'
            }`}
            title="Upvote Quality (+5 Resonance)"
          >
            <ArrowBigUp className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-white px-1">
            {echo.resonanceScore}
          </span>
          <button
            onClick={() => handleVotePin('down')}
            className={`p-1.5 rounded-lg transition-all ${
              hasVotedPin === 'down'
                ? 'bg-rose-500 text-slate-950 font-bold scale-110 shadow-xs'
                : 'text-slate-400 hover:text-rose-400'
            }`}
            title="Downvote (-3 Resonance)"
          >
            <ArrowBigDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Button to toggle Add Contribution Form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Contribute Photo or Story to this Landmark</span>
        </button>
      ) : (
        <form
          onSubmit={handleSubmitContribution}
          className="p-4 bg-slate-950/80 rounded-2xl border border-cyan-500/40 space-y-3 text-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Your Voice to the Living Thread</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setUploadError(null);
              }}
              className="text-slate-500 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Your Name / Handle</label>
              <input
                type="text"
                placeholder="e.g. Jordan (Eugene Native)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex justify-between">
                <span>Era / Year of Memory</span>
                <span className="font-mono text-cyan-400">{contribYear}</span>
              </label>
              <input
                type="range"
                min="1850"
                max="2026"
                value={contribYear}
                onChange={(e) => setContribYear(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Your Memory / Historical Note *
            </label>
            <textarea
              rows={2}
              required
              placeholder="What happened when you visited? What detail did you notice?"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-400 focus:outline-hidden resize-none"
            />
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Upload Photo (File or URL)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-slate-400 text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
              />
              <span className="text-slate-500 text-[11px]">or paste link:</span>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 min-w-[140px] bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-700 focus:border-cyan-400 text-xs"
              />
            </div>

            {/* Quick preset photo tags */}
            <div className="flex items-center gap-1.5 pt-1.5 text-[10px] text-slate-500">
              <span>Quick sample photos:</span>
              <button
                type="button"
                onClick={() => handlePresetImage('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80')}
                className="text-cyan-400 hover:underline"
              >
                Mural Detail
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handlePresetImage('https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80')}
                className="text-cyan-400 hover:underline"
              >
                Millrace Water
              </button>
            </div>

            {imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700">
                <img src={imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/90 text-white text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            {isUploading ? 'Pinning to Thread...' : 'Submit to Colab'}
          </button>
        </form>
      )}

      {/* Community Contributions Stream */}
      <div className="space-y-3">
        {contributionsList.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-3">
            No community notes yet. Be the first to upload a photo or story to this landmark!
          </p>
        ) : (
          contributionsList.map((contrib) => {
            const userVote = votedContribs[contrib.id];
            const netScore = contrib.upvotes - contrib.downvotes;

            return (
              <div
                key={contrib.id}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs hover:border-slate-700 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-white truncate">{contrib.author}</span>
                    {contrib.year && (
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded shrink-0">
                        {contrib.year}
                      </span>
                    )}
                    {contrib.verifiedLocal && (
                      <span className="text-cyan-400 flex items-center gap-0.5 text-[10px] shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Local
                      </span>
                    )}
                  </div>

                  {/* Voting controls */}
                  <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800 shrink-0">
                    <button
                      onClick={() => handleVoteContrib(contrib.id, 'up')}
                      className={`transition-colors ${
                        userVote === 'up' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-amber-400'
                      }`}
                      title="Upvote contribution"
                    >
                      <ArrowBigUp className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[11px] font-bold text-slate-200">
                      {netScore}
                    </span>
                    <button
                      onClick={() => handleVoteContrib(contrib.id, 'down')}
                      className={`transition-colors ${
                        userVote === 'down' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-400'
                      }`}
                      title="Downvote"
                    >
                      <ArrowBigDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Narrative text */}
                <p className="text-slate-300 leading-relaxed text-xs">
                  {contrib.text}
                </p>

                {/* Photo attachment if available */}
                {contrib.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48">
                    <img
                      src={contrib.imageUrl}
                      alt="Colab upload"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

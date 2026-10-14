import React, { useState, useEffect } from 'react';
import { EchoItem } from '../types';
import {
  UserProfile,
  QuestDefinition,
  QuestStep,
  QUEST_CATALOG,
  loadUserProfile,
  saveUserProfile,
  advanceQuestStep,
  getResonanceRank,
} from '../utils/userProfile';
import { soundSynth } from '../utils/audioSynth';
import {
  X,
  User,
  Compass,
  Sparkles,
  Flame,
  Feather,
  Scroll,
  MapPin,
  CheckCircle2,
  Lock,
  Plus,
  Radio,
  Trophy,
  History,
  TrendingUp,
  Award,
  ChevronRight,
  ExternalLink,
  Edit2,
  Check,
  Navigation,
  ThumbsUp,
  Target,
  ArrowRight,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  echoes: EchoItem[];
  userLocation: { lat: number; lng: number };
  onTeleportToEcho: (echo: EchoItem) => void;
  onOpenEchoDrawer: (echo: EchoItem) => void;
  onTrackQuestWaypoint: (step: QuestStep) => void;
  onOpenDropModal: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'compass', icon: Compass, label: 'Pathfinder' },
  { id: 'sparkles', icon: Sparkles, label: 'Resonant' },
  { id: 'feather', icon: Feather, label: 'Chronicler' },
  { id: 'flame', icon: Flame, label: 'Torchbearer' },
  { id: 'scroll', icon: Scroll, label: 'Archivist' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  echoes,
  userLocation,
  onTeleportToEcho,
  onOpenEchoDrawer,
  onTrackQuestWaypoint,
  onOpenDropModal,
}) => {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [activeTab, setActiveTab] = useState<'echoes' | 'quests' | 'history'>('echoes');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [questFilter, setQuestFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [historyCategory, setHistoryCategory] = useState<string>('all');
  const [echoFilterType, setEchoFilterType] = useState<string>('all');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>('simpsons-pop-heritage');

  // Sync profile when opened or event fired
  useEffect(() => {
    if (isOpen) {
      const current = loadUserProfile();
      setProfile(current);
      setUsernameInput(current.username);
      setBioInput(current.bio);
    }

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      }
    };

    window.addEventListener('echoes-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('echoes-profile-updated', handleProfileUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate user-dropped echoes
  const userDroppedEchoes = echoes.filter(
    (e) => profile.droppedEchoIds.includes(e.id) || e.author === profile.username
  );

  const filteredDroppedEchoes = userDroppedEchoes.filter((e) => {
    if (echoFilterType === 'all') return true;
    return e.type === echoFilterType;
  });

  // Calculate community upvotes
  const totalUpvotesReceived = userDroppedEchoes.reduce(
    (sum, e) => sum + (e.upvotes || 0),
    0
  );

  // Resonance rank
  const rankInfo = getResonanceRank(profile.resonanceScore);

  // Active quests
  const activeQuestsCount = QUEST_CATALOG.filter(
    (q) => !profile.questProgress[q.id]?.completed
  ).length;
  const completedQuestsCount = QUEST_CATALOG.filter(
    (q) => profile.questProgress[q.id]?.completed
  ).length;

  // Handle saving username
  const handleSaveUsername = () => {
    if (usernameInput.trim()) {
      const updated = { ...profile, username: usernameInput.trim() };
      setProfile(updated);
      saveUserProfile(updated);
    }
    setIsEditingUsername(false);
  };

  // Handle saving bio
  const handleSaveBio = () => {
    const updated = { ...profile, bio: bioInput.trim() };
    setProfile(updated);
    saveUserProfile(updated);
    setIsEditingBio(false);
  };

  // Handle changing avatar
  const handleSelectAvatar = (avatarId: string) => {
    const updated = { ...profile, avatar: avatarId };
    setProfile(updated);
    saveUserProfile(updated);
    soundSynth.playZoneAlertChime();
  };

  // Handle advancing quest step manually from waypoint
  const handleCompleteStep = (questId: string, stepNumber: number) => {
    soundSynth.playZoneAlertChime();
    const result = advanceQuestStep(questId, stepNumber);
    setProfile(result.profile);
  };

  // Avatar Icon component
  const CurrentAvatarIcon =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatar)?.icon || Compass;

  // Filter history
  const filteredHistory = profile.resonanceHistory.filter((item) => {
    if (historyCategory === 'all') return true;
    return item.category === historyCategory;
  });

  return (
    <div className="fixed inset-0 z-[1250] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] text-slate-100 flex flex-col my-auto max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar with selector */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-cyan-300">
                  <CurrentAvatarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                </div>
              </div>

              {/* Avatar Selector Dropdown / Row */}
              <div className="flex items-center gap-1 mt-2">
                {AVATAR_OPTIONS.map((av) => {
                  const Icon = av.icon;
                  return (
                    <button
                      key={av.id}
                      onClick={() => handleSelectAvatar(av.id)}
                      className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                        profile.avatar === av.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title={av.label}
                    >
                      <Icon className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Info & Editable Handle */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 border border-cyan-500 text-white font-bold text-base sm:text-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {profile.username}
                    </h2>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Edit handle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {rankInfo.rank}
                </span>
              </div>

              {/* Editable Bio */}
              {isEditingBio ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBio()}
                    className="w-full max-w-md px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-600 text-xs text-slate-200"
                    placeholder="Brief explorer note..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveBio}
                    className="p-1 rounded bg-slate-700 text-cyan-300 hover:bg-slate-600 text-xs"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p
                  onClick={() => setIsEditingBio(true)}
                  className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer flex items-center gap-1.5 max-w-xl line-clamp-1"
                  title="Click to edit bio"
                >
                  <span>{profile.bio || 'Wandering the living memory map of Springfield & Eugene.'}</span>
                  <Edit2 className="w-2.5 h-2.5 opacity-60" />
                </p>
              )}

              {/* Resonance Rank Progress Bar */}
              <div className="pt-2 max-w-md space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Level Progress
                  </span>
                  <span className="text-slate-400 font-mono">
                    {profile.resonanceScore} / {rankInfo.nextScore} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${rankInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Resonance
                </div>
                <div className="text-lg font-black text-cyan-300 font-mono">
                  {profile.resonanceScore}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  My Echoes
                </div>
                <div className="text-lg font-black text-white font-mono">
                  {userDroppedEchoes.length}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Quests
                </div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {completedQuestsCount}/{QUEST_CATALOG.length}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Upvotes
                </div>
                <div className="text-lg font-black text-rose-400 font-mono">
                  {totalUpvotesReceived}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setActiveTab('echoes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'echoes'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>User Dropped Echoes ({userDroppedEchoes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quests')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'quests'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Active Quests ({activeQuestsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Resonance History</span>
            </button>
          </div>
        </div>

        {/* Tab 1: User Dropped Echoes */}
        {activeTab === 'echoes' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Filter Sub-bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {['all', 'whisper', 'shout', 'history', 'quest'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setEchoFilterType(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      echoFilterType === t
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenDropModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Drop Another Echo</span>
              </button>
            </div>

            {filteredDroppedEchoes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">No echoes matching this filter</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Drop a private whisper, historical memory, or community story on the map to start building your footprint.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDropModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg transition-colors cursor-pointer"
                >
                  Drop Your First Echo (+35 Pts)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDroppedEchoes.map((echo) => {
                  const typeColors = {
                    whisper: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                    shout: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                    history: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    quest: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  }[echo.type];

                  return (
                    <div
                      key={echo.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeColors}`}
                          >
                            {echo.type}
                          </span>
                          <span className="text-[11px] text-cyan-300 font-mono font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            {echo.resonanceScore} resonance
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {echo.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {echo.summary}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {echo.zone}
                          </span>
                          {echo.year && <span>• {echo.year}</span>}
                          {echo.upvotes !== undefined && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <ThumbsUp className="w-3 h-3 text-rose-400" />
                              {echo.upvotes}
                            </span>
                          )}
                          {echo.isLockedWhisper && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Lock className="w-3 h-3" />
                              Passcode
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                        <button
                          onClick={() => {
                            onClose();
                            onTeleportToEcho(echo);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Jump to Map</span>
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenEchoDrawer(echo);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Inspect Story
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Quests */}
        {activeTab === 'quests' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Filter pills */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setQuestFilter('active')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    questFilter === 'active'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active ({activeQuestsCount})
                </button>
                <button
                  onClick={() => setQuestFilter('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    questFilter === 'completed'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Completed ({completedQuestsCount})
                </button>
                <button
                  onClick={() => setQuestFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    questFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({QUEST_CATALOG.length})
                </button>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Complete all waypoints to unlock rare titles
              </div>
            </div>

            {/* Quests List */}
            <div className="space-y-4">
              {QUEST_CATALOG.filter((q) => {
                const progress = profile.questProgress[q.id];
                if (questFilter === 'active') return !progress?.completed;
                if (questFilter === 'completed') return !!progress?.completed;
                return true;
              }).map((quest) => {
                const progress = profile.questProgress[quest.id] || {
                  currentStep: 0,
                  completed: false,
                  lastUpdated: '',
                };
                const isExpanded = expandedQuestId === quest.id;
                const percent = Math.round((progress.currentStep / quest.steps.length) * 100);

                return (
                  <div
                    key={quest.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {quest.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                            {quest.difficulty} Difficulty
                          </span>
                          {progress.completed && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {quest.title}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xl">
                          {quest.tagline}
                        </p>
                      </div>

                      {/* Reward badge */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 sm:text-right shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Completion Reward
                        </div>
                        <div className="text-xs font-bold text-amber-300 flex items-center sm:justify-end gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>+{quest.rewardPoints} Pts</span>
                          <span className="text-slate-400 font-normal">· {quest.rewardBadge}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">
                          Progress: Step {progress.currentStep} of {quest.steps.length}
                        </span>
                        <span className="text-cyan-300 font-mono font-bold">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Toggle waypoints button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() =>
                          setExpandedQuestId(isExpanded ? null : quest.id)
                        }
                        className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Waypoints' : 'View Waypoints & Radar Targets'}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {!progress.completed && quest.steps[progress.currentStep] && (
                        <button
                          onClick={() => {
                            const nextStep = quest.steps[progress.currentStep];
                            onClose();
                            onTrackQuestWaypoint(nextStep);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>Track Step {progress.currentStep + 1} on Radar</span>
                        </button>
                      )}
                    </div>

                    {/* Waypoint steps list */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        {quest.steps.map((step, idx) => {
                          const isDone = idx < progress.currentStep;
                          const isCurrent = idx === progress.currentStep && !progress.completed;

                          return (
                            <div
                              key={step.stepNumber}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                                isDone
                                  ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-300'
                                  : isCurrent
                                  ? 'bg-cyan-950/30 border-cyan-500/60 text-white shadow-sm'
                                  : 'bg-slate-900/40 border-slate-800/60 text-slate-400 opacity-70'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : isCurrent ? (
                                    <Target className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-xs flex items-center gap-1.5">
                                    <span>
                                      Step {step.stepNumber}: {step.title}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-900/60 px-1.5 py-0.2 rounded-full">
                                        Current Objective
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {step.hint}
                                  </div>
                                </div>
                              </div>

                              {/* Waypoint actions */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button
                                  onClick={() => {
                                    onClose();
                                    onTrackQuestWaypoint(step);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                                  title="Point compass radar to this waypoint"
                                >
                                  <Compass className="w-3 h-3" />
                                  <span>Radar</span>
                                </button>

                                {isCurrent && (
                                  <button
                                    onClick={() => handleCompleteStep(quest.id, step.stepNumber)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                                    title="Mark step completed"
                                  >
                                    Check In (+30 Pts)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Resonance Score History */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Category filter pills */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {['all', 'drop', 'quest', 'vote', 'colab', 'discovery'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setHistoryCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      historyCategory === cat
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="text-xs text-cyan-300 font-mono font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Lifetime Resonance: {profile.resonanceScore} pts
              </div>
            </div>

            {/* How to earn guide */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-cyan-200">Earn Resonance Points:</span>
              <span className="text-slate-400">+35 Drop Echo · +30 Checkpoint · +150 Quest Complete · +5 Community Upvote</span>
            </div>

            {/* Timeline Events */}
            <div className="space-y-2.5">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No resonance history recorded in this category yet.
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const categoryBadge = {
                    drop: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
                    quest: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                    vote: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                    colab: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                    discovery: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                  }[item.category] || 'bg-slate-800 text-slate-300 border-slate-700';

                  const dateFormatted = new Date(item.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryBadge}`}
                          >
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-500">{dateFormatted}</span>
                        </div>

                        <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800/80">
                          +{item.points}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Profile synced to local memory & live grid</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

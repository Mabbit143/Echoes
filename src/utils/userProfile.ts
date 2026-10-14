import { EchoItem } from '../types';

export interface ResonanceHistoryEvent {
  id: string;
  title: string;
  description: string;
  points: number;
  timestamp: string;
  category: 'drop' | 'quest' | 'vote' | 'discovery' | 'colab';
}

export interface QuestStep {
  stepNumber: number;
  title: string;
  zone: string;
  lat: number;
  lng: number;
  hint: string;
  echoId?: string;
  summary: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  tagline: string;
  zone: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Epic';
  rewardPoints: number;
  rewardBadge: string;
  steps: QuestStep[];
}

export interface UserQuestProgress {
  currentStep: number;
  completed: boolean;
  completedAt?: string;
  lastUpdated: string;
}

export interface UserProfile {
  username: string;
  title: string;
  avatar: string; // avatar identifier icon
  bio: string;
  joinedDate: string;
  resonanceScore: number;
  droppedEchoIds: string[];
  questProgress: Record<string, UserQuestProgress>;
  resonanceHistory: ResonanceHistoryEvent[];
}

export const QUEST_CATALOG: QuestDefinition[] = [
  {
    id: 'simpsons-pop-heritage',
    title: 'The Simpsons Pop Heritage Trail',
    tagline: 'Track the iconic murals, art centers, and timber landmarks that inspired Matt Groening.',
    zone: 'Downtown Springfield',
    category: 'Pop Culture & Murals',
    difficulty: 'Easy',
    rewardPoints: 150,
    rewardBadge: 'Springfield Cartoonist',
    steps: [
      {
        stepNumber: 1,
        title: 'The Simpsons Official Mural',
        zone: 'Downtown Springfield',
        lat: 44.0463,
        lng: -123.0182,
        hint: 'Beside the Emerald Art Center on Main Street. Look for Homer with his classic donut.',
        echoId: 'simpsons-mural-downtown',
        summary: 'Official tribute mural painted with direct endorsement from creator Matt Groening.',
      },
      {
        stepNumber: 2,
        title: 'Springfield History Museum & Depot',
        zone: 'Downtown Springfield',
        lat: 44.0458,
        lng: -123.0205,
        hint: 'The historic Southern Pacific railroad depot where passengers once boarded steam locomotives.',
        echoId: 'springfield-depot-museum',
        summary: 'Early 20th-century wooden train depot and telegraph office in the civic core.',
      },
      {
        stepNumber: 3,
        title: 'Secret Booth at Washburne Cafe',
        zone: 'Downtown Springfield',
        lat: 44.0468,
        lng: -123.0192,
        hint: 'Brick window table with copper accents along Main St. Listen for the warm cafe whispers.',
        echoId: 'washburne-cafe-whisper',
        summary: 'A time-capsule whisper left at the corner brick window table where lifelong dreams started.',
      },
      {
        stepNumber: 4,
        title: 'Booth-Kelly Mill Timbers Threshold',
        zone: 'Downtown Springfield',
        lat: 44.049,
        lng: -123.0145,
        hint: 'Near the original sawmill grounds where timber logs were unloaded from the river flume.',
        summary: 'The epicenter of the 1900s Oregon timber empire that sustained the entire region.',
      },
    ],
  },
  {
    id: 'millrace-whispers-odyssey',
    title: 'The Millrace Whispers Odyssey',
    tagline: 'Uncover nocturnal folklore, glowing culvert moss, and hidden waterways.',
    zone: 'Springfield Millrace',
    category: 'Urban Legend & Lore',
    difficulty: 'Medium',
    rewardPoints: 200,
    rewardBadge: 'Keeper of the Culvert',
    steps: [
      {
        stepNumber: 1,
        title: 'The Pipe (550 Walnut Pl)',
        zone: 'Springfield Millrace',
        lat: 44.0416,
        lng: -123.0082,
        hint: 'Revered concrete water passage. Listen for the subterranean hum of rushing water.',
        echoId: 'springfield-the-pipe',
        summary: 'Industrial concrete threshold celebrated for decades as zen meditation space.',
      },
      {
        stepNumber: 2,
        title: 'Dorris Ranch Living Hazelnut Groves',
        zone: 'South Springfield',
        lat: 44.0298,
        lng: -123.0168,
        hint: 'Oldest commercial hazelnut farm in the USA. Walk the shaded river loop paths.',
        echoId: 'dorris-ranch-filbert-orchard',
        summary: '1892 living history farm where 50 Barcelona hazelnut trees began an agricultural tradition.',
      },
      {
        stepNumber: 3,
        title: 'Willamette Confluence Rapids',
        zone: 'Island Park',
        lat: 44.0438,
        lng: -123.0275,
        hint: 'Where the cold cascade runoff blends into the slow channel beneath the old bridges.',
        summary: 'The sacred fishing and log-driving threshold known to Kalapuya tribes for centuries.',
      },
    ],
  },
  {
    id: 'pioneer-lookout-trail',
    title: 'Pioneer Heights & Skyline Pilgrimage',
    tagline: 'Climb from historic craftsman supervisor quarters to panoramic valley lookouts.',
    zone: 'Washburne District',
    category: 'Historic Expedition',
    difficulty: 'Epic',
    rewardPoints: 250,
    rewardBadge: 'Valley Pathfinder',
    steps: [
      {
        stepNumber: 1,
        title: 'Washburne Historic District Victorian Row',
        zone: 'Washburne District',
        lat: 44.0505,
        lng: -123.0162,
        hint: '1890s supervisor homes built during the Booth-Kelly timber boom.',
        echoId: 'washburne-historic-district',
        summary: 'Preserved Victorian and Craftsman architectural gems along tree-lined gravel paths.',
      },
      {
        stepNumber: 2,
        title: 'Pre’s Rock Memorial & Skyline Trail',
        zone: 'Hendricks Park / Eugene Hills',
        lat: 44.0435,
        lng: -123.0488,
        hint: 'Birch Lane curve with runner race bibs and medals pinned to the stone sanctuary.',
        echoId: 'pres-rock-memorial',
        summary: 'Emotional outdoor sanctuary for runners dedicated to Steve Prefontaine.',
      },
      {
        stepNumber: 3,
        title: 'Skinner Butte Summit & Cabin Site',
        zone: 'Eugene Riverfront',
        lat: 44.0583,
        lng: -123.0915,
        hint: '682-foot summit overlook above the historic Willamette river floodplains.',
        echoId: 'skinner-butte-lookout',
        summary: 'Where Eugene Skinner built his high trading cabin in 1846 to escape river floods.',
      },
    ],
  },
];

const STORAGE_KEY = 'echoes_user_profile_v1';

export function getInitialUserProfile(): UserProfile {
  return {
    username: 'Springfield Wanderer',
    title: 'Resonant Chronicler',
    avatar: 'compass',
    bio: 'Wandering the hidden alleys, historic millraces, and living archives of the Willamette Valley.',
    joinedDate: 'October 2026',
    resonanceScore: 385,
    droppedEchoIds: ['springfield-the-pipe'], // Default starting pin
    questProgress: {
      'simpsons-pop-heritage': {
        currentStep: 2,
        completed: false,
        lastUpdated: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      'millrace-whispers-odyssey': {
        currentStep: 1,
        completed: false,
        lastUpdated: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      'pioneer-lookout-trail': {
        currentStep: 0,
        completed: false,
        lastUpdated: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    },
    resonanceHistory: [
      {
        id: 'hist-1',
        title: 'Dropped Echo: The Pipe (550 Walnut Pl)',
        description: 'Placed encrypted whisper at the sacred Millrace culvert threshold.',
        points: 40,
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        category: 'drop',
      },
      {
        id: 'hist-2',
        title: 'Community Upvote Surge on The Pipe',
        description: '48 local wanderers upvoted and resonated with your culvert audio story.',
        points: 120,
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        category: 'vote',
      },
      {
        id: 'hist-3',
        title: 'Quest Step Completed: The Simpsons Official Mural',
        description: 'Visited the Emerald Art Center wall and calibrated compass radar.',
        points: 50,
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        category: 'quest',
      },
      {
        id: 'hist-4',
        title: 'Verified Local History Contributor',
        description: 'Added archival notes on 1892 Washburne timber supervisors.',
        points: 75,
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        category: 'colab',
      },
      {
        id: 'hist-5',
        title: 'Decrypted Secret Echo at Washburne Cafe',
        description: 'Unlocked private time-capsule whisper using proximity radar.',
        points: 25,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        category: 'discovery',
      },
    ],
  };
}

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') return getInitialUserProfile();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialUserProfile();
      saveUserProfile(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...getInitialUserProfile(),
      ...parsed,
    };
  } catch (err) {
    console.warn('Failed to parse user profile from localStorage:', err);
    return getInitialUserProfile();
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('echoes-profile-updated', { detail: profile }));
  } catch (err) {
    console.warn('Failed to save user profile:', err);
  }
}

export function recordEchoDrop(echo: EchoItem): UserProfile {
  const profile = loadUserProfile();

  if (!profile.droppedEchoIds.includes(echo.id)) {
    profile.droppedEchoIds.unshift(echo.id);
  }

  const bonusPoints = 35;
  profile.resonanceScore += bonusPoints;

  const event: ResonanceHistoryEvent = {
    id: `hist-drop-${Date.now()}`,
    title: `Dropped ${echo.type.toUpperCase()}: ${echo.title}`,
    description: `Placed on the map in ${echo.zone}. Echo is now humming on the live frequency.`,
    points: bonusPoints,
    timestamp: new Date().toISOString(),
    category: 'drop',
  };

  profile.resonanceHistory.unshift(event);
  saveUserProfile(profile);
  return profile;
}

export function advanceQuestStep(questId: string, stepNumber: number): { profile: UserProfile; completed: boolean } {
  const profile = loadUserProfile();
  const quest = QUEST_CATALOG.find((q) => q.id === questId);
  if (!quest) return { profile, completed: false };

  const current = profile.questProgress[questId] || {
    currentStep: 0,
    completed: false,
    lastUpdated: new Date().toISOString(),
  };

  const isLastStep = stepNumber >= quest.steps.length;
  const newStep = Math.min(stepNumber, quest.steps.length);
  const newlyCompleted = isLastStep && !current.completed;

  let pointsEarned = 30; // standard step bonus
  if (newlyCompleted) {
    pointsEarned += quest.rewardPoints;
  }

  profile.questProgress[questId] = {
    currentStep: newStep,
    completed: newlyCompleted || current.completed,
    completedAt: newlyCompleted ? new Date().toISOString() : current.completedAt,
    lastUpdated: new Date().toISOString(),
  };

  profile.resonanceScore += pointsEarned;

  const event: ResonanceHistoryEvent = {
    id: `hist-quest-${Date.now()}`,
    title: newlyCompleted
      ? `🏆 Completed Quest: ${quest.title}!`
      : `Quest Progress: Step ${newStep}/${quest.steps.length} in ${quest.title}`,
    description: newlyCompleted
      ? `Earned the "${quest.rewardBadge}" badge and +${pointsEarned} Resonance!`
      : `Visited "${quest.steps[newStep - 1]?.title || 'Waypoint'}" in ${quest.steps[newStep - 1]?.zone || quest.zone}.`,
    points: pointsEarned,
    timestamp: new Date().toISOString(),
    category: 'quest',
  };

  profile.resonanceHistory.unshift(event);
  saveUserProfile(profile);
  return { profile, completed: newlyCompleted };
}

export function recordCommunityVoteBonus(echoTitle: string, points: number = 5): UserProfile {
  const profile = loadUserProfile();
  profile.resonanceScore += points;

  const event: ResonanceHistoryEvent = {
    id: `hist-vote-${Date.now()}`,
    title: `Community Resonance on "${echoTitle}"`,
    description: `A wanderer resonated with your living footprint.`,
    points,
    timestamp: new Date().toISOString(),
    category: 'vote',
  };

  profile.resonanceHistory.unshift(event);
  saveUserProfile(profile);
  return profile;
}

export function getResonanceRank(score: number): { rank: string; nextScore: number; progressPercent: number } {
  if (score < 150) {
    return { rank: 'Novice Wanderer', nextScore: 150, progressPercent: Math.min(100, Math.round((score / 150) * 100)) };
  } else if (score < 350) {
    return { rank: 'Local Seeker', nextScore: 350, progressPercent: Math.min(100, Math.round(((score - 150) / 200) * 100)) };
  } else if (score < 600) {
    return { rank: 'Resonant Chronicler', nextScore: 600, progressPercent: Math.min(100, Math.round(((score - 350) / 250) * 100)) };
  } else if (score < 1000) {
    return { rank: 'Master Lorekeeper', nextScore: 1000, progressPercent: Math.min(100, Math.round(((score - 600) / 400) * 100)) };
  } else {
    return { rank: 'Living Echo Guardian', nextScore: 2000, progressPercent: 100 };
  }
}

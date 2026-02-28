import { create } from 'zustand';

export interface StreakMilestone {
  target: number;
  bonus: number;
}

export interface RewardBreakdown {
  baseReward: number;
  replayReduction: number;
  streakBonus: number;
  milestoneBonus: number;
  comebackBonus: number;
  chapterUnlockBonus: number;
  totalBonus: number;
  totalPayout: number;
  newStreak: number;
  milestoneReached: number | null;
}

interface RunResultInput {
  success: boolean;
  baseReward: number;
  replayClear: boolean;
  unlockedNewChapter: boolean;
}

interface MotivationStoreState {
  winStreak: number;
  longestStreak: number;
  totalBonusEarned: number;
  lastRunSucceeded: boolean | null;
  loadFromStorage: () => boolean;
  saveToStorage: () => boolean;
  reset: () => void;
  recordRunResult: (input: RunResultInput) => RewardBreakdown;
}

const STORAGE_KEY = 'chainquest_motivation_v1';
const REPLAY_REWARD_RATIO = 0.35;
const COMEBACK_BONUS = 80;
const CHAPTER_UNLOCK_BONUS = 300;

const STREAK_MILESTONES: StreakMilestone[] = [
  { target: 3, bonus: 120 },
  { target: 5, bonus: 220 },
  { target: 8, bonus: 420 },
  { target: 12, bonus: 700 },
];

function getStreakBonusRate(streak: number): number {
  if (streak >= 10) return 0.32;
  if (streak >= 7) return 0.24;
  if (streak >= 5) return 0.18;
  if (streak >= 3) return 0.12;
  if (streak >= 2) return 0.08;
  return 0.04;
}

export function getNextStreakMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((milestone) => milestone.target > streak) ?? null;
}

const initialState = {
  winStreak: 0,
  longestStreak: 0,
  totalBonusEarned: 0,
  lastRunSucceeded: null as boolean | null,
};

type PersistedState = Pick<
  MotivationStoreState,
  'winStreak' | 'longestStreak' | 'totalBonusEarned' | 'lastRunSucceeded'
>;

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<PersistedState>;
  return (
    typeof candidate.winStreak === 'number' &&
    typeof candidate.longestStreak === 'number' &&
    typeof candidate.totalBonusEarned === 'number' &&
    (typeof candidate.lastRunSucceeded === 'boolean' || candidate.lastRunSucceeded === null)
  );
}

export const useMotivationStore = create<MotivationStoreState>((set, get) => ({
  ...initialState,

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const parsed: unknown = JSON.parse(raw);
      if (!isPersistedState(parsed)) {
        return false;
      }

      set({
        winStreak: parsed.winStreak,
        longestStreak: parsed.longestStreak,
        totalBonusEarned: parsed.totalBonusEarned,
        lastRunSucceeded: parsed.lastRunSucceeded,
      });
      return true;
    } catch {
      return false;
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      const payload: PersistedState = {
        winStreak: state.winStreak,
        longestStreak: state.longestStreak,
        totalBonusEarned: state.totalBonusEarned,
        lastRunSucceeded: state.lastRunSucceeded,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  },

  reset: () => {
    set(initialState);
    localStorage.removeItem(STORAGE_KEY);
  },

  recordRunResult: ({ success, baseReward, replayClear, unlockedNewChapter }) => {
    const previousState = get();

    if (!success) {
      set({
        winStreak: 0,
        lastRunSucceeded: false,
      });
      get().saveToStorage();
      return {
        baseReward: 0,
        replayReduction: 0,
        streakBonus: 0,
        milestoneBonus: 0,
        comebackBonus: 0,
        chapterUnlockBonus: 0,
        totalBonus: 0,
        totalPayout: 0,
        newStreak: 0,
        milestoneReached: null,
      };
    }

    const newStreak = previousState.winStreak + 1;
    const replayReduction = replayClear ? 1 - REPLAY_REWARD_RATIO : 0;
    const adjustedBaseReward = Math.floor(baseReward * (replayClear ? REPLAY_REWARD_RATIO : 1));
    const streakBonus = Math.floor(adjustedBaseReward * getStreakBonusRate(newStreak));
    const milestoneReached =
      STREAK_MILESTONES.find((milestone) => milestone.target === newStreak)?.target ?? null;
    const milestoneBonus =
      STREAK_MILESTONES.find((milestone) => milestone.target === newStreak)?.bonus ?? 0;
    const comebackBonus =
      previousState.lastRunSucceeded === false && adjustedBaseReward > 0 ? COMEBACK_BONUS : 0;
    const chapterUnlockBonus = unlockedNewChapter ? CHAPTER_UNLOCK_BONUS : 0;
    const totalBonus = streakBonus + milestoneBonus + comebackBonus + chapterUnlockBonus;
    const totalPayout = adjustedBaseReward + totalBonus;

    set({
      winStreak: newStreak,
      longestStreak: Math.max(previousState.longestStreak, newStreak),
      totalBonusEarned: previousState.totalBonusEarned + totalBonus,
      lastRunSucceeded: true,
    });
    get().saveToStorage();

    return {
      baseReward: adjustedBaseReward,
      replayReduction,
      streakBonus,
      milestoneBonus,
      comebackBonus,
      chapterUnlockBonus,
      totalBonus,
      totalPayout,
      newStreak,
      milestoneReached,
    };
  },
}));



import { AppState } from '../types.ts';
import { generateSeedData } from '../constants.tsx';

const STORAGE_KEY = 'liveshock_v1_storage';

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Could not load from localStorage:", e);
  }
  return {
    pigs: generateSeedData(),
    feedEvents: [],
    currentUser: null
  };
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Could not save to localStorage. Disk might be full or private browsing is enabled.", e);
  }
};

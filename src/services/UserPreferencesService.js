import * as SecureStore from 'expo-secure-store';

const PROFICIENCY_KEY = 'user_proficiency_level';
const FIRST_TIME_KEY = 'first_time_user';

export const PROFICIENCY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const PROFICIENCY_CONFIG = {
  [PROFICIENCY_LEVELS.BEGINNER]: {
    label: 'Beginner',
    description: 'New to music theory',
    sliderValue: 0,
    showAdvancedChords: false,
    showComplexAnalysis: false,
    showDetailedTiming: false,
    maxChordsDisplayed: 4,
    showBasicNotation: true,
    color: '#10B981' // lightGreen
  },
  [PROFICIENCY_LEVELS.INTERMEDIATE]: {
    label: 'Intermediate',
    description: 'Some music knowledge',
    sliderValue: 1,
    showAdvancedChords: true,
    showComplexAnalysis: true,
    showDetailedTiming: false,
    maxChordsDisplayed: 8,
    showBasicNotation: true,
    color: '#8B5CF6' // purple
  },
  [PROFICIENCY_LEVELS.ADVANCED]: {
    label: 'Advanced',
    description: 'Experienced musician',
    sliderValue: 2,
    showAdvancedChords: true,
    showComplexAnalysis: true,
    showDetailedTiming: true,
    maxChordsDisplayed: 12,
    showBasicNotation: false,
    color: '#EF4444' // red
  }
};

export class UserPreferencesService {
  // Save user proficiency level
  static async saveProficiencyLevel(level) {
    try {
      await SecureStore.setItemAsync(PROFICIENCY_KEY, level);
      console.log('Proficiency level saved:', level);
    } catch (error) {
      console.error('Error saving proficiency level:', error);
      // Fallback for development - use localStorage on web
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFICIENCY_KEY, level);
      }
    }
  }

  // Get user proficiency level
  static async getProficiencyLevel() {
    try {
      const level = await SecureStore.getItemAsync(PROFICIENCY_KEY);
      return level || null;
    } catch (error) {
      console.error('Error getting proficiency level:', error);
      // Fallback for development - use localStorage on web
      if (typeof window !== 'undefined') {
        return localStorage.getItem(PROFICIENCY_KEY) || null;
      }
      return null;
    }
  }

  // Check if user is first time user
  static async isFirstTimeUser() {
    try {
      const firstTime = await SecureStore.getItemAsync(FIRST_TIME_KEY);
      return firstTime === null; // If no value stored, it's first time
    } catch (error) {
      console.error('Error checking first time user:', error);
      // Fallback for development
      if (typeof window !== 'undefined') {
        return localStorage.getItem(FIRST_TIME_KEY) === null;
      }
      return true;
    }
  }

  // Mark user as not first time anymore
  static async setNotFirstTime() {
    try {
      await SecureStore.setItemAsync(FIRST_TIME_KEY, 'false');
    } catch (error) {
      console.error('Error setting first time flag:', error);
      // Fallback for development
      if (typeof window !== 'undefined') {
        localStorage.setItem(FIRST_TIME_KEY, 'false');
      }
    }
  }

  // Get proficiency configuration
  static getProficiencyConfig(level) {
    return PROFICIENCY_CONFIG[level] || PROFICIENCY_CONFIG[PROFICIENCY_LEVELS.BEGINNER];
  }

  // Get all proficiency levels for selection
  static getAllProficiencyLevels() {
    return Object.values(PROFICIENCY_LEVELS).map(level => ({
      value: level,
      ...PROFICIENCY_CONFIG[level]
    }));
  }

  // Reset all preferences (for testing)
  static async resetPreferences() {
    try {
      await SecureStore.deleteItemAsync(PROFICIENCY_KEY);
      await SecureStore.deleteItemAsync(FIRST_TIME_KEY);
      console.log('Preferences reset');
    } catch (error) {
      console.error('Error resetting preferences:', error);
      // Fallback for development
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PROFICIENCY_KEY);
        localStorage.removeItem(FIRST_TIME_KEY);
      }
    }
  }
}

// Default proficiency configuration - no user selection needed
// Using intermediate level as the optimal default experience

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
  // Get default proficiency configuration
  // Always returns intermediate level for best user experience
  static getDefaultProficiencyConfig() {
    return PROFICIENCY_CONFIG[PROFICIENCY_LEVELS.INTERMEDIATE];
  }

  // Simplified method that returns default config - keeps compatibility
  static getProficiencyConfig(level = null) {
    // Always return intermediate configuration regardless of level
    return PROFICIENCY_CONFIG[PROFICIENCY_LEVELS.INTERMEDIATE];
  }

  // Simplified method that returns default level - keeps compatibility  
  static async getProficiencyLevel() {
    // Always return intermediate as default
    return PROFICIENCY_LEVELS.INTERMEDIATE;
  }

  // Legacy methods kept for backwards compatibility but simplified
  static async saveProficiencyLevel(level) {
    // No-op - we no longer save user proficiency preferences
    console.log('Proficiency level selection disabled - using default intermediate level');
  }

  static async isFirstTimeUser() {
    // Always return false - no more first-time proficiency setup
    return false;
  }

  static async setNotFirstTime() {
    // No-op - first time user concept removed
  }

  // Get all proficiency levels for selection (legacy compatibility)
  static getAllProficiencyLevels() {
    return Object.values(PROFICIENCY_LEVELS).map(level => ({
      value: level,
      ...PROFICIENCY_CONFIG[level]
    }));
  }

  // Reset all preferences (for testing)
  static async resetPreferences() {
    console.log('No preferences to reset - using default configuration');
  }
}

import { Platform } from "react-native";

// Conditional imports for platform compatibility
let SecureStore;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
} else {
  // Web fallback for storage
  SecureStore = {
    getItemAsync: async (key) => localStorage.getItem(key),
    setItemAsync: async (key, value) => localStorage.setItem(key, value),
    deleteItemAsync: async (key) => localStorage.removeItem(key),
  };
}

const API_BASE_URL = "http://localhost:5001";
const RETRY_STORAGE_KEY = "identification_retry_sessions";
const MAX_RETRIES = 2; // Allow 2 retry attempts (3 total attempts)

/**
 * Service to handle song identification retries and failure logging
 */
export class IdentificationRetryService {
  /**
   * Generate a unique session ID for tracking identification attempts
   */
  static generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start a new identification session
   * @param {string} userId - User ID
   * @param {string} audioData - Audio data for identification
   * @param {boolean} isBase64 - Whether audio data is base64
   * @returns {string} Session ID
   */
  static async startIdentificationSession(userId, audioData, isBase64 = false) {
    const sessionId = this.generateSessionId();
    const sessionData = {
      sessionId,
      userId,
      audioData,
      isBase64,
      attempts: 0,
      maxRetries: MAX_RETRIES,
      startTime: new Date().toISOString(),
      results: []
    };

    try {
      // Store session data locally
      const existingSessions = await this.getStoredSessions();
      existingSessions[sessionId] = sessionData;
      await SecureStore.setItemAsync(RETRY_STORAGE_KEY, JSON.stringify(existingSessions));

      // Log session start to backend (for analytics)
      try {
        await fetch(`${API_BASE_URL}/identification/session/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId,
            timestamp: sessionData.startTime,
            audioDataLength: audioData.length,
            isBase64
          })
        });
      } catch (backendError) {
        console.log("Backend logging unavailable:", backendError.message);
      }

      return sessionId;
    } catch (error) {
      console.error("Failed to start identification session:", error);
      throw error;
    }
  }

  /**
   * Record an identification attempt
   * @param {string} sessionId - Session ID
   * @param {Array} results - Identification results
   * @param {boolean} isRetry - Whether this is a retry attempt
   * @returns {Object} Session data with attempt info
   */
  static async recordAttempt(sessionId, results = [], isRetry = false) {
    try {
      const sessions = await this.getStoredSessions();
      const session = sessions[sessionId];

      if (!session) {
        throw new Error("Session not found");
      }

      session.attempts += 1;
      session.lastAttemptTime = new Date().toISOString();
      
      const attemptData = {
        attemptNumber: session.attempts,
        timestamp: session.lastAttemptTime,
        resultsFound: results.length,
        isRetry,
        success: results.length > 0,
        results: results.map(r => ({
          id: r.id,
          name: r.name,
          artist: r.singerName,
          confidence: r.confidence
        }))
      };

      session.results.push(attemptData);

      // Update stored sessions
      await SecureStore.setItemAsync(RETRY_STORAGE_KEY, JSON.stringify(sessions));

      // Log to backend
      try {
        await fetch(`${API_BASE_URL}/identification/session/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            ...attemptData,
            userId: session.userId
          })
        });
      } catch (backendError) {
        console.log("Backend logging unavailable:", backendError.message);
      }

      return {
        ...session,
        canRetry: session.attempts <= session.maxRetries,
        remainingRetries: Math.max(0, session.maxRetries - session.attempts + 1),
        shouldShowGiveUp: session.attempts >= session.maxRetries
      };
    } catch (error) {
      console.error("Failed to record attempt:", error);
      throw error;
    }
  }

  /**
   * End an identification session
   * @param {string} sessionId - Session ID
   * @param {string} outcome - 'success', 'failed', or 'abandoned'
   * @param {Object} finalResult - Final result if successful
   */
  static async endSession(sessionId, outcome, finalResult = null) {
    try {
      const sessions = await this.getStoredSessions();
      const session = sessions[sessionId];

      if (!session) {
        return;
      }

      session.endTime = new Date().toISOString();
      session.outcome = outcome;
      session.finalResult = finalResult;
      session.duration = new Date(session.endTime) - new Date(session.startTime);

      // Update stored sessions
      await SecureStore.setItemAsync(RETRY_STORAGE_KEY, JSON.stringify(sessions));

      // Log final outcome to backend
      try {
        await fetch(`${API_BASE_URL}/identification/session/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId: session.userId,
            outcome,
            totalAttempts: session.attempts,
            duration: session.duration,
            finalResult: finalResult ? {
              id: finalResult.id,
              name: finalResult.name,
              artist: finalResult.singerName,
              confidence: finalResult.confidence
            } : null,
            timestamp: session.endTime
          })
        });
      } catch (backendError) {
        console.log("Backend logging unavailable:", backendError.message);
      }

      // Clean up old sessions (keep last 50)
      await this.cleanupOldSessions();
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   * @returns {Object} Session data
   */
  static async getSession(sessionId) {
    const sessions = await this.getStoredSessions();
    return sessions[sessionId] || null;
  }

  /**
   * Check if user can retry for a session
   * @param {string} sessionId - Session ID
   * @returns {Object} Retry status
   */
  static async canRetry(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return { canRetry: false, reason: "Session not found" };
    }

    const canRetry = session.attempts <= session.maxRetries;
    const remainingRetries = Math.max(0, session.maxRetries - session.attempts + 1);
    
    return {
      canRetry,
      remainingRetries,
      attemptsMade: session.attempts,
      maxRetries: session.maxRetries,
      shouldShowGiveUp: session.attempts >= session.maxRetries,
      reason: canRetry ? null : "Maximum retry attempts reached"
    };
  }

  /**
   * Get stored retry sessions
   */
  static async getStoredSessions() {
    try {
      const sessionsJson = await SecureStore.getItemAsync(RETRY_STORAGE_KEY);
      return sessionsJson ? JSON.parse(sessionsJson) : {};
    } catch (error) {
      console.error("Failed to get stored sessions:", error);
      return {};
    }
  }

  /**
   * Clean up old sessions to prevent storage bloat
   */
  static async cleanupOldSessions() {
    try {
      const sessions = await this.getStoredSessions();
      const sessionEntries = Object.entries(sessions);
      
      // Keep only the 50 most recent sessions
      if (sessionEntries.length > 50) {
        const sortedSessions = sessionEntries
          .sort(([, a], [, b]) => new Date(b.startTime) - new Date(a.startTime))
          .slice(0, 50);
        
        const cleanedSessions = Object.fromEntries(sortedSessions);
        await SecureStore.setItemAsync(RETRY_STORAGE_KEY, JSON.stringify(cleanedSessions));
      }
    } catch (error) {
      console.error("Failed to cleanup old sessions:", error);
    }
  }

  /**
   * Get retry statistics for analytics
   * @param {string} userId - User ID
   * @returns {Object} Retry statistics
   */
  static async getRetryStatistics(userId) {
    try {
      const sessions = await this.getStoredSessions();
      const userSessions = Object.values(sessions).filter(s => s.userId === userId);
      
      const stats = {
        totalSessions: userSessions.length,
        successfulSessions: userSessions.filter(s => s.outcome === 'success').length,
        failedSessions: userSessions.filter(s => s.outcome === 'failed').length,
        abandonedSessions: userSessions.filter(s => s.outcome === 'abandoned').length,
        averageAttempts: userSessions.reduce((sum, s) => sum + s.attempts, 0) / Math.max(1, userSessions.length),
        sessionsWithRetries: userSessions.filter(s => s.attempts > 1).length
      };
      
      return stats;
    } catch (error) {
      console.error("Failed to get retry statistics:", error);
      return {};
    }
  }
}

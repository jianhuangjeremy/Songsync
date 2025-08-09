import AsyncStorage from '@react-native-async-storage/async-storage';

export class FeedbackService {
  static RATINGS_KEY = 'song_ratings';
  
  /**
   * Save a user's rating for a song
   * @param {string} songId - Unique identifier for the song
   * @param {number} rating - Rating from 1-5 stars
   * @param {string} songTitle - Title of the song for reference
   * @param {object} additionalData - Optional additional feedback data
   */
  static async saveRating(songId, rating, songTitle, additionalData = {}) {
    try {
      const timestamp = new Date().toISOString();
      const ratingData = {
        songId,
        songTitle,
        rating,
        timestamp,
        ...additionalData
      };

      // Get existing ratings
      const existingRatings = await this.getAllRatings();
      
      // Update or add the rating for this song
      existingRatings[songId] = ratingData;
      
      // Save back to storage
      await AsyncStorage.setItem(this.RATINGS_KEY, JSON.stringify(existingRatings));
      
      // In a real app, you would also send this to your backend
      console.log('Rating saved locally:', ratingData);
      
      // TODO: Send to backend API
      // await this.sendRatingToBackend(ratingData);
      
      return true;
    } catch (error) {
      console.error('Failed to save rating:', error);
      return false;
    }
  }

  /**
   * Get all stored ratings
   */
  static async getAllRatings() {
    try {
      const ratingsJson = await AsyncStorage.getItem(this.RATINGS_KEY);
      return ratingsJson ? JSON.parse(ratingsJson) : {};
    } catch (error) {
      console.error('Failed to get ratings:', error);
      return {};
    }
  }

  /**
   * Get rating for a specific song
   * @param {string} songId - Unique identifier for the song
   */
  static async getRating(songId) {
    try {
      const ratings = await this.getAllRatings();
      return ratings[songId] || null;
    } catch (error) {
      console.error('Failed to get rating for song:', error);
      return null;
    }
  }

  /**
   * Get average rating across all songs
   */
  static async getAverageRating() {
    try {
      const ratings = await this.getAllRatings();
      const ratingValues = Object.values(ratings).map(r => r.rating);
      
      if (ratingValues.length === 0) return 0;
      
      const sum = ratingValues.reduce((acc, rating) => acc + rating, 0);
      return (sum / ratingValues.length).toFixed(1);
    } catch (error) {
      console.error('Failed to calculate average rating:', error);
      return 0;
    }
  }

  /**
   * Get rating statistics
   */
  static async getRatingStats() {
    try {
      const ratings = await this.getAllRatings();
      const ratingValues = Object.values(ratings).map(r => r.rating);
      
      const stats = {
        totalRatings: ratingValues.length,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      if (ratingValues.length > 0) {
        // Calculate average
        const sum = ratingValues.reduce((acc, rating) => acc + rating, 0);
        stats.averageRating = parseFloat((sum / ratingValues.length).toFixed(1));

        // Calculate distribution
        ratingValues.forEach(rating => {
          stats.distribution[rating]++;
        });
      }

      return stats;
    } catch (error) {
      console.error('Failed to get rating stats:', error);
      return {
        totalRatings: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }

  /**
   * Clear all ratings (for testing or reset purposes)
   */
  static async clearAllRatings() {
    try {
      await AsyncStorage.removeItem(this.RATINGS_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear ratings:', error);
      return false;
    }
  }

  /**
   * Send rating to backend (to be implemented)
   * @param {object} ratingData - The rating data to send
   */
  static async sendRatingToBackend(ratingData) {
    try {
      // TODO: Implement actual API call to your backend
      const response = await fetch('/api/feedback/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });

      if (!response.ok) {
        throw new Error('Failed to send rating to backend');
      }

      return await response.json();
    } catch (error) {
      console.error('Backend rating submission failed:', error);
      // Don't throw - we still want local storage to work
      return null;
    }
  }
}

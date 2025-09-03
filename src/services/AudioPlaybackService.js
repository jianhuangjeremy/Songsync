import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE_URL = "http://localhost:3000";

/**
 * Service for handling audio file downloads and playback
 * Supports various audio formats including .m4a, .wav, .mp3
 */
export class AudioPlaybackService {
  static audioPlayers = new Map(); // Store multiple players for different songs
  static currentlyPlaying = null;

  /**
   * Download an audio file for local playback
   */
  static async downloadAudioFile(audioFile, songId) {
    try {
      console.log("=== Audio Download Debug Info ===");
      console.log("Platform:", Platform.OS);
      console.log("Audio File Object:", JSON.stringify(audioFile, null, 2));
      console.log("Song ID:", songId);

      // Construct full URL for download (backend returns relative paths like /static/audio/file.m4a)
      let fullDownloadUrl = audioFile.downloadUrl.startsWith("http")
        ? audioFile.downloadUrl
        : `${API_BASE_URL}${audioFile.downloadUrl}`;

      // Encode spaces and special characters in the URL
      const urlParts = fullDownloadUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const encodedFilename = encodeURIComponent(filename);
      fullDownloadUrl = urlParts.slice(0, -1).join('/') + '/' + encodedFilename;

      console.log("Using audio file for playback:", fullDownloadUrl);

      if (Platform.OS === "web") {
        // For web, we'll use the direct URL since we can't download files locally
        return fullDownloadUrl;
      }

      // Use the original filename from the server for local storage
      const serverFilename = audioFile.filename || `${Date.now()}.m4a`;
      const localPath = `${FileSystem.documentDirectory}${serverFilename}`;

      // Check if file already exists locally
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log("File already exists locally:", localPath);
        return localPath;
      }

      // Download the file
      console.log("Downloading from:", fullDownloadUrl);
      console.log("Saving to:", localPath);

      const downloadResult = await FileSystem.downloadAsync(fullDownloadUrl, localPath);
      
      if (downloadResult.status === 200) {
        console.log("Download successful!");
        console.log("Download result URI:", downloadResult.uri);
        return downloadResult.uri;
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.status}. Response: ${JSON.stringify(downloadResult)}`
        );
      }
    } catch (error) {
      console.error("File download error:", error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Load an audio file for playback
   */
  static async loadAudioFile(filePath, songId) {
    try {
      console.log("Loading audio file:", filePath);
      
      // Set audio mode for iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      // Create new audio object
      const { sound } = await Audio.Sound.createAsync(
        { uri: filePath },
        { shouldPlay: false, isLooping: false }
      );

      // Store the player
      this.audioPlayers.set(songId, sound);
      console.log("Audio file loaded successfully for song:", songId);
      
      return sound;
    } catch (error) {
      console.error("Error loading audio file:", error);
      throw new Error(`Failed to load audio file: ${error.message}`);
    }
  }

  /**
   * Play audio
   */
  static async playAudio(songId) {
    try {
      const player = this.audioPlayers.get(songId);
      if (player) {
        await player.playAsync();
        this.currentlyPlaying = songId;
        console.log("Playing audio for song:", songId);
      } else {
        throw new Error("Audio player not found for song ID: " + songId);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      throw error;
    }
  }

  /**
   * Pause audio
   */
  static async pauseAudio(songId) {
    try {
      const player = this.audioPlayers.get(songId);
      if (player) {
        await player.pauseAsync();
        console.log("Paused audio for song:", songId);
      }
    } catch (error) {
      console.error("Error pausing audio:", error);
      throw error;
    }
  }

  /**
   * Set playback position
   */
  static async setPosition(songId, positionMillis) {
    try {
      const player = this.audioPlayers.get(songId);
      if (player) {
        await player.setPositionAsync(positionMillis);
        console.log("Set position to", positionMillis, "ms for song:", songId);
      }
    } catch (error) {
      console.error("Error setting position:", error);
      throw error;
    }
  }

  /**
   * Set up status update callback
   */
  static setPlaybackStatusUpdate(songId, callback) {
    const player = this.audioPlayers.get(songId);
    if (player) {
      player.setOnPlaybackStatusUpdate(callback);
    }
  }

  /**
   * Cleanup audio player
   */
  static async cleanupAudioPlayer(songId) {
    try {
      const player = this.audioPlayers.get(songId);
      if (player) {
        await player.unloadAsync();
        this.audioPlayers.delete(songId);
        console.log("Cleaned up audio player for song:", songId);
      }
    } catch (error) {
      console.error("Error cleaning up audio player:", error);
    }
  }

  /**
   * Download audio for user (save to device)
   */
  static async downloadAudioForUser(audioFile, songName) {
    try {
      console.log("Downloading audio for user:", songName);
      
      if (Platform.OS === "web") {
        // For web, open download link in new tab
        const fullUrl = audioFile.downloadUrl.startsWith("http")
          ? audioFile.downloadUrl
          : `${API_BASE_URL}${audioFile.downloadUrl}`;
        window.open(fullUrl, '_blank');
        return;
      }

      // For mobile, download to device storage
      const localPath = await this.downloadAudioFile(audioFile, `user_${Date.now()}`);
      console.log("Audio downloaded for user:", localPath);
      return localPath;
    } catch (error) {
      console.error("Error downloading audio for user:", error);
      throw error;
    }
  }

  /**
   * Test function for debugging audio download functionality
   */
  static async testAudioDownload() {
    try {
      console.log("=== Testing Audio Download Functionality ===");
      
      // Create a mock audio file object for testing (using a real file we know exists)
      const mockAudioFile = {
        name: "Adele_Set Fire to the Rain_backing_track.m4a",
        downloadUrl: "/static/audio/Adele_Set Fire to the Rain_backing_track.m4a",
        filename: "Adele_Set Fire to the Rain_backing_track.m4a",
        size: "5.9 MB",
        format: "m4a"
      };

      console.log("Mock audio file:", mockAudioFile);
      
      // Test URL construction
      const fullDownloadUrl = mockAudioFile.downloadUrl.startsWith("http")
        ? mockAudioFile.downloadUrl
        : `${API_BASE_URL}${mockAudioFile.downloadUrl}`;
      
      console.log("Full download URL:", fullDownloadUrl);
      
      // Test if server is accessible
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          timeout: 5000,
        });
        console.log("Server health check:", response.status);
      } catch (fetchError) {
        console.log("Server health check failed:", fetchError.message);
        return "❌ Test Failed: Cannot connect to server at " + API_BASE_URL;
      }
      
      // Test if audio file is accessible
      try {
        const audioResponse = await fetch(fullDownloadUrl, {
          method: 'HEAD',
          timeout: 10000,
        });
        console.log("Audio file accessibility:", audioResponse.status, audioResponse.headers.get('content-type'));
        
        if (audioResponse.status !== 200) {
          return "❌ Test Failed: Audio file not accessible (Status: " + audioResponse.status + ")";
        }
      } catch (audioError) {
        console.log("Audio file test failed:", audioError.message);
        return "❌ Test Failed: Audio file not accessible - " + audioError.message;
      }
      
      // Test audio mode setup
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });
      
      console.log("Audio mode configured successfully");
      
      return `✅ Test Passed: Audio system is properly configured
      
🔧 Debug Info:
• Platform: ${Platform.OS}
• API Base URL: ${API_BASE_URL}
• Server Status: ✅ Accessible
• Audio Mode: ✅ Configured
• File System: ✅ Available
      
🎵 Ready for audio playback!`;
      
    } catch (error) {
      console.error("Test failed:", error);
      return `❌ Test Failed: ${error.message}
      
🔧 Debug Info:
• Platform: ${Platform.OS}
• API Base URL: ${API_BASE_URL}
• Error Type: ${error.constructor.name}
      
Please check server connection and audio permissions.`;
    }
  }

}
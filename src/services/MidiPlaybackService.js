import { Platform, Alert } from "react-native";
import { SubscriptionService } from "./SubscriptionService";

// Conditional imports for platform compatibility
let FileSystem, Audio;
if (Platform.OS !== "web") {
  FileSystem = require("expo-file-system");
  Audio = require("expo-av").Audio;
}

// API Configuration
const API_BASE_URL = "http://localhost:5001";

/**
 * Service for handling audio downloads and playback
 */
export class MidiPlaybackService {
  static midiPlayers = new Map(); // Store multiple players for different songs
  static currentlyPlaying = null;

  /**
   * Download and prepare file for playback (prioritize audio over MIDI)
   * @param {object} midiFile - Audio object with downloadUrl, filename, etc.
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<string>} Local file path or URL
   */
  static async downloadMidiFile(midiFile, songId) {
    try {
      console.log("=== MIDI/Audio Download Debug Info ===");
      console.log("Platform:", Platform.OS);
      console.log("Audio Object:", JSON.stringify(midiFile, null, 2));
      console.log("Song ID:", songId);

      // Check if user can download audio
      const midiStatus = await SubscriptionService.canDownloadMidi();
      console.log("MIDI Download Status:", midiStatus);
      if (!midiStatus.canDownload) {
        throw new Error("Premium subscription required for MIDI downloads");
      }

      // Prioritize audio file if available (now that backend returns audioFile directly)
      const useAudioFile = midiFile.format || midiFile.downloadUrl; // If it has format or downloadUrl, it's an audio file
      const fileToDownload = midiFile; // Backend now returns audioFile directly instead of nested structure
      const fileType = useAudioFile ? "audio" : "MIDI";

      // Construct full URL for download (backend returns relative paths like /static/audio/file.m4a)
      const fullDownloadUrl = fileToDownload.downloadUrl.startsWith("http")
        ? fileToDownload.downloadUrl
        : `${API_BASE_URL}${fileToDownload.downloadUrl}`;

      console.log(`Using ${fileType} file for playback:`, fullDownloadUrl);

      if (Platform.OS === "web") {
        // For web, we'll use the direct URL since we can't download files locally
        return fullDownloadUrl;
      }

      // Use the original filename from the server for local storage
      const serverFilename = fileToDownload.filename || `${Date.now()}.m4a`;

      const localPath = `${FileSystem.documentDirectory}${serverFilename}`;

      // Check if file already exists locally
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log(`${fileType} file already exists locally:`, localPath);
        return localPath;
      }

      console.log(
        `Downloading ${fileType} file from:`,
        fileToDownload.downloadUrl
      );
      console.log("Saving to:", localPath);

      // Test if URL is accessible first
      try {
        const testResponse = await fetch(fullDownloadUrl, {
          method: "HEAD",
        });
        console.log("URL test response status:", testResponse.status);
        console.log("URL test response headers:", testResponse.headers);
      } catch (testError) {
        console.error("URL test failed:", testError);
        throw new Error(
          `${fileType} URL is not accessible: ${testError.message}`
        );
      }

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        fullDownloadUrl,
        localPath
      );

      console.log("Download result:", downloadResult);

      if (downloadResult.status === 200) {
        console.log(`${fileType} file downloaded successfully`);
        console.log("Download result URI:", downloadResult.uri);
        return downloadResult.uri;
      } else {
        throw new Error(
          `Download failed with status: ${
            downloadResult.status
          }. Response: ${JSON.stringify(downloadResult)}`
        );
      }
    } catch (error) {
      console.error("File download error:", error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Test MIDI download functionality
   * @param {string} testUrl - URL to test download from
   * @returns {Promise<string>} Result message
   */
  static async testMidiDownload(
    testUrl = "https://www.soundjay.com/misc/beep-28.wav"
  ) {
    try {
      console.log("=== Testing MIDI Download ===");
      console.log("Platform:", Platform.OS);
      console.log("Test URL:", testUrl);

      if (Platform.OS === "web") {
        console.log("Web platform - testing URL accessibility");
        const response = await fetch(testUrl, { method: "HEAD" });
        console.log("Response status:", response.status);
        return `Web test successful - Status: ${response.status}`;
      }

      const localPath = `${FileSystem.documentDirectory}test_download.wav`;
      console.log("Local path:", localPath);

      // Test download
      const downloadResult = await FileSystem.downloadAsync(testUrl, localPath);
      console.log("Download result:", downloadResult);

      if (downloadResult.status === 200) {
        return `Download successful - File saved to: ${downloadResult.uri}`;
      } else {
        return `Download failed - Status: ${downloadResult.status}`;
      }
    } catch (error) {
      console.error("Test download error:", error);
      return `Test failed: ${error.message}`;
    }
  }

  /**
   * Load and prepare file for playback
   * Automatically detects and handles both audio files (.wav) and audio (.mid)
   * @param {string} filePath - Local file path or URL
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<object>} Audio sound object
   */
  static async loadMidiFile(filePath, songId) {
    try {
      // Detect file type
      const isAudioFile =
        filePath.includes(".wav") ||
        filePath.includes(".mp3") ||
        filePath.includes(".m4a");
      const fileType = isAudioFile ? "audio" : "MIDI";

      console.log(`Loading ${fileType} file:`, filePath);

      if (isAudioFile) {
        console.log("🎵 Loading YouTube audio backing track - M4A format!");

        if (Platform.OS === "web") {
          // For web, create a real audio element for audio files
          const audio = new window.Audio(filePath);
          audio.preload = "auto";

          return new Promise((resolve, reject) => {
            audio.addEventListener("canplaythrough", () => {
              const soundObject = {
                playAsync: async () => {
                  audio.currentTime = 0;
                  await audio.play();
                },
                pauseAsync: async () => {
                  audio.pause();
                },
                stopAsync: async () => {
                  audio.pause();
                  audio.currentTime = 0;
                },
                unloadAsync: async () => {
                  audio.pause();
                  audio.src = "";
                },
                getStatusAsync: async () => ({
                  isLoaded: true,
                  isPlaying: !audio.paused && !audio.ended,
                  positionMillis: audio.currentTime * 1000,
                  durationMillis: audio.duration * 1000 || 0,
                }),
                setOnPlaybackStatusUpdate: (callback) => {
                  audio.addEventListener("timeupdate", () => {
                    callback({
                      isLoaded: true,
                      isPlaying: !audio.paused && !audio.ended,
                      positionMillis: audio.currentTime * 1000,
                      durationMillis: audio.duration * 1000 || 0,
                    });
                  });
                },
                _audio: audio, // Store reference for cleanup
              };

              this.midiPlayers.set(songId, soundObject);
              resolve(soundObject);
            });

            audio.addEventListener("error", (e) => {
              reject(new Error(`Failed to load audio: ${e.message}`));
            });

            // Trigger loading
            audio.load();
          });
        }

        // For native platforms, use Expo Audio for real audio files
        console.log("🎵 Creating audio sound object for:", filePath);

        if (!Audio) {
          throw new Error("Expo Audio not available - check import");
        }

        try {
          // Configure audio mode for playback - simplified configuration
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: filePath },
            { shouldPlay: false, volume: 1.0 }
          );

          this.midiPlayers.set(songId, sound);
          console.log("🎵 Real audio file loaded successfully!");
          return sound;
        } catch (audioError) {
          console.error("❌ Failed to create audio sound:", audioError);
          throw new Error(`Audio loading failed: ${audioError.message}`);
        }
      } else {
        // Audio - use mock player for visual timing
        console.log(
          "⚠️ Audio detected - providing visual timing guide only (no synthesized sound)."
        );

        if (Platform.OS === "web") {
          // Create a mock audio player for MIDI timing simulation
          const mockPlayer = {
            _startTime: null,
            _duration: 30000, // Default 30 seconds for MIDI
            _isPlaying: false,
            _currentTime: 0,
            _interval: null,

            playAsync: async function () {
              this._isPlaying = true;
              this._startTime = Date.now() - this._currentTime;

              // Simulate playback progress
              this._interval = setInterval(() => {
                if (this._isPlaying) {
                  this._currentTime = Date.now() - this._startTime;
                  if (this._currentTime >= this._duration) {
                    this.pauseAsync();
                  }
                }
              }, 100);

              console.log("🎵 MIDI visual timing started (no sound synthesis)");
            },

            pauseAsync: async function () {
              this._isPlaying = false;
              if (this._interval) {
                clearInterval(this._interval);
                this._interval = null;
              }
              console.log("⏸️ MIDI timing paused");
            },

            stopAsync: async function () {
              this._isPlaying = false;
              this._currentTime = 0;
              if (this._interval) {
                clearInterval(this._interval);
                this._interval = null;
              }
              console.log("⏹️ MIDI timing stopped");
            },

            unloadAsync: async function () {
              this.stopAsync();
              console.log("🗑️ MIDI player unloaded");
            },

            getStatusAsync: async function () {
              return {
                isLoaded: true,
                isPlaying: this._isPlaying,
                positionMillis: this._currentTime,
                durationMillis: this._duration,
              };
            },

            setOnPlaybackStatusUpdate: function (callback) {
              // Trigger status updates during playback
              const statusInterval = setInterval(() => {
                if (this._isPlaying || !this._interval) {
                  callback({
                    isLoaded: true,
                    isPlaying: this._isPlaying,
                    positionMillis: this._currentTime,
                    durationMillis: this._duration,
                  });
                }
              }, 200);

              // Store for cleanup
              this._statusInterval = statusInterval;
            },
          };

          this.midiPlayers.set(songId, mockPlayer);
          return mockPlayer;
        }

        // For native platforms, create a similar mock player for MIDI
        const mockNativePlayer = {
          _startTime: null,
          _duration: 30000, // Default 30 seconds
          _isPlaying: false,
          _currentTime: 0,
          _interval: null,

          playAsync: async () => {
            mockNativePlayer._isPlaying = true;
            mockNativePlayer._startTime =
              Date.now() - mockNativePlayer._currentTime;

            mockNativePlayer._interval = setInterval(() => {
              if (mockNativePlayer._isPlaying) {
                mockNativePlayer._currentTime =
                  Date.now() - mockNativePlayer._startTime;
                if (
                  mockNativePlayer._currentTime >= mockNativePlayer._duration
                ) {
                  mockNativePlayer.pauseAsync();
                }
              }
            }, 100);

            console.log("🎵 MIDI visual timing started (no sound synthesis)");
          },

          pauseAsync: async () => {
            mockNativePlayer._isPlaying = false;
            if (mockNativePlayer._interval) {
              clearInterval(mockNativePlayer._interval);
              mockNativePlayer._interval = null;
            }
            console.log("⏸️ MIDI timing paused");
          },

          stopAsync: async () => {
            mockNativePlayer._isPlaying = false;
            mockNativePlayer._currentTime = 0;
            if (mockNativePlayer._interval) {
              clearInterval(mockNativePlayer._interval);
              mockNativePlayer._interval = null;
            }
            console.log("⏹️ MIDI timing stopped");
          },

          unloadAsync: async () => {
            await mockNativePlayer.stopAsync();
            console.log("🗑️ MIDI player unloaded");
          },

          getStatusAsync: async () => ({
            isLoaded: true,
            isPlaying: mockNativePlayer._isPlaying,
            positionMillis: mockNativePlayer._currentTime,
            durationMillis: mockNativePlayer._duration,
          }),

          setOnPlaybackStatusUpdate: (callback) => {
            const statusInterval = setInterval(async () => {
              const status = await mockNativePlayer.getStatusAsync();
              callback(status);
            }, 200);

            mockNativePlayer._statusInterval = statusInterval;
          },
        };

        this.midiPlayers.set(songId, mockNativePlayer);
        return mockNativePlayer;
      }
    } catch (error) {
      console.error("File load error:", error);
      throw new Error(`Failed to load file: ${error.message}`);
    }
  }

  /**
   * Play audio
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<void>}
   */
  static async playMidi(songId) {
    try {
      const player = this.midiPlayers.get(songId);
      if (!player) {
        throw new Error("Audio file not loaded. Call loadMidiFile first.");
      }

      console.log("🎵 Starting playback for song:", songId);
      console.log("🎵 Player type:", typeof player);
      console.log("🎵 Player methods:", Object.keys(player));

      // Stop any currently playing MIDI
      if (this.currentlyPlaying && this.currentlyPlaying !== songId) {
        await this.pauseMidi(this.currentlyPlaying);
      }

      await player.playAsync();
      this.currentlyPlaying = songId;
      console.log("🎵 Audio playback started successfully for song:", songId);
    } catch (error) {
      console.error("❌ Audio play error:", error);
      throw new Error(`Failed to play audio: ${error.message}`);
    }
  }

  /**
   * Pause audio
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<void>}
   */
  static async pauseMidi(songId) {
    try {
      const player = this.midiPlayers.get(songId);
      if (!player) return;

      await player.pauseAsync();
      if (this.currentlyPlaying === songId) {
        this.currentlyPlaying = null;
      }
      console.log("MIDI playback paused for song:", songId);
    } catch (error) {
      console.error("MIDI pause error:", error);
      throw new Error(`Failed to pause MIDI: ${error.message}`);
    }
  }

  /**
   * Stop audio
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<void>}
   */
  static async stopMidi(songId) {
    try {
      const player = this.midiPlayers.get(songId);
      if (!player) return;

      await player.stopAsync();
      if (this.currentlyPlaying === songId) {
        this.currentlyPlaying = null;
      }
      console.log("MIDI playback stopped for song:", songId);
    } catch (error) {
      console.error("MIDI stop error:", error);
      throw new Error(`Failed to stop MIDI: ${error.message}`);
    }
  }

  /**
   * Get current playback status
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<object>} Playback status
   */
  static async getPlaybackStatus(songId) {
    try {
      const player = this.midiPlayers.get(songId);
      if (!player) {
        return {
          isLoaded: false,
          isPlaying: false,
          positionMillis: 0,
          durationMillis: 0,
        };
      }

      return await player.getStatusAsync();
    } catch (error) {
      console.error("Get playback status error:", error);
      return {
        isLoaded: false,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 0,
      };
    }
  }

  /**
   * Set playback position
   * @param {string} songId - Unique identifier for the song
   * @param {number} positionMillis - Position in milliseconds
   * @returns {Promise<void>}
   */
  static async setPosition(songId, positionMillis) {
    try {
      const player = this.midiPlayers.get(songId);
      if (!player) return;

      if (Platform.OS === "web" && player._audio) {
        player._audio.currentTime = positionMillis / 1000;
      } else {
        await player.setPositionAsync(positionMillis);
      }
    } catch (error) {
      console.error("Set position error:", error);
    }
  }

  /**
   * Set playback status update callback
   * @param {string} songId - Unique identifier for the song
   * @param {function} callback - Callback function to receive status updates
   */
  static setPlaybackStatusUpdate(songId, callback) {
    const player = this.midiPlayers.get(songId);
    if (!player) return;

    if (Platform.OS === "web" && player._audio) {
      // For web, manually trigger status updates
      const interval = setInterval(async () => {
        const status = await this.getPlaybackStatus(songId);
        callback(status);

        // Clear interval if playback finished or player unloaded
        if (!status.isPlaying || !status.isLoaded) {
          clearInterval(interval);
        }
      }, 100);
    } else {
      player.setOnPlaybackStatusUpdate(callback);
    }
  }

  /**
   * Cleanup MIDI player for a song
   * @param {string} songId - Unique identifier for the song
   * @returns {Promise<void>}
   */
  static async cleanupMidiPlayer(songId) {
    try {
      const player = this.midiPlayers.get(songId);
      if (!player) return;

      if (Platform.OS === "web" && player._audio) {
        player._audio.pause();
        player._audio.src = "";
      } else {
        await player.unloadAsync();
      }

      this.midiPlayers.delete(songId);

      if (this.currentlyPlaying === songId) {
        this.currentlyPlaying = null;
      }

      console.log("MIDI player cleaned up for song:", songId);
    } catch (error) {
      console.error("Cleanup MIDI player error:", error);
    }
  }

  /**
   * Cleanup all MIDI players
   * @returns {Promise<void>}
   */
  static async cleanupAllPlayers() {
    try {
      const promises = Array.from(this.midiPlayers.keys()).map((songId) =>
        this.cleanupMidiPlayer(songId)
      );
      await Promise.all(promises);
      this.currentlyPlaying = null;
      console.log("All MIDI players cleaned up");
    } catch (error) {
      console.error("Cleanup all players error:", error);
    }
  }

  /**
   * Check if MIDI is currently playing for a song
   * @param {string} songId - Unique identifier for the song
   * @returns {boolean}
   */
  static isPlaying(songId) {
    return this.currentlyPlaying === songId;
  }

  /**
   * Get formatted file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size string
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  /**
   * Download audio to device (for user download)
   * @param {object} midiFile - Audio object
   * @param {string} songTitle - Song title for filename
   * @returns {Promise<void>}
   */
  static async downloadMidiForUser(midiFile, songTitle) {
    try {
      // Check subscription status
      const midiStatus = await SubscriptionService.canDownloadMidi();
      if (!midiStatus.canDownload) {
        Alert.alert(
          "Premium Required",
          "MIDI downloads are available with Premium subscription. Upgrade now to download backing tracks.",
          [{ text: "OK" }]
        );
        return;
      }

      if (Platform.OS === "web") {
        // For web, create a download link
        const link = document.createElement("a");
        link.href = midiFile.downloadUrl;
        link.download = `${songTitle.replace(
          /[^a-z0-9]/gi,
          "_"
        )}_backing_track.mid`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Alert.alert("Download Started", "Audio download has started.");
        return;
      }

      // For mobile, save to Downloads folder or show sharing dialog
      const fileName = `${songTitle.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_backing_track.mid`;
      const localPath = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(
        midiFile.downloadUrl,
        localPath
      );

      if (downloadResult.status === 200) {
        Alert.alert("Download Complete", `Audio saved to: ${fileName}`, [
          { text: "OK" },
        ]);
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.status}`
        );
      }
    } catch (error) {
      console.error("User MIDI download error:", error);
      Alert.alert(
        "Download Failed",
        "Failed to download audio. Please try again."
      );
    }
  }
}

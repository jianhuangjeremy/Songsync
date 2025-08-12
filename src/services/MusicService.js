import { Platform } from "react-native";

// Conditional imports for platform compatibility
let FileSystem, SecureStore;
if (Platform.OS !== "web") {
  FileSystem = require("expo-file-system");
  SecureStore = require("expo-secure-store");
} else {
  // Web fallback for storage
  SecureStore = {
    getItemAsync: async (key) => localStorage.getItem(key),
    setItemAsync: async (key, value) => localStorage.setItem(key, value),
    deleteItemAsync: async (key) => localStorage.removeItem(key),
  };
}

const API_BASE_URL = "http://localhost:8080";

// Mock song database with complete analysis data (your backend will return this format)
const MOCK_SONGS = [
  {
    id: "1",
    name: "Happy",
    album: "Girl",
    singerName: "Pharrell Williams",
    duration: "03:53",
    genre: "Pop",
    year: "2013",
    confidence: 0.95,
    chords: ["F", "C", "G", "Am"],
    hasMidi: true,
    albumCover:
      "https://upload.wikimedia.org/wikipedia/en/6/6f/Pharrell_Williams_-_G_I_R_L.png",
    previewUrl: "https://www.soundjay.com/misc/sounds/bells-2.mp3",
    // Complete analysis data that your backend will return
    analysisData: {
      midiFile: {
        id: "1",
        name: "Happy - Full Track",
        size: "45 KB",
        downloadUrl: "https://example.com/midi/full-track.mid",
      },
      bars: [
        {
          id: 0,
          startTime: 0,
          endTime: 8,
          chord: "C",
          lyrics: "It might seem crazy what I'm about to say",
          section: "Verse 1",
        },
        {
          id: 1,
          startTime: 8,
          endTime: 16,
          chord: "Am",
          lyrics: "Sunshine she's here, you can take a break",
          section: "Verse 1",
        },
        {
          id: 2,
          startTime: 16,
          endTime: 24,
          chord: "F",
          lyrics: "I'm a hot air balloon that could go to space",
          section: "Verse 1",
        },
        {
          id: 3,
          startTime: 24,
          endTime: 32,
          chord: "G",
          lyrics: "With the air, like I don't care baby by the way",
          section: "Verse 1",
        },
        {
          id: 4,
          startTime: 32,
          endTime: 40,
          chord: "C",
          lyrics: "Because I'm happy",
          section: "Chorus",
        },
        {
          id: 5,
          startTime: 40,
          endTime: 48,
          chord: "Am",
          lyrics: "Clap along if you feel like a room without a roof",
          section: "Chorus",
        },
        {
          id: 6,
          startTime: 48,
          endTime: 56,
          chord: "F",
          lyrics: "Because I'm happy",
          section: "Chorus",
        },
        {
          id: 7,
          startTime: 56,
          endTime: 64,
          chord: "G",
          lyrics: "Clap along if you feel like happiness is the truth",
          section: "Chorus",
        },
      ],
      sections: [
        "Intro",
        "Verse 1",
        "Chorus",
        "Verse 2",
        "Chorus",
        "Bridge",
        "Chorus",
        "Outro",
      ],
    },
  },
  {
    id: "2",
    name: "Bohemian Rhapsody",
    album: "A Night at the Opera",
    singerName: "Queen",
    duration: "05:55",
    genre: "Rock",
    year: "1975",
    confidence: 0.92,
    chords: ["Bb", "Eb", "F", "Cm"],
    hasMidi: true,
    albumCover:
      "https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png",
    previewUrl: "https://www.soundjay.com/misc/sounds/bells-1.mp3",
    analysisData: {
      midiFile: {
        id: "2",
        name: "Bohemian Rhapsody - Full Track",
        size: "78 KB",
        downloadUrl: "https://example.com/midi/bohemian-rhapsody.mid",
      },
      bars: [
        {
          id: 0,
          startTime: 0,
          endTime: 12,
          chord: "Bb",
          lyrics: "Is this the real life? Is this just fantasy?",
          section: "Ballad",
        },
        {
          id: 1,
          startTime: 12,
          endTime: 24,
          chord: "Eb",
          lyrics: "Caught in a landslide, no escape from reality",
          section: "Ballad",
        },
      ],
      sections: ["Intro", "Ballad", "Opera", "Hard Rock", "Outro"],
    },
  },
  {
    id: "3",
    name: "Shape of You",
    album: "÷ (Divide)",
    singerName: "Ed Sheeran",
    duration: "03:53",
    genre: "Pop",
    year: "2017",
    confidence: 0.88,
    chords: ["C#m", "F#m", "A", "B"],
    hasMidi: true,
    albumCover:
      "https://upload.wikimedia.org/wikipedia/en/4/45/Divide_cover.png",
    previewUrl: "https://www.soundjay.com/misc/sounds/bells-3.mp3",
    analysisData: {
      midiFile: {
        id: "3",
        name: "Shape of You - Full Track",
        size: "52 KB",
        downloadUrl: "https://example.com/midi/shape-of-you.mid",
      },
      bars: [
        {
          id: 0,
          startTime: 0,
          endTime: 8,
          chord: "C#m",
          lyrics: "The club isn't the best place to find a lover",
          section: "Verse 1",
        },
      ],
      sections: [
        "Verse 1",
        "Pre-Chorus",
        "Chorus",
        "Verse 2",
        "Chorus",
        "Bridge",
        "Chorus",
      ],
    },
  },
];

/**
 * Identifies a song from audio and returns complete analysis data
 * This is the main function that your backend should implement
 * @param {string} audioUri - URI of the audio file to identify
 * @returns {Promise<Array>} Array of song objects with complete analysis data
 */
export const identifySong = async (audioUri) => {
  try {
    // For web or when FileSystem is not available, skip file check
    if (Platform.OS !== "web" && FileSystem) {
      const audioInfo = await FileSystem.getInfoAsync(audioUri);

      if (!audioInfo.exists) {
        throw new Error("Audio file not found");
      }
    }

    // Your backend endpoint - this should return complete song + analysis data
    try {
      const response = await fetch(`${API_BASE_URL}/identify-and-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any required headers for your service
        },
        body: JSON.stringify({
          audioFile: audioUri,
          timestamp: Date.now(),
          // Add other required fields for your backend
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Your backend should return an array of song objects with this structure:
        // {
        //   id: string,
        //   name: string,
        //   singerName: string,
        //   album: string,
        //   duration: string,
        //   genre: string,
        //   year: string,
        //   confidence: number (0-1),
        //   chords: array,
        //   hasMidi: boolean,
        //   albumCover: string (URL),
        //   previewUrl: string (URL),
        //   analysisData: {
        //     midiFile: { id, name, size, downloadUrl },
        //     bars: [{ id, startTime, endTime, chord, lyrics, section }],
        //     sections: [string array]
        //   }
        // }

        return Array.isArray(result) ? result : [result];
      } else {
        throw new Error("API call failed");
      }
    } catch (apiError) {
      console.log("API unavailable, using mock data:", apiError.message);

      // Simulate different scenarios for demo
      const randomChance = Math.random();

      // 20% chance of no results found
      if (randomChance < 0.2) {
        return [];
      }

      // 80% chance of returning mock results
      const randomResults = MOCK_SONGS.sort(() => Math.random() - 0.5).slice(
        0,
        Math.floor(Math.random() * 2) + 1
      );

      return randomResults;
    }
  } catch (error) {
    console.error("Song identification error:", error);
    throw new Error("Failed to identify song. Please try again.");
  }
};

export const saveSongToLibrary = async (song, userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson
      ? JSON.parse(existingLibraryJson)
      : [];

    // Check if song already exists in library
    const existingSong = existingLibrary.find((item) => item.id === song.id);
    if (existingSong) {
      throw new Error("Song already exists in your library");
    }

    // Add timestamp and save
    const songWithTimestamp = {
      ...song,
      addedAt: new Date().toISOString(),
      playCount: 0,
    };

    const updatedLibrary = [songWithTimestamp, ...existingLibrary];
    await SecureStore.setItemAsync(libraryKey, JSON.stringify(updatedLibrary));

    return songWithTimestamp;
  } catch (error) {
    console.error("Save song error:", error);
    throw error;
  }
};

export const getLibrary = async (userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const libraryJson = await SecureStore.getItemAsync(libraryKey);
    const library = libraryJson ? JSON.parse(libraryJson) : [];

    // Migrate existing songs to ensure they have analysisData
    const migratedLibrary = library.map((song) => {
      if (!song.analysisData) {
        // Find matching mock song for analysis data
        const mockSong = MOCK_SONGS.find(
          (mock) => mock.id === song.id || mock.name === song.name
        );

        if (mockSong) {
          return {
            ...song,
            analysisData: mockSong.analysisData, // Add analysisData from mock
          };
        } else {
          // Generate fallback analysisData for unknown songs
          return {
            ...song,
            analysisData: {
              midiFile: {
                id: song.id || "1",
                name: `${song.name} - Full Track`,
                size: "45 KB",
                downloadUrl: "https://example.com/midi/fallback.mid",
              },
              bars: [
                {
                  id: 0,
                  startTime: 0,
                  endTime: 8,
                  chord: song.chords?.[0] || "C",
                  lyrics: `Sample lyrics for ${song.name}...`,
                  section: "Verse 1",
                },
                {
                  id: 1,
                  startTime: 8,
                  endTime: 16,
                  chord: song.chords?.[1] || "Am",
                  lyrics: "More sample lyrics...",
                  section: "Verse 1",
                },
                {
                  id: 2,
                  startTime: 16,
                  endTime: 24,
                  chord: song.chords?.[2] || "F",
                  lyrics: "Chorus section begins...",
                  section: "Chorus",
                },
                {
                  id: 3,
                  startTime: 24,
                  endTime: 32,
                  chord: song.chords?.[3] || "G",
                  lyrics: "Main hook of the song...",
                  section: "Chorus",
                },
              ],
              sections: [
                "Intro",
                "Verse 1",
                "Chorus",
                "Verse 2",
                "Chorus",
                "Bridge",
                "Outro",
              ],
            },
          };
        }
      }
      return song; // Song already has analysisData
    });

    // Save migrated library if changes were made
    if (
      migratedLibrary.length > 0 &&
      JSON.stringify(migratedLibrary) !== JSON.stringify(library)
    ) {
      await SecureStore.setItemAsync(
        libraryKey,
        JSON.stringify(migratedLibrary)
      );
    }

    return migratedLibrary;
  } catch (error) {
    console.error("Get library error:", error);
    return [];
  }
};

export const removeSongFromLibrary = async (songId, userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson
      ? JSON.parse(existingLibraryJson)
      : [];

    const updatedLibrary = existingLibrary.filter((song) => song.id !== songId);
    await SecureStore.setItemAsync(libraryKey, JSON.stringify(updatedLibrary));

    return updatedLibrary;
  } catch (error) {
    console.error("Remove song error:", error);
    throw error;
  }
};

export const updatePlayCount = async (songId, userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson
      ? JSON.parse(existingLibraryJson)
      : [];

    const updatedLibrary = existingLibrary.map((song) => {
      if (song.id === songId) {
        return {
          ...song,
          playCount: (song.playCount || 0) + 1,
          lastPlayedAt: new Date().toISOString(),
        };
      }
      return song;
    });

    await SecureStore.setItemAsync(libraryKey, JSON.stringify(updatedLibrary));
    return updatedLibrary;
  } catch (error) {
    console.error("Update play count error:", error);
    throw error;
  }
};

export const initializeDemoLibrary = async (userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson
      ? JSON.parse(existingLibraryJson)
      : [];

    // Migrate existing library songs to include analysisData if missing
    const migratedLibrary = existingLibrary.map((song) => {
      if (!song.analysisData) {
        // Find matching mock song for analysis data
        const mockSong = MOCK_SONGS.find(
          (mock) => mock.id === song.id || mock.name === song.name
        );

        if (mockSong) {
          return {
            ...song,
            ...mockSong, // Update with complete mock data including analysisData
            // Preserve library-specific metadata
            addedAt: song.addedAt,
            playCount: song.playCount,
            lastPlayedAt: song.lastPlayedAt,
          };
        } else {
          // Generate fallback analysisData for unknown songs
          return {
            ...song,
            analysisData: {
              midiFile: {
                id: song.id || "1",
                name: `${song.name} - Full Track`,
                size: "45 KB",
                downloadUrl: "https://example.com/midi/fallback.mid",
              },
              bars: [
                {
                  id: 0,
                  startTime: 0,
                  endTime: 8,
                  chord: song.chords?.[0] || "C",
                  lyrics: `Sample lyrics for ${song.name}...`,
                  section: "Verse 1",
                },
                {
                  id: 1,
                  startTime: 8,
                  endTime: 16,
                  chord: song.chords?.[1] || "Am",
                  lyrics: "More sample lyrics...",
                  section: "Verse 1",
                },
                {
                  id: 2,
                  startTime: 16,
                  endTime: 24,
                  chord: song.chords?.[2] || "F",
                  lyrics: "Chorus section begins...",
                  section: "Chorus",
                },
                {
                  id: 3,
                  startTime: 24,
                  endTime: 32,
                  chord: song.chords?.[3] || "G",
                  lyrics: "Main hook of the song...",
                  section: "Chorus",
                },
              ],
              sections: [
                "Intro",
                "Verse 1",
                "Chorus",
                "Verse 2",
                "Chorus",
                "Bridge",
                "Outro",
              ],
            },
          };
        }
      }
      return song; // Song already has analysisData
    });

    // Save migrated library if changes were made
    if (
      migratedLibrary.length > 0 &&
      JSON.stringify(migratedLibrary) !== JSON.stringify(existingLibrary)
    ) {
      await SecureStore.setItemAsync(
        libraryKey,
        JSON.stringify(migratedLibrary)
      );
    }

    // Only add demo songs if library is empty
    if (migratedLibrary.length === 0) {
      const demoSongs = MOCK_SONGS.slice(0, 2).map((song, index) => ({
        ...song, // This includes analysisData
        addedAt: new Date(
          Date.now() - index * 24 * 60 * 60 * 1000
        ).toISOString(),
        playCount: Math.floor(Math.random() * 5) + 1,
        lastPlayedAt: new Date(
          Date.now() - index * 2 * 60 * 60 * 1000
        ).toISOString(),
      }));

      await SecureStore.setItemAsync(libraryKey, JSON.stringify(demoSongs));
      return demoSongs;
    }

    return migratedLibrary;
  } catch (error) {
    console.error("Initialize demo library error:", error);
    return [];
  }
};

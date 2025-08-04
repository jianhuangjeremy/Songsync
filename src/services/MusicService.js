import { Platform } from 'react-native';

// Conditional imports for platform compatibility
let FileSystem, SecureStore;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  SecureStore = require('expo-secure-store');
} else {
  // Web fallback for storage
  SecureStore = {
    getItemAsync: async (key) => localStorage.getItem(key),
    setItemAsync: async (key, value) => localStorage.setItem(key, value),
    deleteItemAsync: async (key) => localStorage.removeItem(key),
  };
}

const API_BASE_URL = 'http://localhost:8080';

// Mock song database for demonstration
const MOCK_SONGS = [
  {
    id: '1',
    name: 'Happy',
    album: 'Girl',
    singerName: 'Pharrell Williams',
    duration: '03:53',
    genre: 'Pop',
    year: '2013',
    confidence: 0.95,
    chords: ['F', 'C', 'G', 'Am'],
    hasMidi: true,
    albumCover: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Pharrell_Williams_-_G_I_R_L.png',
  },
  {
    id: '2',
    name: 'Bohemian Rhapsody',
    album: 'A Night at the Opera',
    singerName: 'Queen',
    duration: '05:55',
    genre: 'Rock',
    year: '1975',
    confidence: 0.92,
    chords: ['Bb', 'Eb', 'F', 'Cm'],
    hasMidi: true,
    albumCover: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png',
  },
  {
    id: '3',
    name: 'Shape of You',
    album: '÷ (Divide)',
    singerName: 'Ed Sheeran',
    duration: '03:53',
    genre: 'Pop',
    year: '2017',
    confidence: 0.88,
    chords: ['C#m', 'F#m', 'A', 'B'],
    hasMidi: true,
    albumCover: 'https://upload.wikimedia.org/wikipedia/en/4/45/Divide_cover.png',
  },
  {
    id: '4',
    name: 'Blinding Lights',
    album: 'After Hours',
    singerName: 'The Weeknd',
    duration: '03:20',
    genre: 'Synthpop',
    year: '2019',
    confidence: 0.94,
    chords: ['Fm', 'Db', 'Ab', 'Eb'],
    hasMidi: true,
    albumCover: 'https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_After_Hours.png',
  },
  {
    id: '5',
    name: 'Watermelon Sugar',
    album: 'Fine Line',
    singerName: 'Harry Styles',
    duration: '02:54',
    genre: 'Pop Rock',
    year: '2020',
    confidence: 0.91,
    chords: ['Em', 'Am', 'C', 'G'],
    hasMidi: true,
    albumCover: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Harry_Styles_-_Fine_Line.png',
  },
  {
    id: '6',
    name: 'Levitating',
    album: 'Future Nostalgia',
    singerName: 'Dua Lipa',
    duration: '03:23',
    genre: 'Disco Pop',
    year: '2020',
    confidence: 0.89,
    chords: ['D', 'A', 'Bm', 'G'],
    hasMidi: true,
    albumCover: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Dua_Lipa_-_Future_Nostalgia_%28Official_Album_Cover%29.png',
  },
];

export const identifySong = async (audioUri) => {
  try {
    // For web or when FileSystem is not available, skip file check
    if (Platform.OS !== 'web' && FileSystem) {
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      
      if (!audioInfo.exists) {
        throw new Error('Audio file not found');
      }
    }

    // For demo purposes, we'll use a mock API call
    // In production, you would send the actual audio file to your identification service
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response - in production this would be the actual API response
    try {
      const response = await fetch(`${API_BASE_URL}/getSongName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioFile: audioUri,
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return Array.isArray(result) ? result : [result];
      } else {
        throw new Error('API call failed');
      }
    } catch (apiError) {
      console.log('API unavailable, using mock data:', apiError.message);
      
      // Return mock results when API is not available
      const randomResults = MOCK_SONGS
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);
      
      return randomResults;
    }
  } catch (error) {
    console.error('Song identification error:', error);
    throw new Error('Failed to identify song. Please try again.');
  }
};

export const saveSongToLibrary = async (song, userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson ? JSON.parse(existingLibraryJson) : [];

    // Check if song already exists in library
    const existingSong = existingLibrary.find(item => item.id === song.id);
    if (existingSong) {
      throw new Error('Song already exists in your library');
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
    console.error('Save song error:', error);
    throw error;
  }
};

export const getLibrary = async (userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const libraryJson = await SecureStore.getItemAsync(libraryKey);
    return libraryJson ? JSON.parse(libraryJson) : [];
  } catch (error) {
    console.error('Get library error:', error);
    return [];
  }
};

export const removeSongFromLibrary = async (songId, userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson ? JSON.parse(existingLibraryJson) : [];

    const updatedLibrary = existingLibrary.filter(song => song.id !== songId);
    await SecureStore.setItemAsync(libraryKey, JSON.stringify(updatedLibrary));

    return updatedLibrary;
  } catch (error) {
    console.error('Remove song error:', error);
    throw error;
  }
};

export const updatePlayCount = async (songId, userId) => {
  try {
    const libraryKey = `library_${userId}`;
    const existingLibraryJson = await SecureStore.getItemAsync(libraryKey);
    const existingLibrary = existingLibraryJson ? JSON.parse(existingLibraryJson) : [];

    const updatedLibrary = existingLibrary.map(song => {
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
    console.error('Update play count error:', error);
    throw error;
  }
};

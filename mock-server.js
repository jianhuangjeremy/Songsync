const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mock user database
const mockUsers = new Map();
const mockTokens = new Map();

// Generate mock tokens
function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Mock song identification results
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
    hasAudio: true,
    albumCover: "https://upload.wikimedia.org/wikipedia/en/6/6f/Pharrell_Williams_-_G_I_R_L.png",
    previewUrl: "https://www.soundjay.com/misc/sounds/bells-2.mp3",
    analysisData: {
      audioFile: {
        id: "audio_1",
        name: "Happy - Backing Track",
        filename: "pharrell_williams_happy_backing_track.m4a",
        size: "8.5 MB",
        downloadUrl: "http://localhost:3000/static/audio/pharrell_williams_happy_backing_track.m4a",
        format: "m4a",
        duration_seconds: 233,
        youtube_source: {
          title: "Pharrell Williams - Happy (Official Backing Track)",
          channel: "BackingTracksPro",
          url: "https://www.youtube.com/watch?v=example1",
          search_query: "Pharrell Williams Happy backing track",
        },
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
      sections: ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Chorus", "Outro"],
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
    hasAudio: true,
    albumCover: "https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png",
    previewUrl: "https://www.soundjay.com/misc/sounds/bells-1.mp3",
    analysisData: {
      audioFile: {
        id: "audio_2",
        name: "Bohemian Rhapsody - Backing Track",
        filename: "queen_bohemian_rhapsody_backing_track.m4a",
        size: "12.8 MB",
        downloadUrl: "http://localhost:3000/static/audio/queen_bohemian_rhapsody_backing_track.m4a",
        format: "m4a",
        duration_seconds: 355,
        youtube_source: {
          title: "Queen - Bohemian Rhapsody (Official Backing Track)",
          channel: "BackingTracksPro",
          url: "https://www.youtube.com/watch?v=example2",
          search_query: "Queen Bohemian Rhapsody backing track",
        },
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
    hasAudio: true,
    albumCover: "https://upload.wikimedia.org/wikipedia/en/4/45/Divide_cover.png",
    previewUrl: "https://www.soundjay.com/misc/sounds/bells-3.mp3",
    analysisData: {
      audioFile: {
        id: "audio_3",
        name: "Shape of You - Backing Track",
        filename: "ed_sheeran_shape_of_you_backing_track.m4a",
        size: "6.2 MB",
        downloadUrl: "http://localhost:3000/static/audio/ed_sheeran_shape_of_you_backing_track.m4a",
        format: "m4a",
        duration_seconds: 233,
        youtube_source: {
          title: "Ed Sheeran - Shape of You (Official Backing Track)",
          channel: "BackingTracksPro",
          url: "https://www.youtube.com/watch?v=example3",
          search_query: "Ed Sheeran Shape of You backing track",
        },
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
      sections: ["Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Chorus", "Bridge", "Chorus"],
    },
  },
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const tokenData = mockTokens.get(token);
  if (!tokenData || Date.now() > tokenData.expires) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = tokenData.user;
  next();
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Hello endpoint for token validation
app.get('/hello', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Hello from mock server', 
    user: req.user,
    timestamp: new Date().toISOString() 
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password, identityToken } = req.body;
  
  console.log('Login attempt:', { username, hasPassword: !!password, hasIdentityToken: !!identityToken });
  
  // Mock authentication - accept any credentials
  const user = {
    id: Date.now().toString(),
    username: username || 'demo@example.com',
    email: username || 'demo@example.com',
    name: username ? username.split('@')[0] : 'Demo User'
  };
  
  // Generate tokens
  const accessToken = 'access_' + generateToken();
  const refreshToken = 'refresh_' + generateToken();
  
  // Store user and tokens
  mockUsers.set(user.id, user);
  mockTokens.set(accessToken, {
    user: user,
    expires: Date.now() + (15 * 60 * 1000) // 15 minutes
  });
  mockTokens.set(refreshToken, {
    user: user,
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  console.log('Login successful for user:', user.email);
  
  res.json({
    accessToken,
    refreshToken,
    user
  });
});

// Token refresh endpoint
app.post('/token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  
  const tokenData = mockTokens.get(refreshToken);
  if (!tokenData || Date.now() > tokenData.expires) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  
  // Generate new access token
  const accessToken = 'access_' + generateToken();
  mockTokens.set(accessToken, {
    user: tokenData.user,
    expires: Date.now() + (15 * 60 * 1000) // 15 minutes
  });
  
  console.log('Token refresh successful for user:', tokenData.user.email);
  
  res.json({ accessToken });
});

// Song identification endpoint
app.post('/identify-and-analyze', authenticateToken, async (req, res) => {
  const { audioData, audioFile, format, timestamp } = req.body;
  const isRetryAttempt = req.headers['x-retry-attempt'] === 'true';
  
  console.log('Song identification request:', {
    user: req.user.email,
    hasAudioData: !!audioData,
    hasAudioFile: !!audioFile,
    format,
    isRetryAttempt,
    timestamp
  });
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  
  // Simulate different scenarios
  const randomChance = Math.random();
  
  // 20% chance of no results found (for testing retry mechanism)
  if (randomChance < 0.2) {
    console.log('No song found (simulated)');
    return res.json([]);
  }
  
  // 80% chance of returning mock results
  const randomResults = MOCK_SONGS
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 2) + 1);
  
  console.log('Returning mock songs:', randomResults.map(s => s.name));
  
  res.json(randomResults);
});

// Static audio files endpoint (mock)
app.get('/static/audio/:filename', (req, res) => {
  const { filename } = req.params;
  console.log('Audio file request:', filename);
  
  // Return mock audio response
  res.status(200).json({
    message: 'Mock audio file - in production this would stream actual audio',
    filename,
    url: `http://localhost:3000/static/audio/${filename}`,
    note: 'This is a mock response. Real implementation would stream audio data.'
  });
});

// Search songs endpoint (optional - the app has client-side search)
app.get('/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const query = q.toLowerCase().trim();
  const searchResults = MOCK_SONGS.filter(song => {
    const nameMatch = song.name.toLowerCase().includes(query);
    const artistMatch = song.singerName.toLowerCase().includes(query);
    const albumMatch = song.album.toLowerCase().includes(query);
    
    // Check lyrics
    let lyricsMatch = false;
    if (song.analysisData && song.analysisData.bars) {
      lyricsMatch = song.analysisData.bars.some(
        bar => bar.lyrics && bar.lyrics.toLowerCase().includes(query)
      );
    }
    
    return nameMatch || artistMatch || albumMatch || lyricsMatch;
  });
  
  console.log(`Search for "${query}" returned ${searchResults.length} results`);
  
  res.json(searchResults);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Mock SongSync server running on http://localhost:${PORT}`);
  console.log('📁 Available endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  GET  /hello - Token validation (requires auth)');
  console.log('  POST /login - User authentication');
  console.log('  POST /token - Token refresh');
  console.log('  POST /identify-and-analyze - Song identification (requires auth)');
  console.log('  GET  /search - Search songs (requires auth)');
  console.log('  GET  /static/audio/:filename - Mock audio files');
  console.log('');
  console.log('🔧 Authentication:');
  console.log('  - Any username/password combination will work');
  console.log('  - Apple identity tokens are accepted');
  console.log('  - Access tokens expire after 15 minutes');
  console.log('  - Refresh tokens expire after 7 days');
  console.log('');
  console.log('🎵 Song identification:');
  console.log('  - Accepts any audio data (base64 or file)');
  console.log('  - 20% chance of no results (for testing retry)');
  console.log('  - 80% chance of returning 1-2 mock songs');
  console.log('  - Supports retry attempts');
});

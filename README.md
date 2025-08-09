# Songbook 🎵

A cross-platform music identification app built with React Native and Expo. Identify songs playing around you and build your personal music library.

## Features

- 🎤 **Audio Recording & Identification**: Capture ambient music and get instant song identification
- 🎨 **Liquid Glass UI**: Modern glassmorphism design with black, purple, and light green color scheme
- 🔐 **Authentication**: Sign in with Google or Apple accounts
- 📚 **Personal Library**: Save and manage your identified songs
- 📱 **Cross-Platform**: Works on iOS, Android, and Web
- 🔄 **Offline Support**: Works with mock data when the API is unavailable

## Tech Stack

- **React Native** with **Expo** for cross-platform development
- **Expo Audio** for audio recording
- **React Navigation** for navigation
- **Expo Auth Session** for authentication
- **Expo Secure Store** for local data storage
- **Linear Gradient & Blur View** for glassmorphism UI effects

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Songbook-1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Use the Expo app on your phone to scan the QR code, or press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - `w` for web browser

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── SongResultModal.js
├── context/            # React Context providers
│   └── AuthContext.js
├── screens/            # App screens
│   ├── AuthScreen.js
│   ├── HomeScreen.js
│   └── LibraryScreen.js
├── services/           # API and data services
│   └── MusicService.js
└── styles/             # Style definitions
    ├── Colors.js
    └── GlassStyles.js
```

## API Integration

The app is configured to work with a song identification API:

- **Mock API Endpoint**: `http://localhost:8080/getSongName`
- **Request**: POST with audio file data
- **Response**: Song information (name, album, artist, etc.)

When the API is unavailable, the app falls back to mock data for demonstration purposes.

### Expected API Response Format

```json
{
  "name": "Song Name",
  "album": "Album Name", 
  "singerName": "Artist Name",
  "duration": "3:45",
  "genre": "Pop",
  "year": "2023",
  "confidence": 0.95
}
```

## Features Overview

### Home Screen
- Large recording button with glassmorphism design
- Animated recording states with pulsing and rotation effects
- Real-time status updates during recording and processing
- Instructions card for new users

### Authentication
- Google and Apple sign-in integration (mock implementation)
- Secure token storage
- User session management

### Song Identification
- Audio recording with permission handling
- API integration with fallback to mock data
- Multiple song results with confidence scoring
- Song selection and library saving

### Library Management
- Personal song collection
- Play count tracking
- Song removal functionality
- Library statistics (total songs, plays, artists)

## Design System

### Colors
- **Black**: `#000000` - Primary background
- **Purple**: `#8B5CF6` - Primary accent
- **Light Green**: `#10B981` - Secondary accent
- **Glass Effects**: Semi-transparent overlays with blur

### UI Components
- Glassmorphism cards and buttons
- Gradient backgrounds
- Smooth animations and transitions
- Consistent spacing and typography

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version

### Testing

The app includes mock data and services for testing without a backend:

- Mock authentication providers
- Mock song identification results
- Local storage for library management

## Deployment

### Building for Production

1. **iOS**: 
```bash
expo build:ios
```

2. **Android**:
```bash
expo build:android
```

3. **Web**:
```bash
expo build:web
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Expo team for the excellent development platform
- React Native community for continuous improvements
- Music identification service providers
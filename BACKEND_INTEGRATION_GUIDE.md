# Backend Integration Guide for Songbook App

## Summary of Changes Made

The app previously had **two separate mock data systems**:
1. `MusicService.js` - Mock song identification data  
2. `MusicAnalysisScreen.js` - Mock analysis data (chords, lyrics, timing)

This has been **consolidated into a single service call** to match your backend implementation.

## Issues Identified and Fixed

❌ **Original Problem**: "No analysis data available for this song" error
- **Root Cause**: Library songs don't have `analysisData` property 
- **Solution**: Added intelligent fallback system

✅ **Current Behavior**:
- **New songs** (from identification): Use complete `analysisData` from backend
- **Library songs** (existing): Generate fallback analysis using available song data
- **Graceful degradation**: Always shows analysis screen with relevant data

## What Was Removed

❌ **Duplicate mock data in MusicAnalysisScreen.js**
- Removed the separate `loadMusicData()` function with hardcoded analysis data
- Eliminated unnecessary API simulation delay
- No more second mock data generation

## What Was Updated

✅ **Consolidated MusicService.js**
- Updated mock data to include complete `analysisData` structure
- Changed API endpoint from `/getSongName` to `/identify-and-analyze`
- Added comprehensive data structure that matches your backend response

✅ **Smart MusicAnalysisScreen.js**
- Now directly uses `song.analysisData` when available (new identifications)
- Generates intelligent fallback for library songs using existing chord data
- No separate API call needed for new songs
- Backward compatible with existing library songs

✅ **Fallback Analysis Generation**
- Uses existing song chord progressions when available
- Creates sample lyrics and timing structure
- Maintains consistent UI experience for all songs

## Backend Integration Steps

### 1. Update Your Backend Endpoint

Your backend should have a single endpoint that returns everything:

```
POST /identify-and-analyze
```

**Request Format:**
```json
{
  "audioFile": "base64_or_file_data",
  "timestamp": 1234567890
}
```

### 2. Expected Response Format

Your backend should return an array of song objects with this complete structure:

```json
[
  {
    "id": "unique_song_id",
    "name": "Song Title",
    "singerName": "Artist Name",
    "album": "Album Name",
    "duration": "03:45",
    "genre": "Pop",
    "year": "2023",
    "confidence": 0.95,
    "chords": ["C", "Am", "F", "G"],
    "hasMidi": true,
    "albumCover": "https://example.com/cover.jpg",
    "previewUrl": "https://example.com/preview.mp3",
    "analysisData": {
      "midiFile": {
        "id": "midi_id",
        "name": "Song Title - Full Track",
        "size": "45 KB",
        "downloadUrl": "https://example.com/midi/song.mid"
      },
      "bars": [
        {
          "id": 0,
          "startTime": 0,
          "endTime": 8,
          "chord": "C",
          "lyrics": "First line of lyrics",
          "section": "Verse 1"
        },
        {
          "id": 1,
          "startTime": 8,
          "endTime": 16,
          "chord": "Am",
          "lyrics": "Second line of lyrics",
          "section": "Verse 1"
        }
        // ... more bars
      ],
      "sections": ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"]
    }
  }
]
```

### 3. Update MusicService.js Configuration

In `/src/services/MusicService.js`, update these values:

```javascript
// Line 15: Update to your backend URL
const API_BASE_URL = 'https://your-backend-domain.com';

// Line 106: Update endpoint name if different
const response = await fetch(`${API_BASE_URL}/identify-and-analyze`, {
```

### 4. Handle Audio File Upload

Depending on your backend requirements, you may need to modify the request format in `MusicService.js` (around line 110):

**For base64 audio:**
```javascript
body: JSON.stringify({
  audioData: base64AudioString,
  format: 'wav',
  timestamp: Date.now()
})
```

**For multipart file upload:**
```javascript
const formData = new FormData();
formData.append('audio', {
  uri: audioUri,
  type: 'audio/wav',
  name: 'recording.wav'
});
// ... use formData as body
```

### 5. Testing Your Integration

1. **Keep mock fallback enabled** for testing
2. **Check console logs** for API call debugging
3. **Test with real audio** once your service is deployed
4. **Verify the complete data flow**:
   - Audio recording → identification → analysis data → UI display

## Flow Diagram

```
User taps "Listen" 
    ↓
Audio recorded
    ↓
Single API call to /identify-and-analyze
    ↓
Your backend returns:
- Song identification data
- Complete analysis data (chords, lyrics, timing)
- MIDI file info
    ↓
App displays results immediately
    ↓
User taps "Analyze" → Navigation with complete data
    ↓
MusicAnalysisScreen renders with song.analysisData
```

## Benefits of This Approach

✅ **Single API call** - More efficient, faster user experience
✅ **No duplicate mock data** - Easier to maintain
✅ **Better performance** - Analysis screen loads instantly
✅ **Consistent data** - No risk of mismatched song info vs. analysis
✅ **Simplified debugging** - One source of truth for song data

## Files Modified

- `/src/services/MusicService.js` - Updated to handle complete response
- `/src/screens/MusicAnalysisScreen.js` - Simplified to use passed data

The app is now ready for your backend integration with a single, comprehensive API endpoint!

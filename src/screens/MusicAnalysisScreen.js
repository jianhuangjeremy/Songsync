import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import StarRating from '../components/StarRating';
import { FeedbackService } from '../services/FeedbackService';

const { width } = Dimensions.get('window');

export default function MusicAnalysisScreen({ route, navigation }) {
  const { song } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(233); // 3:53 in seconds
  const [currentBar, setCurrentBar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [musicData, setMusicData] = useState(null);
  const [userRating, setUserRating] = useState(0);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const playbackInterval = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadMusicData();
    
    // Start waveform animation for active bar
    const animateWaveform = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(progressAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    animateWaveform();
    
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, []);

  const loadMusicData = async () => {
    try {
      // Simulate API call to get song analysis data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load existing rating for this song
      const existingRating = await FeedbackService.getRating(song.id || song.name);
      if (existingRating) {
        setUserRating(existingRating.rating);
      }
      
      // Mock music analysis data with lyrics and chords
      const mockData = {
        midiFile: {
          id: '1',
          name: `${song.name} - Full Track`,
          size: '45 KB',
          downloadUrl: 'https://example.com/midi/full-track.mid',
        },
        bars: [
          {
            id: 0,
            startTime: 0,
            endTime: 8,
            chord: 'C',
            lyrics: 'It might seem crazy what I\'m about to say',
            section: 'Verse 1'
          },
          {
            id: 1,
            startTime: 8,
            endTime: 16,
            chord: 'Am',
            lyrics: 'Sunshine she\'s here, you can take a break',
            section: 'Verse 1'
          },
          {
            id: 2,
            startTime: 16,
            endTime: 24,
            chord: 'F',
            lyrics: 'I\'m a hot air balloon that could go to space',
            section: 'Verse 1'
          },
          {
            id: 3,
            startTime: 24,
            endTime: 32,
            chord: 'G',
            lyrics: 'With the air, like I don\'t care baby by the way',
            section: 'Verse 1'
          },
          {
            id: 4,
            startTime: 32,
            endTime: 40,
            chord: 'C',
            lyrics: 'Because I\'m happy',
            section: 'Chorus'
          },
          {
            id: 5,
            startTime: 40,
            endTime: 48,
            chord: 'Am',
            lyrics: 'Clap along if you feel like a room without a roof',
            section: 'Chorus'
          },
          {
            id: 6,
            startTime: 48,
            endTime: 56,
            chord: 'F',
            lyrics: 'Because I\'m happy',
            section: 'Chorus'
          },
          {
            id: 7,
            startTime: 56,
            endTime: 64,
            chord: 'G',
            lyrics: 'Clap along if you feel like happiness is the truth',
            section: 'Chorus'
          },
          {
            id: 8,
            startTime: 64,
            endTime: 72,
            chord: 'Em',
            lyrics: 'Here come bad news talking this and that',
            section: 'Verse 2'
          },
          {
            id: 9,
            startTime: 72,
            endTime: 80,
            chord: 'Am',
            lyrics: 'Give me all you got, don\'t hold back',
            section: 'Verse 2'
          },
          {
            id: 10,
            startTime: 80,
            endTime: 88,
            chord: 'F',
            lyrics: 'Well I should probably warn you I\'ll be just fine',
            section: 'Verse 2'
          },
          {
            id: 11,
            startTime: 88,
            endTime: 96,
            chord: 'G',
            lyrics: 'No offense to you don\'t waste your time',
            section: 'Verse 2'
          },
        ],
        sections: ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Chorus', 'Outro']
      };
      
      setMusicData(mockData);
    } catch (error) {
      console.error('Failed to load music data:', error);
      Alert.alert('Error', 'Failed to load music analysis data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
        playbackInterval.current = null;
      }
    } else {
      // Play
      setIsPlaying(true);
      playbackInterval.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 0.1;
          if (newTime >= duration) {
            setIsPlaying(false);
            clearInterval(playbackInterval.current);
            playbackInterval.current = null;
            setCurrentTime(0);
            setCurrentBar(0);
            return 0;
          }
          
          // Update current bar based on time
          if (musicData) {
            const bar = musicData.bars.find(bar => 
              newTime >= bar.startTime && newTime < bar.endTime
            );
            if (bar && bar.id !== currentBar) {
              setCurrentBar(bar.id);
              // Auto-scroll to current bar
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  y: bar.id * 120, // Approximate height per bar
                  animated: true
                });
              }, 100);
            }
          }
          
          return newTime;
        });
      }, 100);
    }
  };

  const handleSeek = (barId) => {
    if (musicData) {
      const bar = musicData.bars[barId];
      if (bar) {
        setCurrentTime(bar.startTime);
        setCurrentBar(barId);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRatingChange = async (rating, songTitle) => {
    setUserRating(rating);
    
    try {
      // Save rating using FeedbackService
      const success = await FeedbackService.saveRating(
        song.id || song.name, // Use song ID if available, fallback to name
        rating,
        songTitle,
        {
          artist: song.singerName,
          album: song.album,
          analysisType: 'music_analysis'
        }
      );
      
      if (success) {
        console.log(`User rated "${songTitle}" with ${rating} stars`);
        
        // Show brief success feedback
        Alert.alert(
          'Thank you!', 
          `Your ${rating}-star rating helps us improve the music analysis quality.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save your rating. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save rating:', error);
      Alert.alert('Error', 'Failed to save your rating. Please try again.');
    }
  };

  const renderProgressBar = () => {
    const progress = currentTime / duration;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    );
  };

  const renderBar = (bar, index) => {
    const isActive = currentBar === bar.id;
    
    return (
      <BlurView
        key={bar.id}
        intensity={15}
        style={[
          styles.barCard,
          GlassStyles.glassCard,
          isActive && styles.activeBar
        ]}
      >
        <TouchableOpacity
          onPress={() => handleSeek(bar.id)}
          activeOpacity={0.8}
          style={styles.barContent}
        >
          {/* Bar Header */}
          <View style={styles.barHeader}>
            <View style={styles.barInfo}>
              <Text style={styles.barNumber}>Bar {bar.id + 1}</Text>
            </View>
            
            <View style={styles.chordContainer}>
              <Text style={[styles.chordText, isActive && styles.activeChordText]}>
                {bar.chord}
              </Text>
            </View>
          </View>

          {/* Lyrics */}
          <View style={styles.lyricsContainer}>
            <Text style={[styles.lyricsText, isActive && styles.activeLyricsText]}>
              {bar.lyrics}
            </Text>
          </View>

          {/* Time indicator */}
          <View style={styles.timeIndicator}>
            <Text style={styles.timeIndicatorText}>
              {formatTime(bar.startTime)} - {formatTime(bar.endTime)}
            </Text>
            {isActive && (
              <View style={styles.playingIndicator}>
                <View style={styles.waveform}>
                  {[...Array(4)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          transform: [{
                            scaleY: progressAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 1],
                              extrapolate: 'clamp'
                            })
                          }]
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.nowPlayingText}>Playing</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </BlurView>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[Colors.black, Colors.purple, Colors.black]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.lightGreen} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={styles.headerButton} />
          </View>
          
          <View style={styles.loadingContainer}>
            <BlurView intensity={20} style={[styles.loadingCard, GlassStyles.glassCard]}>
              <Text style={styles.loadingText}>Analyzing Music...</Text>
            </BlurView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.black, Colors.purple, Colors.black]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.lightGreen} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Music Analysis</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => Alert.alert('Download', 'Download MIDI file')}
          >
            <Ionicons name="download-outline" size={20} color={Colors.lightGreen} />
          </TouchableOpacity>
        </View>

        {/* Song Info */}
        <BlurView intensity={15} style={[styles.songInfoCard, GlassStyles.glassCard]}>
          <Text style={styles.songTitle} numberOfLines={1}>{song.name}</Text>
          <Text style={styles.artistName}>by {song.singerName}</Text>
          <Text style={styles.albumName}>from "{song.album}"</Text>
        </BlurView>

        {/* Player Control */}
        <BlurView intensity={15} style={[styles.playerCard, GlassStyles.glassCard]}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.lightGreen, '#059669']}
              style={styles.playButtonGradient}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color={Colors.white} 
              />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.playerInfo}>
            <Text style={styles.playerTitle}>MIDI Playback</Text>
            <Text style={styles.playerSubtitle}>
              {musicData?.midiFile?.name} • {musicData?.midiFile?.size}
            </Text>
          </View>
        </BlurView>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Bars with Chords and Lyrics */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.barsContainer}
          showsVerticalScrollIndicator={false}
        >
          {musicData?.bars.map((bar, index) => renderBar(bar, index))}
          
          {/* User Feedback Rating */}
          <StarRating
            onRatingChange={handleRatingChange}
            initialRating={userRating}
            songTitle={song.name}
            maxStars={5}
            showFeedbackText={true}
          />
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '500',
  },
  songInfoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  artistName: {
    fontSize: 14,
    color: Colors.lightGreen,
    textAlign: 'center',
    marginBottom: 2,
  },
  albumName: {
    fontSize: 12,
    color: Colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  playerSubtitle: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.lightGreen,
    borderRadius: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  barsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  barCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeBar: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: Colors.lightGreen,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  barContent: {
    padding: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barNumber: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
    marginRight: 12,
  },
  chordContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  chordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.lightGreen,
  },
  activeChordText: {
    color: Colors.white,
  },
  lyricsContainer: {
    marginBottom: 12,
  },
  lyricsText: {
    fontSize: 16,
    color: Colors.white,
    lineHeight: 24,
  },
  activeLyricsText: {
    color: Colors.lightGreen,
    fontWeight: '500',
  },
  timeIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeIndicatorText: {
    fontSize: 11,
    color: Colors.lightGray,
    opacity: 0.6,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  waveBar: {
    width: 2,
    height: 12,
    backgroundColor: Colors.lightGreen,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  nowPlayingText: {
    fontSize: 11,
    color: Colors.lightGreen,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

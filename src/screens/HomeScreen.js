import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Conditional imports for platform compatibility
let Audio, FileSystem;
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio;
  FileSystem = require('expo-file-system');
}

import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import SongResultModal from '../components/SongResultModal';
import { identifySong, saveSongToLibrary, getLibrary, initializeDemoLibrary } from '../services/MusicService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [songResults, setSongResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [recentResults, setRecentResults] = useState([]);
  
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  useEffect(() => {
    loadRecentResults();
  }, []);

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
      startRotateAnimation();
    } else {
      stopAnimations();
    }
  }, [isRecording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRotateAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnimation.stopAnimation();
    rotateAnimation.stopAnimation();
    rotateAnimation.setValue(0);
    pulseAnimation.setValue(1);
  };

  const loadRecentResults = async () => {
    try {
      // Initialize demo library if user is new
      await initializeDemoLibrary(user.id);
      
      const library = await getLibrary(user.id);
      // Get the 3 most recently added songs
      const recent = library
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
        .slice(0, 3);
      setRecentResults(recent);
    } catch (error) {
      console.error('Error loading recent results:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll use the Web Audio API or MediaRecorder
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
          } catch (error) {
            Alert.alert(
              'Permission Required',
              'Please grant microphone permission to record audio for song identification.',
              [{ text: 'OK' }]
            );
            return false;
          }
        } else {
          Alert.alert(
            'Not Supported',
            'Audio recording is not supported in this browser. Please try on a mobile device.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please grant microphone permission to record audio for song identification.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      if (Platform.OS === 'web') {
        // For web demo, we'll simulate recording
        setIsRecording(true);
        
        // Animate button press
        Animated.spring(scaleAnimation, {
          toValue: 0.9,
          useNativeDriver: true,
        }).start();

        // Auto-stop after 3 seconds for demo
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
          }
        }, 3000);
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsRecording(true);

        // Animate button press
        Animated.spring(scaleAnimation, {
          toValue: 0.9,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Reset button animation
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      if (Platform.OS === 'web') {
        // For web demo, simulate processing and return mock data
        await handleSongIdentification('web-demo-audio');
      } else {
        if (!recording) return;
        
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
          await handleSongIdentification(uri);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleSongIdentification = async (audioUri) => {
    try {
      const results = await identifySong(audioUri);
      setSongResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Song identification error:', error);
      Alert.alert('Error', 'Failed to identify song. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSongSelect = async (song) => {
    try {
      await saveSongToLibrary(song, user.id);
      setShowResults(false);
      setSongResults([]);
      // Reload recent results to show the newly added song
      loadRecentResults();
      Alert.alert('Success', `"${song.name}" has been added to your library!`);
    } catch (error) {
      console.error('Save song error:', error);
      Alert.alert('Error', 'Failed to save song to library.');
    }
  };

  const handleRetryRecording = () => {
    setShowResults(false);
    setSongResults([]);
  };

  const handlePlaySong = (song) => {
    Alert.alert(
      'Play Song',
      `Would you like to play "${song.name}" by ${song.singerName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Play on Spotify',
          onPress: () => {
            // In a real app, this would open Spotify with the song
            Alert.alert('Opening Spotify...', `Searching for "${song.name}" by ${song.singerName}`);
          },
        },
        {
          text: 'Play on Apple Music',
          onPress: () => {
            // In a real app, this would open Apple Music with the song
            Alert.alert('Opening Apple Music...', `Searching for "${song.name}" by ${song.singerName}`);
          },
        },
      ]
    );
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[Colors.black, Colors.darkPurple, Colors.black]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <BlurView intensity={20} style={[styles.userCard, GlassStyles.glassContainer]}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Music Lover'}</Text>
            </BlurView>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, GlassStyles.glassButton]}
              onPress={() => navigation.navigate('Library')}
            >
              <Ionicons name="library" size={24} color={Colors.lightGreen} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerButton, GlassStyles.glassButton]}
              onPress={signOut}
            >
              <Ionicons name="log-out" size={24} color={Colors.purple} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.mainContent}
          contentContainerStyle={styles.mainContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isRecording 
                ? 'Listening...' 
                : isProcessing 
                ? 'Identifying song...' 
                : 'Tap to identify ambient music'}
            </Text>
            <Text style={styles.statusSubtext}>
              {isRecording 
                ? 'Listening to ambient music in your environment' 
                : isProcessing 
                ? 'Analyzing audio patterns and finding song details' 
                : 'Tap to capture music playing around you'}
            </Text>
          </View>

          {/* Record Button */}
          <View style={styles.recordContainer}>
            <Animated.View
              style={[
                styles.recordButtonOuter,
                {
                  transform: [
                    { scale: pulseAnimation },
                    { rotate: rotateInterpolate },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordingButton,
                  GlassStyles.glowingBorder,
                ]}
                onPress={handleRecordPress}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                  {isProcessing ? (
                    <ActivityIndicator size="large" color={Colors.lightGreen} />
                  ) : (
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={80}
                      color={isRecording ? Colors.purple : Colors.lightGreen}
                    />
                  )}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <BlurView intensity={15} style={[styles.instructionsCard, GlassStyles.glassCard]}>
              <Text style={styles.instructionsTitle}>How it works</Text>
              <View style={styles.instructionStep}>
                <Ionicons name="radio-button-on" size={20} color={Colors.lightGreen} />
                <Text style={styles.instructionText}>Tap to start recording ambient music</Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="search" size={20} color={Colors.purple} />
                <Text style={styles.instructionText}>Identify music playing in environment</Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="information-circle" size={20} color={Colors.lightGreen} />
                <Text style={styles.instructionText}>Get complete song information</Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="musical-note" size={20} color={Colors.purple} />
                <Text style={styles.instructionText}>Access chords and MIDI files</Text>
              </View>
            </BlurView>
          </View>

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <View style={styles.recentResultsContainer}>
              <BlurView intensity={15} style={[styles.recentResultsCard, GlassStyles.glassCard]}>
                <View style={styles.recentResultsHeader}>
                  <Text style={styles.recentResultsTitle}>Recent Discoveries</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Library')}
                    style={styles.learnMoreButton}
                  >
                    <Text style={styles.learnMoreText}>Learn more</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.lightGreen} />
                  </TouchableOpacity>
                </View>
                
                {recentResults.map((song, index) => (
                  <TouchableOpacity
                    key={song.id}
                    style={styles.recentSongItem}
                    onPress={() => navigation.navigate('Library')}
                  >
                    <View style={styles.recentSongAlbum}>
                      {song.albumCover ? (
                        <Image 
                          source={{ uri: song.albumCover }} 
                          style={styles.recentAlbumCover}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.recentDefaultAlbum}>
                          <Ionicons name="musical-notes" size={16} color={Colors.lightGreen} />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.recentSongInfo}>
                      <Text style={styles.recentSongName} numberOfLines={1}>
                        {song.name}
                      </Text>
                      <Text style={styles.recentArtistName} numberOfLines={1}>
                        {song.singerName}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.recentPlayButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePlaySong(song);
                      }}
                    >
                      <Ionicons name="play" size={14} color={Colors.lightGreen} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </BlurView>
            </View>
          )}
        </ScrollView>

        {/* Song Results Modal */}
        <SongResultModal
          visible={showResults}
          results={songResults}
          onSelectSong={handleSongSelect}
          onRetry={handleRetryRecording}
          onClose={() => setShowResults(false)}
          onPlaySong={handlePlaySong}
        />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userCard: {
    padding: 16,
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainContentContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  recordContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  recordingButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  instructionsCard: {
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.lightGray,
    marginLeft: 12,
    flex: 1,
  },
  recentResultsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  recentResultsCard: {
    padding: 16,
  },
  recentResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  learnMoreText: {
    fontSize: 14,
    color: Colors.lightGreen,
    marginRight: 4,
    fontWeight: '600',
  },
  recentSongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentSongAlbum: {
    marginRight: 12,
  },
  recentAlbumCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  recentDefaultAlbum: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recentSongInfo: {
    flex: 1,
    marginRight: 12,
  },
  recentSongName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  recentArtistName: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  recentPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

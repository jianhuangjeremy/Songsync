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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import SongResultModal from '../components/SongResultModal';
import { identifySong, saveSongToLibrary } from '../services/MusicService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [songResults, setSongResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
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

  const requestPermissions = async () => {
    try {
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
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

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

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      setIsProcessing(true);

      // Reset button animation
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await handleSongIdentification(uri);
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
        <View style={styles.mainContent}>
          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isRecording 
                ? 'Listening...' 
                : isProcessing 
                ? 'Identifying song...' 
                : 'Tap to identify music'}
            </Text>
            <Text style={styles.statusSubtext}>
              {isRecording 
                ? 'Recording audio from your environment' 
                : isProcessing 
                ? 'Analyzing audio patterns' 
                : 'Hold the button to capture audio'}
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
                <Ionicons name="play" size={20} color={Colors.lightGreen} />
                <Text style={styles.instructionText}>Play music around you</Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="mic" size={20} color={Colors.purple} />
                <Text style={styles.instructionText}>Tap and hold the record button</Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="musical-notes" size={20} color={Colors.lightGreen} />
                <Text style={styles.instructionText}>Get instant song identification</Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* Song Results Modal */}
        <SongResultModal
          visible={showResults}
          results={songResults}
          onSelectSong={handleSongSelect}
          onRetry={handleRetryRecording}
          onClose={() => setShowResults(false)}
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
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
});

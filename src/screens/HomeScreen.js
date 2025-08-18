// Fixed audio recording cleanup
import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import {
  identifySong,
  saveSongToLibrary,
  getLibrary,
  initializeDemoLibrary,
} from "../services/MusicService";
import { SubscriptionService } from "../services/SubscriptionService";
import SongResultModal from "../components/SongResultModal";
import NoSongFoundModal from "../components/NoSongFoundModal";
import UpgradeModal from "../components/UpgradeModal";
import { Colors } from "../styles/Colors";
import { GlassStyles } from "../styles/GlassStyles";

// Conditional imports for platform compatibility
let Audio, FileSystem;
if (Platform.OS !== "web") {
  Audio = require("expo-av").Audio;
  FileSystem = require("expo-file-system");
}

// Add custom CSS for better scroll bar on web
if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = `
    /* Custom scrollbar for webkit browsers */
    *::-webkit-scrollbar {
      width: 12px !important;
      background: rgba(0, 0, 0, 0.3) !important;
    }
    
    *::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3) !important;
      border-radius: 6px !important;
      border: 1px solid rgba(16, 185, 129, 0.3) !important;
    }
    
    *::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #10B981 0%, #059669 100%) !important;
      border-radius: 6px !important;
      border: 1px solid rgba(16, 185, 129, 0.5) !important;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3) !important;
      transition: all 0.3s ease !important;
    }
    
    *::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #059669 0%, #047857 100%) !important;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.5) !important;
      transform: scale(1.1) !important;
    }
    
    /* Firefox scrollbar */
    * {
      scrollbar-width: thick !important;
      scrollbar-color: #10B981 rgba(0, 0, 0, 0.3) !important;
    }
    
    /* Force scroll bar to always be visible */
    html, body, #root, #root > div {
      overflow-y: scroll !important;
    }
  `;
  document.head.appendChild(style);
}

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [songResults, setSongResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showNoSongFoundModal, setShowNoSongFoundModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("limit_reached");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollViewRef = useRef(null);

  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (recording) {
        recording
          .getStatusAsync()
          .then((status) => {
            if (status.isRecording || status.isDoneRecording) {
              recording.stopAndUnloadAsync().catch((error) => {
                // Silently handle cleanup errors
              });
            }
          })
          .catch(() => {
            // Recording already unloaded, no action needed
          });
      }
    };
  }, [recording]);

  useEffect(() => {
    // Wrap async calls in an IIFE to handle errors properly
    const initializeComponent = async () => {
      try {
        await loadRecentResults();
        await loadSubscriptionStatus();
      } catch (error) {
        console.error("Error initializing component:", error);
      }
    };

    initializeComponent();
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

  const loadSubscriptionStatus = async () => {
    try {
      const status = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error("Error loading subscription status:", error);
    }
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
      console.error("Error loading recent results:", error);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === "web") {
        // For web, we'll use the Web Audio API or MediaRecorder
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
          } catch (error) {
            Alert.alert(
              "Permission Required",
              "Please grant microphone permission to record audio for song identification.",
              [{ text: "OK" }]
            );
            return false;
          }
        } else {
          Alert.alert(
            "Not Supported",
            "Audio recording is not supported in this browser. Please try on a mobile device.",
            [{ text: "OK" }]
          );
          return false;
        }
      } else {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please grant microphone permission to record audio for song identification.",
            [{ text: "OK" }]
          );
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error("Permission request error:", error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Check subscription limits before starting recording
      const canIdentify = await SubscriptionService.canIdentifySongs();
      // if (!canIdentify.canUse) {
      //   setUpgradeReason("limit_reached");
      //   setShowUpgradeModal(true);
      //   return;
      // }

      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      if (Platform.OS === "web") {
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
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
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

      if (Platform.OS === "web") {
        // For web demo, simulate processing and return mock data
        await handleSongIdentification("web-demo-audio");
      } else {
        if (!recording) return;

        // Check recording status before stopping
        const status = await recording.getStatusAsync();
        if (status.isRecording || status.isDoneRecording) {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI(); //"file:///Users/jianhuang/Documents/song-id/songs/subway.m4a";
          console.log("Recording stopped, URI:", uri);
          setRecording(null);

          if (uri) {
            // Convert audio file to base64 for testing
            try {
              if (FileSystem) {
                const base64Audio = await FileSystem.readAsStringAsync(uri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                console.log(
                  "Audio file converted to base64, length:",
                  base64Audio.length
                );
                await handleSongIdentification(base64Audio, true); // Pass true to indicate base64 format
              } else {
                // Fallback for web or when FileSystem is not available
                await handleSongIdentification(uri);
              }
            } catch (error) {
              console.error("Error reading audio file:", error);
              Alert.alert("Error", "Failed to read audio file for processing.");
              setIsProcessing(false);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to process recording. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleSongIdentification = async (audioData, isBase64 = false) => {
    try {
      // Increment usage count for successful identification attempt
      await SubscriptionService.incrementDailyUsage();

      // Pass base64 flag to identifySong function
      const results = await identifySong(audioData, isBase64);

      if (results && results.length > 0) {
        // Automatically navigate to music analysis with the first (best) result
        const bestResult = results[0]; // Take the first result (usually highest confidence)

        // Save to library first
        try {
          await saveSongToLibrary(bestResult, user.id);
          await loadRecentResults(); // Refresh recent results
        } catch (saveError) {
          // If song already exists in library, that's fine - continue to analysis
          console.log("Song may already exist in library:", saveError.message);
        }

        // Navigate directly to music analysis screen
        navigation.navigate("MusicAnalysis", { song: bestResult });

        // Refresh subscription status to update UI
        await loadSubscriptionStatus();
      } else {
        // No songs found - show the "no song found" modal
        setShowNoSongFoundModal(true);
      }
    } catch (error) {
      console.error("Song identification error:", error);
      Alert.alert("Error", "Failed to identify song. Please try again.");
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
      await loadRecentResults();
      Alert.alert("Success", `"${song.name}" has been added to your library!`);
    } catch (error) {
      console.error("Save song error:", error);
      Alert.alert("Error", "Failed to save song to library.");
    }
  };

  const handleRetryRecording = () => {
    setShowResults(false);
    setSongResults([]);
  };

  const handleNoSongTryAgain = () => {
    setShowNoSongFoundModal(false);
    // Start recording again
    setTimeout(() => {
      startRecording();
    }, 500); // Small delay for smooth transition
  };

  const handleNoSongGotIt = () => {
    setShowNoSongFoundModal(false);
  };

  const handlePlaySong = (song) => {
    console.log("Playing song:", song.name);
  };

  const handleMidiDownload = async (song) => {
    try {
      const midiStatus = await SubscriptionService.canDownloadMidi();

      if (!midiStatus.canDownload) {
        setUpgradeReason("midi_download");
        setShowUpgradeModal(true);
        return;
      }

      // If user can download, proceed with download
      Alert.alert("Download MIDI", `Download MIDI file for "${song.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: () => {
            // Mock download - replace with actual download logic
            Alert.alert("Success", "MIDI file downloaded successfully!");
          },
        },
      ]);
    } catch (error) {
      console.error("Error checking MIDI download permission:", error);
      Alert.alert("Error", "Unable to download MIDI file. Please try again.");
    }
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentSizeHeight = event.nativeEvent.contentSize.height;
    const layoutMeasurementHeight = event.nativeEvent.layoutMeasurement.height;

    // Calculate scroll progress (0 to 1)
    const progress = offsetY / (contentSizeHeight - layoutMeasurementHeight);
    setScrollProgress(Math.max(0, Math.min(1, progress)));
    setContentHeight(contentSizeHeight);
    setContainerHeight(layoutMeasurementHeight);
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
    outputRange: ["0deg", "360deg"],
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
            <BlurView
              intensity={20}
              style={[styles.userCard, GlassStyles.glassContainer]}
            >
              <View style={styles.userTextContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>
                  {user?.name || "Music Lover"}
                </Text>
              </View>

              {/* Usage Indicator inside user card */}
              {subscriptionStatus && (
                <View style={styles.inlineUsageIndicator}>
                  <View style={styles.usageInfo}>
                    <Text style={styles.usageText}>
                      {subscriptionStatus.identificationStatus.used} /{" "}
                      {subscriptionStatus.identificationStatus.limit === -1
                        ? "∞"
                        : subscriptionStatus.identificationStatus.limit}
                    </Text>
                    <Text style={styles.usageLabel}>Daily IDs</Text>
                  </View>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: subscriptionStatus.config.color },
                    ]}
                  >
                    <Text style={styles.tierText}>
                      {subscriptionStatus.config.name}
                    </Text>
                  </View>
                </View>
              )}
            </BlurView>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[GlassStyles.glassButton, styles.headerButton]}
              onPress={() => navigation.navigate("Library")}
            >
              <Ionicons name="library" size={24} color={Colors.lightGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[GlassStyles.glassButton, styles.headerButton]}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings" size={24} color={Colors.purple} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[GlassStyles.glassButton, styles.headerButton]}
              onPress={signOut}
            >
              <Ionicons name="log-out" size={24} color={Colors.red} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.mainContent}
          contentContainerStyle={styles.mainContentContainer}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white" // Make scroll indicator white for better visibility
          bounces={true}
          alwaysBounceVertical={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          persistentScrollbar={true} // Keep scroll bar visible on web
        >
          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isRecording
                ? "Listening..."
                : isProcessing
                ? "Identifying song..."
                : "Tap to identify ambient music"}
            </Text>
            <Text style={styles.statusSubtext}>
              {isRecording
                ? "Listening to ambient music in your environment"
                : isProcessing
                ? "Analyzing audio patterns and finding song details"
                : "Tap to capture music playing around you"}
            </Text>
            {!isRecording && !isProcessing && recentResults.length > 0 && (
              <Text style={styles.scrollHintSubtext}>
                ↓ Scroll down to see your recent discoveries
              </Text>
            )}
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
                <Animated.View
                  style={{ transform: [{ scale: scaleAnimation }] }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color={Colors.lightGreen} />
                  ) : (
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
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
            <BlurView
              intensity={15}
              style={[styles.instructionsCard, GlassStyles.glassCard]}
            >
              <Text style={styles.instructionsTitle}>How it works</Text>
              <View style={styles.instructionStep}>
                <Ionicons
                  name="radio-button-on"
                  size={20}
                  color={Colors.lightGreen}
                />
                <Text style={styles.instructionText}>
                  Tap to start recording ambient music
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="search" size={20} color={Colors.purple} />
                <Text style={styles.instructionText}>
                  Identify music playing in environment
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={Colors.lightGreen}
                />
                <Text style={styles.instructionText}>
                  Get complete song information
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Ionicons name="musical-note" size={20} color={Colors.purple} />
                <Text style={styles.instructionText}>
                  Access chords and MIDI files
                </Text>
              </View>
            </BlurView>
          </View>

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <View style={styles.recentResultsContainer}>
              <BlurView
                intensity={15}
                style={[styles.recentResultsCard, GlassStyles.glassCard]}
              >
                <View style={styles.recentResultsHeader}>
                  <Text style={styles.recentResultsTitle}>
                    Recent Discoveries
                  </Text>
                </View>

                {recentResults.map((song, index) => (
                  <TouchableOpacity
                    key={song.id}
                    style={styles.recentSongItem}
                    onPress={() => navigation.navigate("Library")}
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
                          <Ionicons
                            name="musical-notes"
                            size={16}
                            color={Colors.lightGreen}
                          />
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
                      <Ionicons
                        name="play"
                        size={14}
                        color={Colors.lightGreen}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => navigation.navigate("Library")}
                  style={styles.learnMoreButtonBottom}
                >
                  <Text style={styles.learnMoreTextBottom}>Learn more</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.lightGreen}
                  />
                </TouchableOpacity>
              </BlurView>
            </View>
          )}
        </ScrollView>

        {/* Custom Scroll Bar */}
        {contentHeight > containerHeight && (
          <View style={styles.customScrollBar}>
            <View style={styles.scrollTrack}>
              <View
                style={[
                  styles.scrollThumb,
                  {
                    height: `${Math.max(
                      10,
                      (containerHeight / contentHeight) * 100
                    )}%`,
                    top: `${
                      scrollProgress *
                      (100 -
                        Math.max(10, (containerHeight / contentHeight) * 100))
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Song Results Modal */}
        <SongResultModal
          visible={showResults}
          results={songResults}
          onSelectSong={handleSongSelect}
          onRetry={handleRetryRecording}
          onClose={() => setShowResults(false)}
          onPlaySong={handlePlaySong}
          onDownloadMidi={handleMidiDownload}
          navigation={navigation}
        />

        {/* No Song Found Modal */}
        <NoSongFoundModal
          visible={showNoSongFoundModal}
          onTryAgain={handleNoSongTryAgain}
          onGotIt={handleNoSongGotIt}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={async (newTier) => {
            setShowUpgradeModal(false);
            await loadSubscriptionStatus();
          }}
          currentTier={subscriptionStatus?.tier}
          reason={upgradeReason}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  userInfo: {
    flex: 1,
    maxWidth: "60%", // Reduce width to make it more compact
  },
  userCard: {
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12, // Slightly smaller font
    color: Colors.lightGray,
    opacity: 0.8,
  },
  userName: {
    fontSize: 16, // Reduce font size to fit better
    fontWeight: "bold",
    color: Colors.white,
    marginTop: 1, // Reduce margin
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    zIndex: 10, // Ensure buttons are above other elements
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Ensure background visibility
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 0, // Override GlassStyles padding
    paddingHorizontal: 0, // Override GlassStyles padding
  }, // Fixed navigation icon visibility
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    ...(Platform.OS === "web" && {
      // Custom scroll bar styling for web
      scrollbarWidth: "thin",
      scrollbarColor: `${Colors.lightGreen} rgba(255, 255, 255, 0.1)`,
    }),
  },
  mainContentContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 40,
    minHeight: height - 200, // Ensure minimum height to enable scrolling
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: "center",
    opacity: 0.8,
  },
  scrollHintSubtext: {
    fontSize: 14,
    color: Colors.lightGreen,
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
    fontStyle: "italic",
  },
  recordContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },
  recordButtonOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.5)",
  },
  recordingButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  instructionsContainer: {
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 0, // Ensure no extra padding
  },
  instructionsCard: {
    padding: 20,
    margin: 0, // Override GlassStyles margin to prevent overflow
    borderRadius: 16, // Maintain consistent border radius
    overflow: "hidden", // Prevent content overflow
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.lightGray,
    marginLeft: 12,
    flex: 1,
  },
  recentResultsContainer: {
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 0, // Ensure no extra padding
  },
  recentResultsCard: {
    padding: 16,
    margin: 0, // Override GlassStyles margin to prevent overflow
    borderRadius: 16, // Maintain consistent border radius
    overflow: "hidden", // Prevent content overflow
  }, // Fixed overflow issues
  recentResultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentResultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  learnMoreText: {
    fontSize: 14,
    color: Colors.lightGreen,
    marginRight: 4,
    fontWeight: "600",
  },
  learnMoreButtonBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  learnMoreTextBottom: {
    fontSize: 14,
    color: Colors.lightGreen,
    marginRight: 4,
    fontWeight: "600",
  },
  recentSongItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  recentSongInfo: {
    flex: 1,
    marginRight: 12,
  },
  recentSongName: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  customScrollBar: {
    position: "absolute",
    right: 5,
    top: 100,
    bottom: 100,
    width: 20,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollTrack: {
    width: 12,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    position: "relative",
  },
  scrollThumb: {
    position: "absolute",
    width: "100%",
    backgroundColor: Colors.lightGreen,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.5)",
    shadowColor: Colors.lightGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 30,
  },
  usageIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  inlineUsageIndicator: {
    alignItems: "center",
    marginLeft: 8,
  },
  usageCard: {
    ...GlassStyles.container,
    padding: 8,
    minWidth: 100,
    borderRadius: 12,
    alignItems: "center",
  },
  usageInfo: {
    alignItems: "center",
  },
  usageText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
  },
  usageLabel: {
    fontSize: 8,
    color: Colors.white,
    opacity: 0.7,
    marginTop: 1,
    textAlign: "center",
  },
  tierBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
    minWidth: 30,
    alignItems: "center",
  },
  tierText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
});

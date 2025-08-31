import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../styles/Colors";
import { GlassStyles } from "../styles/GlassStyles";
import StarRating from "../components/StarRating";
import { FeedbackService } from "../services/FeedbackService";
import {
  UserPreferencesService,
  PROFICIENCY_CONFIG,
} from "../services/UserPreferencesService";
import { MidiPlaybackService } from "../services/MidiPlaybackService";
import { SubscriptionService } from "../services/SubscriptionService";

const { width } = Dimensions.get("window");

// Helper function to generate fallback data based on proficiency level
const generateFallbackData = (song, config) => {
  const basicChords = ["C", "Am", "F", "G"];
  const intermediateChords = ["C", "Am7", "F", "G", "Dm", "Em", "F/C", "G/B"];
  const advancedChords = [
    "Cmaj7",
    "Am7",
    "Fmaj7",
    "G7",
    "Dm7",
    "Em7",
    "F/C",
    "G/B",
    "Bb",
    "Cmaj9",
  ];

  let chordsToUse = basicChords;
  if (config?.showAdvancedChords) {
    chordsToUse =
      config.maxChordsDisplayed > 6 ? advancedChords : intermediateChords;
  }

  const numBars = Math.min(config?.maxChordsDisplayed || 4, 8);
  const bars = [];

  for (let i = 0; i < numBars; i++) {
    const chordIndex = i % chordsToUse.length;
    bars.push({
      id: i,
      startTime: i * 8,
      endTime: (i + 1) * 8,
      chord: song.chords?.[chordIndex] || chordsToUse[chordIndex],
      lyrics: config?.showBasicNotation
        ? `Measure ${i + 1} lyrics...`
        : `Sample lyrics for bar ${i + 1}...`,
      section: i < 2 ? "Verse 1" : i < 4 ? "Chorus" : "Verse 2",
      theory: config?.showComplexAnalysis
        ? {
            key: "C major",
            function: getRomanNumeral(chordsToUse[chordIndex], "C"),
            tension: getTensionLevel(chordsToUse[chordIndex]),
          }
        : null,
      timing: config?.showDetailedTiming
        ? {
            beat: "4/4",
            tempo: "120 BPM",
            subdivision: "quarter notes",
          }
        : null,
    });
  }

  return {
    midiFile: {
      id: song.id || "1",
      name: `${song.name} - Backing Track`,
      filename: `${
        song.name?.replace(/[^a-z0-9]/gi, "_") || "song"
      }_backing_track.mid`,
      size: "45 KB",
      downloadUrl: `http://localhost:5001/static/midi/${
        song.name?.replace(/[^a-z0-9]/gi, "_") || "fallback"
      }_backing_track.mid`,
      tempo_bpm: 120,
      num_measures: numBars,
      tracks: ["drums", "bass", "piano"],
    },
    bars,
    sections: config?.showComplexAnalysis
      ? ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Outro"]
      : ["Verse", "Chorus"],
  };
};

// Helper function to adapt existing analysis data for proficiency level
const adaptAnalysisForProficiency = (analysisData, config) => {
  if (!analysisData || !config) return analysisData;

  const adaptedBars = analysisData.bars
    ?.slice(0, config.maxChordsDisplayed || 4)
    .map((bar) => ({
      ...bar,
      theory: config.showComplexAnalysis
        ? {
            key: "C major", // You could analyze this from the chord
            function: getRomanNumeral(bar.chord, "C"),
            tension: getTensionLevel(bar.chord),
          }
        : null,
      timing: config.showDetailedTiming
        ? {
            beat: "4/4",
            tempo: "120 BPM",
            subdivision: "quarter notes",
          }
        : null,
    }));

  return {
    ...analysisData,
    bars: adaptedBars,
  };
};

// Helper function to get Roman numeral analysis
const getRomanNumeral = (chord, key) => {
  const romanNumerals = {
    C: "I",
    Cmaj7: "Imaj7",
    Cmaj9: "Imaj9",
    Am: "vi",
    Am7: "vi7",
    F: "IV",
    Fmaj7: "IVmaj7",
    "F/C": "IV/5",
    G: "V",
    G7: "V7",
    "G/B": "V/3",
    Dm: "ii",
    Dm7: "ii7",
    Em: "iii",
    Em7: "iii7",
    Bb: "bVII",
  };
  return romanNumerals[chord] || chord;
};

// Helper function to determine tension level
const getTensionLevel = (chord) => {
  if (chord.includes("7") || chord.includes("9")) return "high";
  if (chord.includes("m") || chord.includes("/")) return "medium";
  return "low";
};

// Helper function to get tension color
const getTensionColor = (tension) => {
  switch (tension) {
    case "high":
      return Colors.red + "80";
    case "medium":
      return Colors.orange + "80";
    case "low":
      return Colors.lightGreen + "80";
    default:
      return Colors.gray + "80";
  }
};

export default function MusicAnalysisScreen({ route, navigation }) {
  const { song } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(233); // 3:53 in seconds
  const [currentBar, setCurrentBar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [musicData, setMusicData] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [proficiencyConfig, setProficiencyConfig] = useState(null);

  // MIDI playback state
  const [isMidiPlaying, setIsMidiPlaying] = useState(false);
  const [midiLoading, setMidiLoading] = useState(false);
  const [midiLoaded, setMidiLoaded] = useState(false);
  const [midiCurrentTime, setMidiCurrentTime] = useState(0);
  const [midiDuration, setMidiDuration] = useState(0);
  const [midiError, setMidiError] = useState(null);

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const playbackInterval = useRef(null);
  const midiStatusInterval = useRef(null);
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
      if (midiStatusInterval.current) {
        clearInterval(midiStatusInterval.current);
      }
      // Cleanup MIDI player when component unmounts
      MidiPlaybackService.cleanupMidiPlayer(song.id);
    };
  }, []);

  const loadMusicData = async () => {
    try {
      // Load user proficiency level
      const userProficiency =
        await UserPreferencesService.getProficiencyLevel();
      const config =
        UserPreferencesService.getProficiencyConfig(userProficiency);
      setProficiencyConfig(config);

      // Load existing rating for this song
      const existingRating = await FeedbackService.getRating(
        song.id || song.name
      );
      if (existingRating) {
        setUserRating(existingRating.rating);
      }

      // Use the analysis data that was already fetched during song identification
      // No need for a separate API call since your backend returns everything together
      if (song.analysisData) {
        // Adapt the analysis data based on proficiency level
        const adaptedData = adaptAnalysisForProficiency(
          song.analysisData,
          config
        );
        setMusicData(adaptedData);
      } else {
        // Fallback for songs that don't have analysis data (like library songs)
        // Generate basic analysis data structure for existing songs
        const fallbackData = generateFallbackData(song, config);
        setMusicData(fallbackData);
      }
    } catch (error) {
      console.error("Failed to load music data:", error);
      Alert.alert("Error", "Failed to load music analysis data");
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
        setCurrentTime((prevTime) => {
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
            const bar = musicData.bars.find(
              (bar) => newTime >= bar.startTime && newTime < bar.endTime
            );
            if (bar && bar.id !== currentBar) {
              setCurrentBar(bar.id);
              // Auto-scroll to current bar
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  y: bar.id * 120, // Approximate height per bar
                  animated: true,
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Audio playback functions
  const loadMidiFile = async () => {
    try {
      if (!musicData?.audioFile?.downloadUrl) {
        setMidiError("No audio file available");
        return;
      }

      setMidiLoading(true);
      setMidiError(null);

      console.log("Loading audio file:", musicData.audioFile.downloadUrl);

      // Download and load audio file
      const localPath = await MidiPlaybackService.downloadMidiFile(
        musicData.audioFile,
        song.id
      );

      await MidiPlaybackService.loadMidiFile(localPath, song.id);

      // Set up status update callback
      MidiPlaybackService.setPlaybackStatusUpdate(song.id, (status) => {
        setIsMidiPlaying(status.isPlaying);
        setMidiCurrentTime(status.positionMillis / 1000);
        setMidiDuration(status.durationMillis / 1000);

        // Update chord progression based on MIDI playback time
        if (status.isPlaying && musicData) {
          const currentSeconds = status.positionMillis / 1000;
          const bar = musicData.bars.find(
            (bar) =>
              currentSeconds >= bar.startTime && currentSeconds < bar.endTime
          );
          if (bar && bar.id !== currentBar) {
            setCurrentBar(bar.id);
            // Auto-scroll to current bar
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({
                y: bar.id * 120,
                animated: true,
              });
            }, 100);
          }
        }
      });

      setMidiLoaded(true);
      setMidiLoading(false);
      console.log("MIDI file loaded successfully");
    } catch (error) {
      console.error("Error loading MIDI file:", error);
      setMidiError(error.message);
      setMidiLoading(false);

      if (error.message.includes("Premium subscription required")) {
        Alert.alert(
          "Premium Required",
          "MIDI playback requires a Premium subscription. Upgrade to unlock backing tracks and enhanced features.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to load MIDI file. Please try again.");
      }
    }
  };

  const handleMidiPlayPause = async () => {
    try {
      if (!midiLoaded) {
        await loadMidiFile();
        return;
      }

      if (isMidiPlaying) {
        await MidiPlaybackService.pauseMidi(song.id);
        setIsMidiPlaying(false);
      } else {
        await MidiPlaybackService.playMidi(song.id);
        setIsMidiPlaying(true);
      }
    } catch (error) {
      console.error("Error controlling MIDI playback:", error);
      Alert.alert(
        "Error",
        "Failed to control MIDI playback. Please try again."
      );
    }
  };

  const handleMidiSeek = async (barId) => {
    try {
      if (!midiLoaded || !musicData) return;

      const bar = musicData.bars[barId];
      if (bar) {
        const positionMs = bar.startTime * 1000;
        await MidiPlaybackService.setPosition(song.id, positionMs);
        setMidiCurrentTime(bar.startTime);
        setCurrentBar(barId);
      }
    } catch (error) {
      console.error("Error seeking MIDI:", error);
    }
  };

  const handleMidiDownload = async () => {
    try {
      if (!musicData?.audioFile) {
        Alert.alert("Error", "No audio file available for download.");
        return;
      }

      await MidiPlaybackService.downloadMidiForUser(
        musicData.audioFile,
        song.name
      );
    } catch (error) {
      console.error("Error downloading MIDI:", error);
      Alert.alert("Error", "Failed to download MIDI file. Please try again.");
    }
  };

  const testMidiDownload = async () => {
    try {
      console.log("Testing MIDI download functionality...");
      const result = await MidiPlaybackService.testMidiDownload();
      Alert.alert("Test Result", result);
    } catch (error) {
      console.error("Test error:", error);
      Alert.alert("Test Failed", error.message);
    }
  };

  const upgradeToPremiumForTesting = async () => {
    try {
      console.log("Upgrading to Premium for testing...");
      const success = await SubscriptionService.setSubscriptionTierForTesting();
      if (success) {
        Alert.alert(
          "Success",
          "Temporarily upgraded to Premium for testing. Try downloading MIDI now!"
        );
      } else {
        Alert.alert("Error", "Failed to upgrade subscription for testing");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      Alert.alert("Error", error.message);
    }
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
          analysisType: "music_analysis",
        }
      );

      if (success) {
        console.log(`User rated "${songTitle}" with ${rating} stars`);

        // Show brief success feedback
        Alert.alert(
          "Thank you!",
          `Your ${rating}-star rating helps us improve the music analysis quality.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert("Error", "Failed to save your rating. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save rating:", error);
      Alert.alert("Error", "Failed to save your rating. Please try again.");
    }
  };

  const renderProgressBar = () => {
    const progress = currentTime / duration;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    );
  };

  const renderMidiProgressBar = () => {
    const progress = midiDuration > 0 ? midiCurrentTime / midiDuration : 0;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: isMidiPlaying
                  ? Colors.purple
                  : Colors.lightGreen,
              },
            ]}
          />
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>{formatTime(midiCurrentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(midiDuration)}</Text>
        </View>
        <View style={styles.midiProgressInfo}>
          <Text style={styles.midiProgressText}>
            {isMidiPlaying ? "🎵 Playing" : "⏸️ Paused"} • MIDI Backing Track
          </Text>
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
          isActive && styles.activeBar,
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (midiLoaded && isMidiPlaying) {
              handleMidiSeek(bar.id);
            } else {
              handleSeek(bar.id);
            }
          }}
          activeOpacity={0.8}
          style={styles.barContent}
        >
          {/* Bar Header */}
          <View style={styles.barHeader}>
            <View style={styles.barInfo}>
              <Text style={styles.barNumber}>
                {proficiencyConfig?.showBasicNotation
                  ? `Measure ${bar.id + 1}`
                  : `Bar ${bar.id + 1}`}
              </Text>
              {proficiencyConfig?.showComplexAnalysis && bar.theory && (
                <Text style={styles.theoryText}>
                  {bar.theory.function} • {bar.theory.key}
                </Text>
              )}
            </View>

            <View style={styles.chordContainer}>
              <Text
                style={[styles.chordText, isActive && styles.activeChordText]}
              >
                {bar.chord}
              </Text>
              {proficiencyConfig?.showComplexAnalysis && bar.theory && (
                <View
                  style={[
                    styles.tensionIndicator,
                    { backgroundColor: getTensionColor(bar.theory.tension) },
                  ]}
                >
                  <Text style={styles.tensionText}>{bar.theory.tension}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Lyrics */}
          <View style={styles.lyricsContainer}>
            <Text
              style={[styles.lyricsText, isActive && styles.activeLyricsText]}
            >
              {bar.lyrics}
            </Text>
          </View>

          {/* Timing Information (Advanced users only) */}
          {proficiencyConfig?.showDetailedTiming && bar.timing && (
            <View style={styles.timingContainer}>
              <View style={styles.timingItem}>
                <Ionicons name="time" size={14} color={Colors.gray} />
                <Text style={styles.timingText}>{bar.timing.beat}</Text>
              </View>
              <View style={styles.timingItem}>
                <Ionicons name="speedometer" size={14} color={Colors.gray} />
                <Text style={styles.timingText}>{bar.timing.tempo}</Text>
              </View>
              <View style={styles.timingItem}>
                <Ionicons name="musical-note" size={14} color={Colors.gray} />
                <Text style={styles.timingText}>{bar.timing.subdivision}</Text>
              </View>
            </View>
          )}

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
                          transform: [
                            {
                              scaleY: progressAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.3, 1],
                                extrapolate: "clamp",
                              }),
                            },
                          ],
                        },
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
            <BlurView
              intensity={20}
              style={[styles.loadingCard, GlassStyles.glassCard]}
            >
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Music Analysis
          </Text>
          {proficiencyConfig && (
            <View
              style={[
                styles.proficiencyBadge,
                { borderColor: proficiencyConfig.color },
              ]}
            >
              <Text
                style={[
                  styles.proficiencyText,
                  { color: proficiencyConfig.color },
                ]}
              >
                {proficiencyConfig.label}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMidiDownload}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={Colors.lightGreen}
            />
          </TouchableOpacity>
        </View>

        {/* Song Info */}
        <BlurView
          intensity={15}
          style={[styles.songInfoCard, GlassStyles.glassCard]}
        >
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.name}
          </Text>
          <Text style={styles.artistName}>by {song.singerName}</Text>
          <Text style={styles.albumName}>from "{song.album}"</Text>
        </BlurView>

        {/* Player Control */}
        <BlurView
          intensity={15}
          style={[styles.playerCard, GlassStyles.glassCard]}
        >
          <TouchableOpacity
            style={[styles.playButton, midiLoading && styles.loadingButton]}
            onPress={handleMidiPlayPause}
            activeOpacity={0.8}
            disabled={midiLoading}
          >
            <LinearGradient
              colors={
                midiError
                  ? [Colors.red, "#dc2626"]
                  : midiLoading
                  ? [Colors.gray, "#6b7280"]
                  : isMidiPlaying
                  ? [Colors.purple, "#7c3aed"]
                  : [Colors.lightGreen, "#059669"]
              }
              style={styles.playButtonGradient}
            >
              {midiLoading ? (
                <Ionicons name="hourglass" size={24} color={Colors.white} />
              ) : midiError ? (
                <Ionicons name="alert-circle" size={24} color={Colors.white} />
              ) : (
                <Ionicons
                  name={isMidiPlaying ? "pause" : "play"}
                  size={24}
                  color={Colors.white}
                />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.playerInfo}>
            <Text style={styles.playerTitle}>
              {midiError
                ? "MIDI Error"
                : midiLoading
                ? "Loading MIDI..."
                : "MIDI Guide Track"}
            </Text>
            <Text style={styles.playerSubtitle}>
              {midiError
                ? midiError
                : musicData?.audioFile
                ? `${musicData.audioFile.name} • ${
                    musicData.audioFile.size
                  } • ${musicData.audioFile.format || "M4A"}`
                : "No audio file available"}
            </Text>
            {midiLoaded && !midiError && (
              <Text
                style={[
                  styles.playerTracks,
                  {
                    color: musicData?.audioFile
                      ? Colors.lightGreen
                      : Colors.orange,
                    fontSize: 12,
                  },
                ]}
              >
                {musicData?.audioFile
                  ? "🎵 YouTube audio backing track"
                  : "⚠️ No audio file available"}
              </Text>
            )}
            {midiLoaded && musicData?.audioFile && (
              <Text style={styles.playerTracks}>
                Source:{" "}
                {musicData.audioFile.youtube_source?.title || "YouTube Audio"}
              </Text>
            )}
          </View>

          {midiLoaded && !midiError && (
            <TouchableOpacity
              style={styles.reloadButton}
              onPress={loadMidiFile}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color={Colors.lightGreen} />
            </TouchableOpacity>
          )}

          {/* Debug Test Button */}
          <TouchableOpacity
            style={[styles.reloadButton, { marginLeft: 8 }]}
            onPress={testMidiDownload}
            activeOpacity={0.8}
          >
            <Ionicons name="bug" size={20} color={Colors.orange} />
          </TouchableOpacity>

          {/* Premium Upgrade Button (Development Only) */}
          <TouchableOpacity
            style={[
              styles.reloadButton,
              { marginLeft: 8, backgroundColor: Colors.orange },
            ]}
            onPress={upgradeToPremiumForTesting}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={20} color={Colors.white} />
          </TouchableOpacity>
        </BlurView>

        {/* Progress Bar - Show MIDI progress when available */}
        {midiLoaded && midiDuration > 0
          ? renderMidiProgressBar()
          : renderProgressBar()}

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  proficiencyBadge: {
    position: "absolute",
    top: 45,
    left: "50%",
    transform: [{ translateX: -40 }],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: Colors.black + "60",
  },
  proficiencyText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: "500",
  },
  songInfoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  songTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 6,
  },
  artistName: {
    fontSize: 14,
    color: Colors.lightGreen,
    textAlign: "center",
    marginBottom: 2,
  },
  albumName: {
    fontSize: 12,
    color: Colors.lightGray,
    textAlign: "center",
    opacity: 0.8,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 16,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playerInfo: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.lightGreen,
    borderRadius: 2,
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activeBar: {
    borderColor: "rgba(16, 185, 129, 0.4)",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  barInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  barNumber: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
    marginRight: 12,
  },
  chordContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  chordText: {
    fontSize: 18,
    fontWeight: "bold",
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
    fontWeight: "500",
  },
  timeIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeIndicatorText: {
    fontSize: 11,
    color: Colors.lightGray,
    opacity: 0.6,
  },
  playingIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
  },
  // New styles for proficiency-based features
  theoryText: {
    fontSize: 10,
    color: Colors.gray,
    marginLeft: 8,
    fontStyle: "italic",
  },
  tensionIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: "center",
  },
  tensionText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  timingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.black + "20",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  timingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timingText: {
    fontSize: 10,
    color: Colors.gray,
  },
  bottomPadding: {
    height: 20,
  },
  // MIDI-related styles
  loadingButton: {
    opacity: 0.6,
  },
  playerTracks: {
    fontSize: 10,
    color: Colors.lightGray,
    opacity: 0.8,
    marginTop: 2,
  },
  reloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  midiProgressInfo: {
    marginTop: 8,
    alignItems: "center",
  },
  midiProgressText: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
    textAlign: "center",
  },
});

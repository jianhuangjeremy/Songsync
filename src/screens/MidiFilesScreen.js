import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';

const { width } = Dimensions.get('window');

export default function MidiFilesScreen({ route, navigation }) {
  const { song } = route.params;
  const [midiFiles, setMidiFiles] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({});

  useEffect(() => {
    loadMidiFiles();
  }, []);

  const loadMidiFiles = async () => {
    try {
      // Simulate API call to get audio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock audio data
      const mockMidiFiles = [
        {
          id: '1',
          name: 'Full Track',
          type: 'Complete',
          size: '45 KB',
          duration: '03:53',
          instruments: ['Piano', 'Guitar', 'Drums', 'Bass'],
          downloadUrl: 'https://example.com/midi/full-track.mid',
        },
        {
          id: '2',
          name: 'Piano Only',
          type: 'Piano',
          size: '12 KB',
          duration: '03:53',
          instruments: ['Piano'],
          downloadUrl: 'https://example.com/midi/piano-only.mid',
        },
        {
          id: '3',
          name: 'Guitar Tabs',
          type: 'Guitar',
          size: '18 KB',
          duration: '03:53',
          instruments: ['Guitar'],
          downloadUrl: 'https://example.com/midi/guitar-tabs.mid',
        },
        {
          id: '4',
          name: 'Drum Track',
          type: 'Drums',
          size: '8 KB',
          duration: '03:53',
          instruments: ['Drums'],
          downloadUrl: 'https://example.com/midi/drums.mid',
        },
        {
          id: '5',
          name: 'Bass Line',
          type: 'Bass',
          size: '6 KB',
          duration: '03:53',
          instruments: ['Bass'],
          downloadUrl: 'https://example.com/midi/bass-line.mid',
        },
        {
          id: '6',
          name: 'Melody Only',
          type: 'Melody',
          size: '10 KB',
          duration: '03:53',
          instruments: ['Synth Lead'],
          downloadUrl: 'https://example.com/midi/melody.mid',
        },
      ];
      
      setMidiFiles(mockMidiFiles);
    } catch (error) {
      console.error('Failed to load audio:', error);
      Alert.alert('Error', 'Failed to load audio');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMidi = (midiFile) => {
    if (currentlyPlaying?.id === midiFile.id) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(midiFile);
      // In a real app, this would start MIDI playback
      Alert.alert(
        'MIDI Playback',
        `Playing "${midiFile.name}" - ${midiFile.type} track`
      );
    }
  };

  const handleDownloadMidi = async (midiFile) => {
    try {
      setDownloadProgress({ ...downloadProgress, [midiFile.id]: 0 });
      
      // Simulate download progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setDownloadProgress({ ...downloadProgress, [midiFile.id]: progress });
      }
      
      Alert.alert('Download Complete', `"${midiFile.name}" has been downloaded`);
      setDownloadProgress({ ...downloadProgress, [midiFile.id]: undefined });
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Failed', 'Failed to download audio');
      setDownloadProgress({ ...downloadProgress, [midiFile.id]: undefined });
    }
  };

  const getInstrumentIcon = (instrument) => {
    switch (instrument.toLowerCase()) {
      case 'piano': return 'musical-note';
      case 'guitar': return 'radio';
      case 'drums': return 'disc';
      case 'bass': return 'pulse';
      default: return 'musical-notes';
    }
  };

  const renderMidiCard = (midiFile) => {
    const isPlaying = currentlyPlaying?.id === midiFile.id;
    const progress = downloadProgress[midiFile.id];
    const isDownloading = progress !== undefined;
    
    return (
      <BlurView 
        key={midiFile.id} 
        intensity={15} 
        style={[
          styles.midiCard, 
          GlassStyles.glassCard,
          isPlaying && styles.playingCard
        ]}
      >
        {/* Header */}
        <View style={styles.midiHeader}>
          <View style={styles.midiInfo}>
            <Text style={[styles.midiName, isPlaying && styles.playingText]} numberOfLines={1}>
              {midiFile.name}
            </Text>
            <Text style={styles.midiType}>{midiFile.type} • {midiFile.size}</Text>
          </View>
          
          <View style={styles.midiActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePlayMidi(midiFile)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isPlaying ? "pause-circle" : "play-circle"} 
                size={32} 
                color={isPlaying ? Colors.lightGreen : Colors.white} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, isDownloading && styles.disabledButton]}
              onPress={() => !isDownloading && handleDownloadMidi(midiFile)}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              {isDownloading ? (
                <View style={styles.downloadProgress}>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              ) : (
                <Ionicons name="download-outline" size={24} color={Colors.purple} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Instruments */}
        <View style={styles.instrumentsContainer}>
          <Text style={styles.instrumentsLabel}>Instruments:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.instrumentsScroll}
          >
            {midiFile.instruments.map((instrument, index) => (
              <View key={index} style={styles.instrumentTag}>
                <Ionicons 
                  name={getInstrumentIcon(instrument)} 
                  size={14} 
                  color={Colors.lightGreen} 
                />
                <Text style={styles.instrumentText}>{instrument}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.midiFooter}>
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={16} color={Colors.lightGray} />
            <Text style={styles.durationText}>{midiFile.duration}</Text>
          </View>
          
          {isPlaying && (
            <View style={styles.playingIndicator}>
              <View style={styles.waveform}>
                {[...Array(5)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveBar,
                      { animationDelay: `${i * 0.1}s` }
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.playingLabel}>Now Playing</Text>
            </View>
          )}
        </View>
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
              <Text style={styles.loadingText}>Loading Audio...</Text>
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
          <Text style={styles.headerTitle} numberOfLines={1}>Audio</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => Alert.alert('Info', 'Audio for instrumental practice')}
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.lightGreen} />
          </TouchableOpacity>
        </View>

        {/* Song Info */}
        <BlurView intensity={15} style={[styles.songInfoCard, GlassStyles.glassCard]}>
          <Text style={styles.songTitle} numberOfLines={1}>{song.name}</Text>
          <Text style={styles.artistName}>by {song.singerName}</Text>
          <Text style={styles.albumName}>from "{song.album}"</Text>
        </BlurView>

        {/* Files List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filesContainer}>
            {midiFiles.map(renderMidiCard)}
          </View>
          
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
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 16,
    color: Colors.lightGreen,
    textAlign: 'center',
    marginBottom: 4,
  },
  albumName: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  filesContainer: {
    paddingHorizontal: 16,
  },
  midiCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playingCard: {
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
  midiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  midiInfo: {
    flex: 1,
    marginRight: 16,
  },
  midiName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  playingText: {
    color: Colors.lightGreen,
  },
  midiType: {
    fontSize: 14,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  midiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  downloadProgress: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.lightGreen,
  },
  instrumentsContainer: {
    marginBottom: 16,
  },
  instrumentsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  instrumentsScroll: {
    flexGrow: 0,
  },
  instrumentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  instrumentText: {
    fontSize: 12,
    color: Colors.lightGreen,
    marginLeft: 4,
    fontWeight: '500',
  },
  midiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: Colors.lightGray,
    marginLeft: 4,
    opacity: 0.8,
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
    opacity: 0.7,
  },
  playingLabel: {
    fontSize: 12,
    color: Colors.lightGreen,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

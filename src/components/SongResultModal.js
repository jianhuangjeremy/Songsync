import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';

const { width, height } = Dimensions.get('window');

export default function SongResultModal({ 
  visible, 
  results, 
  onSelectSong, 
  onRetry, 
  onClose 
}) {
  const formatDuration = (duration) => {
    return duration || 'Unknown';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.9) return Colors.lightGreen;
    if (confidence > 0.7) return Colors.purple;
    return Colors.gray;
  };

  const getConfidenceText = (confidence) => {
    if (confidence > 0.9) return 'High';
    if (confidence > 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          style={styles.modalBackground}
        >
          <BlurView intensity={20} style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {results.length > 1 ? 'Song Matches Found' : 'Song Identified'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.lightGray} />
              </TouchableOpacity>
            </View>

            {/* Results */}
            <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
              {results.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="musical-notes-outline" size={60} color={Colors.gray} />
                  <Text style={styles.noResultsText}>No songs identified</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try recording in a quieter environment or closer to the music source
                  </Text>
                </View>
              ) : (
                results.map((song, index) => (
                  <TouchableOpacity
                    key={song.id || index}
                    style={[styles.songCard, GlassStyles.glassCard]}
                    onPress={() => onSelectSong(song)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.songCardHeader}>
                      <View style={styles.songInfo}>
                        <Text style={styles.songName}>{song.name}</Text>
                        <Text style={styles.artistName}>by {song.singerName}</Text>
                        <Text style={styles.albumName}>from "{song.album}"</Text>
                      </View>
                      <View style={styles.songMeta}>
                        <View style={[
                          styles.confidenceBadge,
                          { backgroundColor: `${getConfidenceColor(song.confidence)}20` }
                        ]}>
                          <Text style={[
                            styles.confidenceText,
                            { color: getConfidenceColor(song.confidence) }
                          ]}>
                            {getConfidenceText(song.confidence)} Match
                          </Text>
                        </View>
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={Colors.lightGreen} 
                        />
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.songDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={16} color={Colors.purple} />
                        <Text style={styles.detailText}>{formatDuration(song.duration)}</Text>
                      </View>
                      
                      {song.genre && (
                        <View style={styles.detailItem}>
                          <Ionicons name="library-outline" size={16} color={Colors.purple} />
                          <Text style={styles.detailText}>{song.genre}</Text>
                        </View>
                      )}
                      
                      {song.year && (
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.purple} />
                          <Text style={styles.detailText}>{song.year}</Text>
                        </View>
                      )}
                      
                      <View style={styles.detailItem}>
                        <Ionicons name="musical-note" size={16} color={Colors.lightGreen} />
                        <Text style={styles.detailText}>Chords Available</Text>
                      </View>
                      
                      <View style={styles.detailItem}>
                        <Ionicons name="documents-outline" size={16} color={Colors.lightGreen} />
                        <Text style={styles.detailText}>MIDI Files</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={Colors.purple} />
                <Text style={[styles.actionButtonText, { color: Colors.purple }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
              
              {results.length > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.lightGreen} />
                  <Text style={[styles.actionButtonText, { color: Colors.lightGreen }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.glass,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    paddingBottom: 34, // Safe area padding
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  closeButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  songCard: {
    marginVertical: 8,
    padding: 16,
  },
  songCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 16,
  },
  songName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    color: Colors.lightGreen,
    marginBottom: 2,
  },
  albumName: {
    fontSize: 14,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  songMeta: {
    alignItems: 'center',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  songDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.lightGray,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  saveButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

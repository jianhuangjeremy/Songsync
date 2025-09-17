// Fixed overflow issues - Cleaned up header with simple button styles to remove duplicate elements
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { getLibrary, removeSongFromLibrary, updatePlayCount } from '../services/MusicService';

export default function LibraryScreen({ navigation }) {
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const userLibrary = await getLibrary(user.id);
      setLibrary(userLibrary);
    } catch (error) {
      console.error('Error loading library:', error);
      Alert.alert('Error', 'Failed to load your library');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLibrary();
  };

  const handleSongPlay = async (song) => {
    try {
      // Update play count
      await updatePlayCount(song.id, user.id);
      
      // Reload library to reflect updated play count
      loadLibrary();
      
      // In a real app, you would integrate with a music streaming service
      Alert.alert(
        'Playing Song',
        `Now playing: "${song.name}" by ${song.singerName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Error', 'Failed to play song');
    }
  };

  const handleRemoveSong = (song) => {
    Alert.alert(
      'Remove Song',
      `Are you sure you want to remove "${song.name}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeSong(song) },
      ]
    );
  };

  const removeSong = async (song) => {
    try {
      await removeSongFromLibrary(song.id, user.id);
      setLibrary(prevLibrary => prevLibrary.filter(item => item.id !== song.id));
    } catch (error) {
      console.error('Error removing song:', error);
      Alert.alert('Error', 'Failed to remove song');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPlayCount = (count) => {
    if (!count || count === 0) return 'Never played';
    if (count === 1) return 'Played once';
    return `Played ${count} times`;
  };

  const handleDiscordPress = async () => {
    const discordUrl = 'https://discord.com/channels/1415944429054722051/1415944791786782732';
    
    try {
      const supported = await Linking.canOpenURL(discordUrl);
      if (supported) {
        await Linking.openURL(discordUrl);
      } else {
        Alert.alert(
          'Discord Community',
          'Join our Discord community to connect with other music enthusiasts!\n\n' + discordUrl,
          [
            { text: 'Copy Link', onPress: () => {
              // In a real app, you'd use a clipboard library
              Alert.alert('Discord Link', discordUrl);
            }},
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening Discord link:', error);
      Alert.alert('Error', 'Could not open Discord. Please try again later.');
    }
  };

  const renderSongItem = ({ item: song }) => (
    <BlurView intensity={15} style={[styles.songCard, GlassStyles.glassCard]}>
      <TouchableOpacity
        style={styles.songContent}
        onPress={() => handleSongPlay(song)}
        activeOpacity={0.8}
      >
        {/* Album Cover with Play Button */}
        <TouchableOpacity
          style={styles.albumCoverContainer}
          onPress={() => handleSongPlay(song)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: song.albumCover || 'https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=♪' }}
            style={styles.albumCover}
            defaultSource={{ uri: 'https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=♪' }}
          />
          <View style={styles.albumCoverOverlay}>
            <View style={styles.playButtonOverlay}>
              <View style={styles.playIconContainer}>
                <Ionicons name="play" size={18} color={Colors.white} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Song Info */}
        <View style={styles.songInfo}>
          <Text style={styles.songName} numberOfLines={1}>{song.name}</Text>
          <Text style={styles.artistName}>{song.singerName}</Text>
          <Text style={styles.albumName}>{song.album}</Text>
          
          <View style={styles.songMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.purple} />
              <Text style={styles.metaText}>Added {formatDate(song.addedAt)}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="play-outline" size={14} color={Colors.lightGreen} />
              <Text style={styles.metaText}>{formatPlayCount(song.playCount)}</Text>
            </View>
          </View>

          {/* Music Analysis Button */}
          <TouchableOpacity
            style={styles.analysisButton}
            onPress={() => navigation.navigate('MusicAnalysis', { song })}
            activeOpacity={0.8}
          >
            <Ionicons name="analytics-outline" size={16} color={Colors.lightGreen} />
            <Text style={styles.analysisButtonText}>Music Chords</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.lightGreen} />
          </TouchableOpacity>
        </View>

        {/* Song Actions */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveSong(song)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.purple} />
        </TouchableOpacity>
      </TouchableOpacity>
    </BlurView>
  );

  const renderEmptyLibrary = () => (
    <View style={styles.emptyContainer}>
      <BlurView intensity={15} style={[styles.emptyCard, GlassStyles.glassContainer]}>
        <Ionicons name="musical-notes-outline" size={80} color={Colors.gray} />
        <Text style={styles.emptyTitle}>Your Library is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Start identifying songs to build your music library
        </Text>
        <TouchableOpacity
          style={[styles.startButton, GlassStyles.glassButton]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="mic" size={20} color={Colors.lightGreen} />
          <Text style={styles.startButtonText}>Start Identifying</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );

  const renderDiscordFooter = () => (
    <View style={styles.discordFooterContainer}>
      <BlurView intensity={15} style={[styles.discordCard, GlassStyles.glassCard]}>
        <View style={styles.discordHeader}>
          <View style={styles.discordIconContainer}>
            <View style={styles.discordLogo}>
              <Text style={styles.discordLogoText}>Discord</Text>
            </View>
          </View>
          <View style={styles.discordContent}>
            <Text style={styles.discordTitle}>Join Our Community</Text>
            <Text style={styles.discordSubtitle}>
              Connect with music enthusiasts, share discoveries, and get help with chord analysis
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.discordButton}
          onPress={handleDiscordPress}
          activeOpacity={0.8}
        >
          <View style={styles.discordButtonContent}>
            <View style={styles.discordButtonIcon}>
              <Text style={styles.discordButtonIconText}>💬</Text>
            </View>
            <Text style={styles.discordButtonText}>Join Discord Community</Text>
            <Ionicons name="external-link" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </BlurView>
    </View>
  );

  return (
    <LinearGradient
      colors={[Colors.black, Colors.darkPurple, Colors.black]}
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
          
          <Text style={styles.headerTitle}>My Library</Text>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={24} color={Colors.purple} />
          </TouchableOpacity>
        </View>

        {/* Library Stats */}
        {library.length > 0 && (
          <BlurView intensity={15} style={[styles.statsCard, GlassStyles.glassCard]}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{library.length}</Text>
                <Text style={styles.statLabel}>Songs</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {library.reduce((total, song) => total + (song.playCount || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Total Plays</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {new Set(library.map(song => song.singerName)).size}
                </Text>
                <Text style={styles.statLabel}>Artists</Text>
              </View>
            </View>
          </BlurView>
        )}

        {/* Song List */}
        <FlatList
          data={library}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={library.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={renderEmptyLibrary}
          ListFooterComponent={library.length > 0 ? renderDiscordFooter : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.lightGreen}
              colors={[Colors.lightGreen]}
            />
          }
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 60,
    maxWidth: '100%',
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
    numberOfLines: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    minHeight: 75,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.lightGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  songCard: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 16,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  albumCoverContainer: {
    position: 'relative',
    marginRight: 14,
  },
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.darkPurple,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  albumCoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButtonOverlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playIconContainer: {
    marginLeft: 2,
    marginTop: 1,
  },
  songInfo: {
    flex: 1,
    marginRight: 16,
    minWidth: 0,
  },
  songName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
    numberOfLines: 1,
  },
  artistName: {
    fontSize: 14,
    color: Colors.lightGreen,
    marginBottom: 2,
  },
  albumName: {
    fontSize: 12,
    color: Colors.lightGray,
    opacity: 0.8,
    marginBottom: 8,
  },
  songMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Colors.lightGray,
    marginLeft: 4,
    opacity: 0.8,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
    lineHeight: 22,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  startButtonText: {
    color: Colors.lightGreen,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  analysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 8,
  },
  analysisButtonText: {
    fontSize: 12,
    color: Colors.lightGreen,
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  // Discord Community Styles
  discordFooterContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  discordCard: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 0,
    backgroundColor: 'rgba(88, 101, 242, 0.1)', // Discord brand color with transparency
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 242, 0.3)',
  },
  discordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  discordIconContainer: {
    marginRight: 12,
  },
  discordLogo: {
    width: 40,
    height: 40,
    backgroundColor: '#5865F2', // Discord brand color
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5865F2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  discordLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  discordContent: {
    flex: 1,
  },
  discordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 6,
  },
  discordSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 20,
    opacity: 0.9,
  },
  discordButton: {
    backgroundColor: '#5865F2',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#5865F2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  discordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  discordButtonIcon: {
    marginRight: 10,
  },
  discordButtonIconText: {
    fontSize: 18,
  },
  discordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginRight: 10,
  },
});

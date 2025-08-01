import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
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

  const renderSongItem = ({ item: song }) => (
    <BlurView intensity={15} style={[styles.songCard, GlassStyles.glassCard]}>
      <TouchableOpacity
        style={styles.songContent}
        onPress={() => handleSongPlay(song)}
        activeOpacity={0.8}
      >
        {/* Song Info */}
        <View style={styles.songInfo}>
          <Text style={styles.songName}>{song.name}</Text>
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
        </View>

        {/* Song Actions */}
        <View style={styles.songActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={() => handleSongPlay(song)}
          >
            <Ionicons name="play" size={20} color={Colors.lightGreen} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemoveSong(song)}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.purple} />
          </TouchableOpacity>
        </View>
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

  return (
    <LinearGradient
      colors={[Colors.black, Colors.darkPurple, Colors.black]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, GlassStyles.glassButton]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.lightGreen} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>My Library</Text>
          
          <TouchableOpacity
            style={[styles.headerButton, GlassStyles.glassButton]}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.lightGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.lightGray,
    opacity: 0.8,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  songCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  songInfo: {
    flex: 1,
    marginRight: 16,
  },
  songName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
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
  songActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  playButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  removeButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
});

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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnimation, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Songbook?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut 
        },
      ]
    );
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all your settings to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Your preferences have been reset to default.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.black, Colors.purple, Colors.black]}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading Settings...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.black, Colors.purple, Colors.black]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.backButtonBlur}>
              <Ionicons name="arrow-back" size={24} color={Colors.lightGreen} />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnimation,
                transform: [{ translateY: slideAnimation }],
              },
            ]}
          >
            {/* User Info Section */}
            <View style={styles.section}>
              <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.sectionBlur}>
                <LinearGradient
                  colors={[
                    Colors.black + '40',
                    Colors.purple + '20',
                    Colors.black + '40',
                  ]}
                  style={styles.sectionGradient}
                >
                  <View style={styles.userInfo}>
                    <View style={styles.userIcon}>
                      <Ionicons name="person" size={30} color={Colors.lightGreen} />
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user?.email || 'User'}</Text>
                      <Text style={styles.userSubtext}>Songbook Member</Text>
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>
            </View>

            {/* Other Settings Section */}
            <View style={styles.section}>
              <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.sectionBlur}>
                <LinearGradient
                  colors={[
                    Colors.black + '40',
                    Colors.purple + '20',
                    Colors.black + '40',
                  ]}
                  style={styles.sectionGradient}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="settings" size={24} color={Colors.lightGreen} />
                    <Text style={styles.sectionTitle}>Other Settings</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.settingItem} 
                    onPress={() => navigation.navigate('Subscription')}
                  >
                    <View style={styles.settingContent}>
                      <Ionicons name="card" size={20} color={Colors.purple} />
                      <Text style={styles.settingText}>Manage Subscription</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={handleResetPreferences}>
                    <View style={styles.settingContent}>
                      <Ionicons name="refresh" size={20} color={Colors.orange} />
                      <Text style={styles.settingText}>Reset to Default</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                    <View style={styles.settingContent}>
                      <Ionicons name="log-out" size={20} color={Colors.red} />
                      <Text style={[styles.settingText, { color: Colors.red }]}>Sign Out</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </View>
          </Animated.View>
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
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.lightGreen,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...GlassStyles.container,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    ...GlassStyles.container,
  },
  sectionGradient: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  userIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.black + '30',
    justifyContent: 'center',
    alignItems: 'center',
    ...GlassStyles.container,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  userSubtext: {
    fontSize: 14,
    color: Colors.white,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white + '20',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: Colors.white,
  },
});

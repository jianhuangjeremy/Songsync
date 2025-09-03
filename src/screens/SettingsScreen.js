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
import Slider from '@react-native-community/slider';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { useAuth } from '../context/AuthContext';
import {
  UserPreferencesService,
  PROFICIENCY_LEVELS,
  PROFICIENCY_CONFIG,
} from '../services/UserPreferencesService';
import { SubscriptionService } from '../services/SubscriptionService';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [proficiencyLevel, setProficiencyLevel] = useState(PROFICIENCY_LEVELS.BEGINNER);
  const [sliderValue, setSliderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadUserPreferences();
    loadDevelopmentSettings();
    
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

  const loadUserPreferences = async () => {
    try {
      const level = await UserPreferencesService.getProficiencyLevel();
      if (level) {
        setProficiencyLevel(level);
        const config = PROFICIENCY_CONFIG[level];
        setSliderValue(config.sliderValue);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDevelopmentSettings = async () => {
    try {
      const devMode = await SubscriptionService.isDevelopmentModeEnabled();
      setIsDevelopmentMode(devMode);
      
      const status = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading development settings:', error);
    }
  };

  const handleSliderChange = (value) => {
    const roundedValue = Math.round(value);
    setSliderValue(roundedValue);
    
    // Map slider value to proficiency level
    const levels = Object.values(PROFICIENCY_LEVELS);
    setProficiencyLevel(levels[roundedValue]);
  };

  const handleSavePreferences = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await UserPreferencesService.saveProficiencyLevel(proficiencyLevel);
      
      // Success feedback
      Alert.alert(
        'Settings Saved',
        'Your music proficiency level has been updated successfully!',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDevelopmentModeToggle = async () => {
    try {
      const newMode = !isDevelopmentMode;
      await SubscriptionService.setDevelopmentMode(newMode);
      setIsDevelopmentMode(newMode);
      
      Alert.alert(
        'Development Mode',
        newMode 
          ? '🔧 Development mode enabled! Subscription limits are bypassed.' 
          : '🔒 Development mode disabled. Subscription limits are now enforced.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle development mode');
    }
  };

  const handleTestPaymentFlow = async () => {
    Alert.alert(
      'Test Payment Flow',
      'This will trigger the subscription modal for testing purposes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Payment', 
          onPress: () => {
            // Navigate back to HomeScreen and trigger test mode
            navigation.navigate('Home', { testPaymentFlow: true });
          }
        },
      ]
    );
  };

  const handleResetUsage = async () => {
    Alert.alert(
      'Reset Daily Usage',
      'This will reset your daily identification count to 0.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            try {
              await SubscriptionService.resetDailyUsage();
              await loadDevelopmentSettings();
              Alert.alert('Success', 'Daily usage has been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset usage');
            }
          }
        },
      ]
    );
  };

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
          onPress: async () => {
            try {
              await UserPreferencesService.resetPreferences();
              setProficiencyLevel(PROFICIENCY_LEVELS.BEGINNER);
              setSliderValue(0);
              Alert.alert('Success', 'Your preferences have been reset to default.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences.');
            }
          },
        },
      ]
    );
  };

  const currentConfig = PROFICIENCY_CONFIG[proficiencyLevel];

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

            {/* Proficiency Level Section */}
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
                    <Ionicons name="musical-notes" size={24} color={Colors.lightGreen} />
                    <Text style={styles.sectionTitle}>Music Proficiency Level</Text>
                  </View>

                  {/* Current Level Display */}
                  <View style={[styles.levelDisplay, { borderColor: currentConfig.color }]}>
                    <LinearGradient
                      colors={[currentConfig.color + '20', 'transparent']}
                      style={styles.levelGradient}
                    >
                      <Text style={[styles.levelLabel, { color: currentConfig.color }]}>
                        {currentConfig.label}
                      </Text>
                      <Text style={styles.levelDescription}>
                        {currentConfig.description}
                      </Text>
                    </LinearGradient>
                  </View>

                  {/* Slider */}
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={2}
                      step={1}
                      value={sliderValue}
                      onValueChange={handleSliderChange}
                      minimumTrackTintColor={Colors.lightGreen}
                      maximumTrackTintColor={Colors.gray + '40'}
                      thumbStyle={[styles.sliderThumb, { backgroundColor: currentConfig.color }]}
                      trackStyle={styles.sliderTrack}
                    />
                    
                    {/* Slider Labels */}
                    <View style={styles.sliderLabels}>
                      <Text style={[
                        styles.sliderLabel,
                        proficiencyLevel === PROFICIENCY_LEVELS.BEGINNER && styles.selectedSliderLabel
                      ]}>
                        Beginner
                      </Text>
                      <Text style={[
                        styles.sliderLabel,
                        proficiencyLevel === PROFICIENCY_LEVELS.INTERMEDIATE && styles.selectedSliderLabel
                      ]}>
                        Intermediate
                      </Text>
                      <Text style={[
                        styles.sliderLabel,
                        proficiencyLevel === PROFICIENCY_LEVELS.ADVANCED && styles.selectedSliderLabel
                      ]}>
                        Advanced
                      </Text>
                    </View>
                  </View>

                  {/* Features Preview */}
                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>Analysis Features:</Text>
                    <View style={styles.featuresList}>
                      <View style={styles.featureItem}>
                        <Ionicons 
                          name={currentConfig.showAdvancedChords ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={currentConfig.showAdvancedChords ? Colors.lightGreen : Colors.gray} 
                        />
                        <Text style={styles.featureText}>Advanced chord progressions</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons 
                          name={currentConfig.showComplexAnalysis ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={currentConfig.showComplexAnalysis ? Colors.lightGreen : Colors.gray} 
                        />
                        <Text style={styles.featureText}>Complex music theory analysis</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons 
                          name={currentConfig.showDetailedTiming ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={currentConfig.showDetailedTiming ? Colors.lightGreen : Colors.gray} 
                        />
                        <Text style={styles.featureText}>Detailed timing information</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="information-circle" size={16} color={Colors.lightGreen} />
                        <Text style={styles.featureText}>
                          Max {currentConfig.maxChordsDisplayed} chords displayed
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.disabledButton]}
                    onPress={handleSavePreferences}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[Colors.lightGreen, Colors.lightGreen + 'CC']}
                      style={styles.buttonGradient}
                    >
                      {isSaving ? (
                        <Text style={styles.buttonText}>Saving...</Text>
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Save Changes</Text>
                          <Ionicons name="checkmark" size={20} color={Colors.black} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </View>

            {/* Development Settings Section */}
            <View style={styles.section}>
              <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.sectionBlur}>
                <LinearGradient
                  colors={[
                    Colors.black + '40',
                    Colors.red + '20',
                    Colors.black + '40',
                  ]}
                  style={styles.sectionGradient}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="code" size={24} color={Colors.red} />
                    <Text style={styles.sectionTitle}>Development Settings</Text>
                  </View>

                  {/* Development Mode Toggle */}
                  <TouchableOpacity style={styles.settingItem} onPress={handleDevelopmentModeToggle}>
                    <View style={styles.settingContent}>
                      <Ionicons 
                        name={isDevelopmentMode ? "toggle" : "toggle-outline"} 
                        size={20} 
                        color={isDevelopmentMode ? Colors.lightGreen : Colors.gray} 
                      />
                      <Text style={styles.settingText}>
                        Development Mode {isDevelopmentMode ? "(ON)" : "(OFF)"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                  </TouchableOpacity>

                  {/* Current Status Display */}
                  {subscriptionStatus && (
                    <View style={[styles.settingItem, { opacity: 0.7 }]}>
                      <View style={styles.settingContent}>
                        <Ionicons name="information-circle" size={20} color={Colors.blue} />
                        <Text style={styles.settingText}>
                          Usage: {subscriptionStatus.usage}/{subscriptionStatus.identificationStatus.limit === -1 ? '∞' : subscriptionStatus.identificationStatus.limit}
                        </Text>
                      </View>
                      <Text style={[styles.settingText, { fontSize: 12, color: Colors.gray }]}>
                        {subscriptionStatus.config.name}
                      </Text>
                    </View>
                  )}

                  {/* Test Payment Flow */}
                  <TouchableOpacity style={styles.settingItem} onPress={handleTestPaymentFlow}>
                    <View style={styles.settingContent}>
                      <Ionicons name="card" size={20} color={Colors.orange} />
                      <Text style={styles.settingText}>Test Payment Flow</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                  </TouchableOpacity>

                  {/* Reset Usage */}
                  <TouchableOpacity style={styles.settingItem} onPress={handleResetUsage}>
                    <View style={styles.settingContent}>
                      <Ionicons name="refresh" size={20} color={Colors.purple} />
                      <Text style={styles.settingText}>Reset Daily Usage</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                  </TouchableOpacity>
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
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={handleResetPreferences}>
                    <View style={styles.settingContent}>
                      <Ionicons name="refresh" size={20} color={Colors.orange} />
                      <Text style={styles.settingText}>Reset to Default</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                    <View style={styles.settingContent}>
                      <Ionicons name="log-out" size={20} color={Colors.red} />
                      <Text style={[styles.settingText, { color: Colors.red }]}>Sign Out</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
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
  levelDisplay: {
    borderRadius: 15,
    borderWidth: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  levelGradient: {
    padding: 20,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  levelDescription: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.7,
  },
  selectedSliderLabel: {
    color: Colors.lightGreen,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: Colors.black + '20',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 10,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.8,
    flex: 1,
  },
  saveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    ...GlassStyles.container,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray + '20',
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

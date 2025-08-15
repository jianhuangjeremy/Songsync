import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { 
  UserPreferencesService, 
  PROFICIENCY_LEVELS, 
  PROFICIENCY_CONFIG 
} from '../services/UserPreferencesService';

const { width, height } = Dimensions.get('window');

export default function ProficiencyModal({ visible, onComplete }) {
  const [selectedLevel, setSelectedLevel] = useState(PROFICIENCY_LEVELS.BEGINNER);
  const [sliderValue, setSliderValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsAnimating(false));

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleSliderChange = (value) => {
    const roundedValue = Math.round(value);
    setSliderValue(roundedValue);
    
    // Map slider value to proficiency level
    const levels = Object.values(PROFICIENCY_LEVELS);
    setSelectedLevel(levels[roundedValue]);
  };

  const handleContinue = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    
    // Save proficiency level
    await UserPreferencesService.saveProficiencyLevel(selectedLevel);
    await UserPreferencesService.setNotFirstTime();

    // Exit animation
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 0.8,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      onComplete(selectedLevel);
    });
  };

  const currentConfig = PROFICIENCY_CONFIG[selectedLevel];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={[Colors.black + '95', Colors.purple + '80', Colors.black + '95']}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnimation }],
                opacity: fadeAnimation,
              },
            ]}
          >
            <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.blurContainer}>
              <LinearGradient
                colors={[
                  Colors.black + '40',
                  Colors.purple + '20',
                  Colors.black + '40',
                ]}
                style={styles.contentGradient}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        opacity: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        }),
                        transform: [
                          {
                            scale: glowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="musical-notes" size={40} color={Colors.lightGreen} />
                  </Animated.View>
                  <Text style={styles.title}>Welcome to Songbook!</Text>
                  <Text style={styles.subtitle}>
                    Let's customize your music analysis experience
                  </Text>
                </View>

                {/* Proficiency Selection */}
                <View style={styles.selectionContainer}>
                  <Text style={styles.sectionTitle}>Your Music Proficiency Level</Text>
                  
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
                        selectedLevel === PROFICIENCY_LEVELS.BEGINNER && styles.selectedSliderLabel
                      ]}>
                        Beginner
                      </Text>
                      <Text style={[
                        styles.sliderLabel,
                        selectedLevel === PROFICIENCY_LEVELS.INTERMEDIATE && styles.selectedSliderLabel
                      ]}>
                        Intermediate
                      </Text>
                      <Text style={[
                        styles.sliderLabel,
                        selectedLevel === PROFICIENCY_LEVELS.ADVANCED && styles.selectedSliderLabel
                      ]}>
                        Advanced
                      </Text>
                    </View>
                  </View>

                  {/* Features Preview */}
                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>What you'll see:</Text>
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
                    </View>
                  </View>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[styles.continueButton, isAnimating && styles.disabledButton]}
                  onPress={handleContinue}
                  disabled={isAnimating}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.lightGreen, Colors.lightGreen + 'CC']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.black} />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
  },
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    ...GlassStyles.container,
  },
  contentGradient: {
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.black + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...GlassStyles.container,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  selectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  levelDisplay: {
    borderRadius: 15,
    borderWidth: 2,
    marginBottom: 25,
    overflow: 'hidden',
  },
  levelGradient: {
    padding: 20,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  levelDescription: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.7,
  },
  sliderContainer: {
    marginBottom: 25,
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
    color: Colors.gray,
  },
  selectedSliderLabel: {
    color: Colors.lightGreen,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: Colors.black + '20',
    borderRadius: 12,
    padding: 15,
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
    color: Colors.gray,
    flex: 1,
  },
  continueButton: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
});

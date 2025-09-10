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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { SharingService } from '../services/SharingService';

const { width, height } = Dimensions.get('window');

export default function SharingModal({ 
  visible, 
  onClose, 
  onCreditsEarned,
  userId
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [sharingStats, setSharingStats] = useState(null);
  const [referralCode, setReferralCode] = useState('');

  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadSharingData();
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
      ]).start();

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
  }, [visible, userId]);

  const loadSharingData = async () => {
    try {
      const stats = await SharingService.getSharingStats();
      const code = await SharingService.getReferralCode(userId);
      setSharingStats(stats);
      setReferralCode(code);
    } catch (error) {
      console.error('Error loading sharing data:', error);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const success = await SharingService.shareApp(userId);
      if (success) {
        // Reload stats to show updated credits
        await loadSharingData();
        if (onCreditsEarned) {
          onCreditsEarned();
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share app. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
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
      onClose();
    });
  };

  if (!visible) return null;

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
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleClose}
                  >
                    <Ionicons name="close" size={24} color={Colors.white} />
                  </TouchableOpacity>
                  
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
                    <Ionicons name="share-social" size={40} color={Colors.lightGreen} />
                  </Animated.View>
                  
                  <Text style={styles.title}>Share & Earn Credits!</Text>
                  <Text style={styles.subtitle}>
                    Get bonus song identifications by sharing SongBook
                  </Text>
                </View>

                {/* Stats Section */}
                {sharingStats && (
                  <View style={styles.statsContainer}>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{sharingStats.credits}</Text>
                        <Text style={styles.statLabel}>Bonus Credits</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {sharingStats.remainingShares}
                        </Text>
                        <Text style={styles.statLabel}>Shares Left Today</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{sharingStats.totalShares}</Text>
                        <Text style={styles.statLabel}>Total Shares</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* How it Works */}
                <View style={styles.howItWorksContainer}>
                  <Text style={styles.sectionTitle}>How it Works</Text>
                  
                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.lightGreen + '20' }]}>
                      <Text style={[styles.stepNumberText, { color: Colors.lightGreen }]}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepText}>Share SongBook with friends</Text>
                      <Text style={styles.stepSubtext}>Use the button below to share</Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.purple + '20' }]}>
                      <Text style={[styles.stepNumberText, { color: Colors.purple }]}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepText}>
                        Earn {sharingStats?.creditsPerShare || 2} credits per share
                      </Text>
                      <Text style={styles.stepSubtext}>
                        Up to {sharingStats?.maxDailyCredits || 6} credits per day
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.yellow + '20' }]}>
                      <Text style={[styles.stepNumberText, { color: Colors.yellow }]}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepText}>Use credits for song identification</Text>
                      <Text style={styles.stepSubtext}>Credits are used automatically</Text>
                    </View>
                  </View>
                </View>

                {/* Referral Code */}
                <View style={styles.referralContainer}>
                  <Text style={styles.referralTitle}>Your Referral Code</Text>
                  <View style={[styles.referralCode, GlassStyles.container]}>
                    <Text style={styles.referralCodeText}>{referralCode}</Text>
                  </View>
                  <Text style={styles.referralSubtext}>
                    Friends can use this code when they download the app
                  </Text>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    (!sharingStats?.canShareToday || isSharing) && styles.disabledButton,
                    GlassStyles.container,
                  ]}
                  onPress={handleShare}
                  disabled={!sharingStats?.canShareToday || isSharing}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      !sharingStats?.canShareToday || isSharing
                        ? [Colors.gray, Colors.gray + 'CC']
                        : [Colors.lightGreen, Colors.lightGreen + 'CC']
                    }
                    style={styles.buttonGradient}
                  >
                    <Ionicons 
                      name={isSharing ? "hourglass-outline" : "share-outline"} 
                      size={20} 
                      color={Colors.black} 
                    />
                    <Text style={styles.buttonText}>
                      {isSharing
                        ? "Sharing..."
                        : !sharingStats?.canShareToday
                        ? "Daily Limit Reached"
                        : "Share SongBook"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Benefits Info */}
                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitsTitle}>Why Share?</Text>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.lightGreen} />
                      <Text style={styles.benefitText}>Get bonus song identifications</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.lightGreen} />
                      <Text style={styles.benefitText}>Help friends discover great music</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.lightGreen} />
                      <Text style={styles.benefitText}>Support SongBook development</Text>
                    </View>
                  </View>
                </View>
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
    maxHeight: height * 0.85,
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
    marginBottom: 25,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black + '30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    fontSize: 24,
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
  statsContainer: {
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.black + '20',
    borderRadius: 15,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.lightGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.7,
    textAlign: 'center',
  },
  howItWorksContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 15,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  stepSubtext: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.6,
  },
  referralContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 10,
  },
  referralCode: {
    backgroundColor: Colors.black + '20',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.lightGreen + '30',
  },
  referralCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.lightGreen,
    letterSpacing: 2,
  },
  referralSubtext: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.6,
    textAlign: 'center',
  },
  shareButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
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
  benefitsContainer: {
    backgroundColor: Colors.black + '20',
    borderRadius: 12,
    padding: 15,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.8,
    flex: 1,
  },
});

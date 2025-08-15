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
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { 
  SubscriptionService, 
  SUBSCRIPTION_TIERS, 
  SUBSCRIPTION_CONFIG 
} from '../services/SubscriptionService';

const { width, height } = Dimensions.get('window');

export default function UpgradeModal({ 
  visible, 
  onClose, 
  onUpgrade,
  currentTier = SUBSCRIPTION_TIERS.FREE,
  reason = 'limit_reached' // 'limit_reached', 'midi_download', 'feature_access'
}) {
  const [selectedTier, setSelectedTier] = useState(
    currentTier === SUBSCRIPTION_TIERS.FREE ? SUBSCRIPTION_TIERS.BASIC : SUBSCRIPTION_TIERS.PREMIUM
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const getModalTitle = () => {
    switch (reason) {
      case 'midi_download':
        return 'Premium Feature Required';
      case 'feature_access':
        return 'Upgrade for More Features';
      default:
        return 'Daily Limit Reached';
    }
  };

  const getModalMessage = () => {
    switch (reason) {
      case 'midi_download':
        return 'MIDI file downloads are available for Premium subscribers only.';
      case 'feature_access':
        return 'Unlock advanced features with a subscription.';
      default:
        return "You've reached your daily identification limit. Upgrade to continue identifying songs!";
    }
  };

  const handleUpgrade = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    try {
      // For development, use mock customer info
      const mockCustomerInfo = {
        email: 'user@songsync.com',
        name: 'SongSync User'
      };

      // Mock payment method
      const mockPaymentMethod = {
        id: 'pm_mock_card',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        }
      };

      // Process payment with Stripe integration
      const result = await SubscriptionService.processPayment(
        selectedTier, 
        mockPaymentMethod, 
        mockCustomerInfo
      );
      
      if (result.success) {
        await SubscriptionService.saveSubscriptionTier(selectedTier);
        
        Alert.alert(
          'Subscription Activated!',
          `Welcome to Songbook ${SUBSCRIPTION_CONFIG[selectedTier].name}! Your new features are now available.`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                onUpgrade(selectedTier);
                handleClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Payment Failed', 
          result.message || 'Please try again or contact support.'
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
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

  const renderPlanCard = (tier) => {
    const config = SUBSCRIPTION_CONFIG[tier];
    const isSelected = selectedTier === tier;
    const isCurrent = currentTier === tier;
    
    if (tier === SUBSCRIPTION_TIERS.FREE && currentTier !== SUBSCRIPTION_TIERS.FREE) {
      return null; // Don't show free plan if user is already subscribed
    }

    return (
      <TouchableOpacity
        key={tier}
        style={[
          styles.planCard,
          isSelected && { borderColor: config.color, borderWidth: 2 },
          isCurrent && styles.currentPlanCard
        ]}
        onPress={() => !isCurrent && setSelectedTier(tier)}
        disabled={isCurrent}
        activeOpacity={0.8}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.planCardBlur}>
          <LinearGradient
            colors={isSelected ? [...config.gradient, config.color + '20'] : [Colors.black + '40', 'transparent']}
            style={styles.planCardGradient}
          >
            {/* Plan Header */}
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={[styles.planName, { color: config.color }]}>
                  {config.name}
                </Text>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: config.color }]}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>{config.priceText}</Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {config.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={config.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Selection Indicator */}
            {isSelected && !isCurrent && (
              <View style={styles.selectionIndicator}>
                <Ionicons name="radio-button-on" size={20} color={config.color} />
                <Text style={[styles.selectionText, { color: config.color }]}>
                  Selected
                </Text>
              </View>
            )}
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const selectedConfig = SUBSCRIPTION_CONFIG[selectedTier];

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
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={24} color={Colors.gray} />
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
                    <Ionicons 
                      name={reason === 'midi_download' ? 'download' : 'star'} 
                      size={40} 
                      color={Colors.lightGreen} 
                    />
                  </Animated.View>
                  
                  <Text style={styles.title}>{getModalTitle()}</Text>
                  <Text style={styles.subtitle}>{getModalMessage()}</Text>
                </View>

                {/* Plans */}
                <ScrollView 
                  style={styles.plansContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {Object.values(SUBSCRIPTION_TIERS)
                    .filter(tier => tier !== currentTier || tier === SUBSCRIPTION_TIERS.FREE)
                    .map(tier => renderPlanCard(tier))}
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  {selectedTier !== currentTier && selectedTier !== SUBSCRIPTION_TIERS.FREE && (
                    <TouchableOpacity
                      style={[styles.upgradeButton, isProcessing && styles.disabledButton]}
                      onPress={handleUpgrade}
                      disabled={isProcessing}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={selectedConfig.gradient}
                        style={styles.buttonGradient}
                      >
                        {isProcessing ? (
                          <Text style={styles.buttonText}>Processing...</Text>
                        ) : (
                          <>
                            <Text style={styles.buttonText}>
                              Upgrade to {selectedConfig.name}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.laterButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.laterButtonText}>Maybe Later</Text>
                  </TouchableOpacity>
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
    width: width * 0.95,
    maxWidth: 450,
    maxHeight: height * 0.9,
  },
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    ...GlassStyles.container,
  },
  contentGradient: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black + '30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  plansContainer: {
    maxHeight: height * 0.4,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray + '30',
  },
  currentPlanCard: {
    opacity: 0.7,
  },
  planCardBlur: {
    flex: 1,
  },
  planCardGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  featuresContainer: {
    gap: 8,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.gray,
    flex: 1,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray + '20',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    gap: 12,
  },
  upgradeButton: {
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
    color: Colors.white,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '500',
  },
});

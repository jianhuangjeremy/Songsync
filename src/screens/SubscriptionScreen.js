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
import {
  SubscriptionService,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_CONFIG,
} from '../services/SubscriptionService';
import UpgradeModal from '../components/UpgradeModal';

const { width } = Dimensions.get('window');

// Plan Card Component with Hover Effects
const PlanCard = ({ tier, config, isCurrent, onUpgrade }) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const shadowAnimation = useRef(new Animated.Value(0)).current;
  const borderAnimation = useRef(new Animated.Value(isCurrent ? 3 : 1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCurrent) {
      // Brief expand animation for current plan
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow effect for current plan
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isCurrent]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: isCurrent ? 1.02 : 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnimation, {
        toValue: isCurrent ? 0.5 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnimation, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnimation, {
          toValue: 2,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: isCurrent ? 1.02 : 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnimation, {
          toValue: isCurrent ? 0.3 : 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnimation, {
          toValue: isCurrent ? 3 : 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnimation }],
    shadowOpacity: shadowAnimation,
    elevation: shadowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    zIndex: shadowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 10],
    }),
  };

  const borderStyle = {
    borderWidth: borderAnimation,
    borderColor: isCurrent ? config.color : Colors.white + '40',
    shadowColor: config.color,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  };

  const glowStyle = isCurrent ? {
    shadowOpacity: glowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.6],
    }),
  } : {};

  return (
    <Animated.View
      style={[
        styles.planComparisonCard,
        animatedStyle,
        {
          borderWidth: isCurrent ? 2 : 1,
          borderColor: isCurrent ? config.color : Colors.white + '30',
          backgroundColor: isCurrent ? config.color + '15' : Colors.black + '40',
        },
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      {...(Platform.OS === 'web' && {
        onMouseEnter: handleHoverIn,
        onMouseLeave: handleHoverOut,
      })}
    >
      <View style={styles.planCardContent}>
        {isCurrent && (
          <View style={[styles.currentBadge, { backgroundColor: config.color }]}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
        
        <Text style={[styles.planCardName, { color: config.color }]}>
          {config.name}
        </Text>
        
        {/* Limited Time Offer Badge */}
        {config.isLimitedTimeOffer && (
          <View style={styles.limitedOfferBadge}>
            <Text style={styles.limitedOfferText}>🔥 LIMITED TIME</Text>
            <Text style={[styles.savingsText, { color: config.color }]}>{config.savingsPercentage}</Text>
          </View>
        )}
        
        {/* Price with strikethrough for original price */}
        <View style={styles.priceContainer}>
          <Text style={styles.planCardPrice}>{config.priceText}</Text>
          {config.originalPriceText && (
            <Text style={styles.originalPrice}>{config.originalPriceText}</Text>
          )}
        </View>
        
        {/* Savings info */}
        {config.savings && (
          <Text style={[styles.savingsInfo, { color: config.color }]}>
            {config.savings} • {config.monthlyOriginalPriceText} regular price
          </Text>
        )}
        
        <View style={styles.planCardFeatures}>
          {config.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.planCardFeature}>
              <View style={[styles.checkmarkIcon, { backgroundColor: config.color + '20' }]}>
                <Ionicons name="checkmark" size={14} color={config.color} />
              </View>
              <Text style={styles.planCardFeatureText}>{feature}</Text>
            </View>
          ))}
          {config.features.length > 3 && (
            <Text style={[styles.planCardMoreFeatures, { color: config.color + '80' }]}>
              +{config.features.length - 3} more features
            </Text>
          )}
        </View>

        {!isCurrent && (
          <TouchableOpacity
            style={[styles.selectPlanButton, { 
              borderColor: config.color,
              backgroundColor: config.color + '10'
            }]}
            onPress={() => onUpgrade(tier)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectPlanText, { color: config.color }]}>
              {tier === SUBSCRIPTION_TIERS.FREE ? 'Downgrade' : 'Select Plan'}
            </Text>
          </TouchableOpacity>
        )}

        {isCurrent && (
          <View style={[styles.currentPlanIndicator, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.currentPlanText, { color: config.color }]}>
              Active Plan
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default function SubscriptionScreen({ navigation }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null);

  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  const usageAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSubscriptionStatus();
    
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

  useEffect(() => {
    if (subscriptionStatus?.usage !== undefined) {
      // Animate usage bar
      Animated.timing(usageAnimation, {
        toValue: subscriptionStatus.identificationStatus.used / Math.max(subscriptionStatus.identificationStatus.limit || 1, 1),
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [subscriptionStatus]);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (targetTier) => {
    setSelectedUpgradeTier(targetTier);
    setShowUpgradeModal(true);
  };

  const handleUpgradeComplete = async (newTier) => {
    setShowUpgradeModal(false);
    await loadSubscriptionStatus();
    
    Alert.alert(
      'Subscription Updated!',
      'Your subscription has been successfully updated. Enjoy your new features!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await SubscriptionService.saveSubscriptionTier(SUBSCRIPTION_TIERS.FREE);
              await loadSubscriptionStatus();
              Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  const renderCurrentPlan = () => {
    if (!subscriptionStatus) return null;

    const { config, tier, identificationStatus } = subscriptionStatus;
    const usagePercentage = identificationStatus.limit > 0 
      ? (identificationStatus.used / identificationStatus.limit) * 100 
      : 0;

    return (
      <View style={styles.section}>
        <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.sectionBlur}>
          <LinearGradient
            colors={[
              Colors.black + '60',
              config.color + '10',
              Colors.black + '60',
            ]}
            style={styles.sectionGradient}
          >
            <View style={styles.currentPlanHeader}>
              <View style={styles.planInfo}>
                <Text style={styles.currentPlanName}>
                  {config.name} Plan
                </Text>
                <View style={styles.currentPlanPriceContainer}>
                  <Text style={styles.currentPlanPrice}>{config.priceText}</Text>
                  {config.isLimitedTimeOffer && config.originalPriceText && (
                    <Text style={styles.currentPlanOriginalPrice}>{config.originalPriceText}</Text>
                  )}
                </View>
                {config.isLimitedTimeOffer && (
                  <Text style={[styles.currentPlanSavings, { color: config.color }]}>
                    🔥 Limited Time: {config.savingsPercentage} • {config.savings}
                  </Text>
                )}
              </View>
              <View style={[styles.planBadge, { backgroundColor: config.color }]}>
                <Ionicons name="star" size={16} color={Colors.white} />
              </View>
            </View>

            {/* Usage Statistics */}
            <View style={styles.usageContainer}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageTitle}>Today's Usage</Text>
                <Text style={styles.usageCount}>
                  {identificationStatus.used} / {identificationStatus.limit === -1 ? '∞' : identificationStatus.limit}
                </Text>
              </View>
              
              {identificationStatus.limit > 0 && (
                <View style={styles.usageBarContainer}>
                  <View style={styles.usageBarTrack}>
                    <Animated.View
                      style={[
                        styles.usageBarFill,
                        {
                          width: usageAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                          backgroundColor: usagePercentage > 80 ? Colors.red : 
                                         usagePercentage > 60 ? Colors.orange : config.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.usagePercentage}>
                    {Math.round(usagePercentage)}% used
                  </Text>
                </View>
              )}
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Your Features:</Text>
              <View style={styles.featuresList}>
                {config.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={config.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {tier !== SUBSCRIPTION_TIERS.PREMIUM && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => handleUpgrade(
                    tier === SUBSCRIPTION_TIERS.FREE ? SUBSCRIPTION_TIERS.BASIC : SUBSCRIPTION_TIERS.PREMIUM
                  )}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.lightGreen, Colors.emerald]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.upgradeButtonText}>
                      {tier === SUBSCRIPTION_TIERS.FREE ? 'Upgrade to Basic' : 'Upgrade to Premium'}
                    </Text>
                    <Ionicons name="arrow-up" size={16} color={Colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {tier !== SUBSCRIPTION_TIERS.FREE && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    );
  };

  const renderPlanComparison = () => {
    return (
      <View style={styles.section}>
        <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.sectionBlur}>
          <LinearGradient
            colors={[
              Colors.black + '60',
              Colors.purple + '10',
              Colors.black + '60',
            ]}
            style={styles.sectionGradient}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="layers" size={24} color={Colors.lightGreen} />
              <Text style={styles.sectionTitle}>Compare Plans</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScroll}>
              {Object.values(SUBSCRIPTION_TIERS).map((tier) => {
                const config = SUBSCRIPTION_CONFIG[tier];
                const isCurrent = subscriptionStatus?.tier === tier;
                
                return (
                  <PlanCard
                    key={tier}
                    tier={tier}
                    config={config}
                    isCurrent={isCurrent}
                    onUpgrade={handleUpgrade}
                  />
                );
              })}
            </ScrollView>
          </LinearGradient>
        </BlurView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.black, Colors.purple, Colors.black]}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading Subscription...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
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
            <Text style={styles.headerTitle}>Subscription</Text>
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
              {renderCurrentPlan()}
              {renderPlanComparison()}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeComplete}
        currentTier={subscriptionStatus?.tier}
        reason="feature_access"
      />
    </>
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
    borderWidth: 1,
    borderColor: Colors.white + '20',
    backgroundColor: Colors.black + '30',
    ...GlassStyles.container,
  },
  sectionGradient: {
    padding: 20,
    borderRadius: 20,
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
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planInfo: {
    flex: 1,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: Colors.lightGreen,
  },
  currentPlanPrice: {
    fontSize: 16,
    color: Colors.white,
  },
  currentPlanPriceContainer: {
    marginBottom: 4,
  },
  currentPlanOriginalPrice: {
    fontSize: 14,
    color: Colors.white + '60',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  currentPlanSavings: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  planBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usageContainer: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  usageCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.lightGreen,
  },
  usageBarContainer: {
    gap: 8,
  },
  usageBarTrack: {
    height: 8,
    backgroundColor: Colors.white + '30',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  usagePercentage: {
    fontSize: 12,
    color: Colors.white,
    textAlign: 'right',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
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
    fontSize: 14,
    color: Colors.white,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  upgradeButton: {
    borderRadius: 15,
    overflow: 'hidden',
    ...GlassStyles.container,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.red,
    fontWeight: '500',
  },
  plansScroll: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  planComparisonCard: {
    width: width * 0.55,
    marginRight: 15,
    marginVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 220,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  planCardContent: {
    padding: 16,
    flex: 1,
    position: 'relative',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planCardName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 8,
  },
  planCardPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },
  limitedOfferBadge: {
    backgroundColor: Colors.orange + '20',
    borderColor: Colors.orange,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  limitedOfferText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  priceContainer: {
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.white + '60',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsInfo: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.9,
  },
  planCardFeatures: {
    flex: 1,
    gap: 10,
  },
  planCardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  checkmarkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  planCardFeatureText: {
    color: Colors.white,
    fontSize: 13,
    flex: 1,
    opacity: 0.9,
    lineHeight: 18,
  },
  planCardMoreFeatures: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  selectPlanButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPlanText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentPlanIndicator: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

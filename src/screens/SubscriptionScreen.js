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
import SubscriptionModal from '../components/SubscriptionModal';

const { width } = Dimensions.get('window');

export default function SubscriptionScreen({ navigation }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
    setShowSubscriptionModal(true);
  };

  const handleUpgradeComplete = async (newTier) => {
    setShowSubscriptionModal(false);
    await loadSubscriptionStatus();
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
              Colors.black + '40',
              config.color + '20',
              Colors.black + '40',
            ]}
            style={styles.sectionGradient}
          >
            <View style={styles.currentPlanHeader}>
              <View style={styles.planInfo}>
                <Text style={[styles.currentPlanName, { color: config.color }]}>
                  {config.name} Plan
                </Text>
                <Text style={styles.currentPlanPrice}>{config.priceText}</Text>
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
              Colors.black + '40',
              Colors.purple + '20',
              Colors.black + '40',
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
                  <View
                    key={tier}
                    style={[
                      styles.planComparisonCard,
                      isCurrent && { borderColor: config.color, borderWidth: 2 }
                    ]}
                  >
                    <BlurView intensity={50} style={styles.planCardBlur}>
                      <LinearGradient
                        colors={isCurrent ? [...config.gradient, config.color + '20'] : [Colors.black + '60', 'transparent']}
                        style={styles.planCardGradient}
                      >
                        {isCurrent && (
                          <View style={[styles.currentBadge, { backgroundColor: config.color }]}>
                            <Text style={styles.currentBadgeText}>Current</Text>
                          </View>
                        )}
                        
                        <Text style={[styles.planCardName, { color: config.color }]}>
                          {config.name}
                        </Text>
                        <Text style={styles.planCardPrice}>{config.priceText}</Text>
                        
                        <View style={styles.planCardFeatures}>
                          {config.features.slice(0, 3).map((feature, index) => (
                            <View key={index} style={styles.planCardFeature}>
                              <Ionicons name="checkmark" size={12} color={config.color} />
                              <Text style={styles.planCardFeatureText}>{feature}</Text>
                            </View>
                          ))}
                          {config.features.length > 3 && (
                            <Text style={styles.planCardMoreFeatures}>
                              +{config.features.length - 3} more features
                            </Text>
                          )}
                        </View>

                        {!isCurrent && (
                          <TouchableOpacity
                            style={[styles.selectPlanButton, { borderColor: config.color }]}
                            onPress={() => handleUpgrade(tier)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.selectPlanText, { color: config.color }]}>
                              {tier === SUBSCRIPTION_TIERS.FREE ? 'Downgrade' : 'Select Plan'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </LinearGradient>
                    </BlurView>
                  </View>
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

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={handleUpgradeComplete}
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
  },
  currentPlanPrice: {
    fontSize: 16,
    color: Colors.gray,
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
    backgroundColor: Colors.gray + '30',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  usagePercentage: {
    fontSize: 12,
    color: Colors.gray,
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
    color: Colors.gray,
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
  },
  planComparisonCard: {
    width: width * 0.7,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray + '30',
  },
  planCardBlur: {
    flex: 1,
  },
  planCardGradient: {
    padding: 15,
    minHeight: 200,
  },
  currentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  planCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planCardPrice: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 15,
  },
  planCardFeatures: {
    flex: 1,
    gap: 6,
  },
  planCardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planCardFeatureText: {
    fontSize: 12,
    color: Colors.gray,
    flex: 1,
  },
  planCardMoreFeatures: {
    fontSize: 11,
    color: Colors.lightGreen,
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectPlanButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  selectPlanText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

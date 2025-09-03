import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../styles/Colors';
import { GlassStyles } from '../styles/GlassStyles';
import { AppleIAPService } from '../services/AppleIAPService';
import { SubscriptionService, SUBSCRIPTION_TIERS } from '../services/SubscriptionService';

export default function SubscriptionModal({ visible, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [usageStatus, setUsageStatus] = useState(null);
  const [selectedTier, setSelectedTier] = useState(SUBSCRIPTION_TIERS.PREMIUM);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current usage status
      const status = await SubscriptionService.getSubscriptionStatus();
      setUsageStatus(status);

      // Initialize Apple IAP and get products
      const result = await AppleIAPService.getSubscriptionProducts();
      if (result.success) {
        setProducts(result.products);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tier) => {
    try {
      setLoading(true);
      
      Alert.alert(
        'Confirm Purchase',
        `Upgrade to ${tier.toUpperCase()} plan?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: async () => {
              const result = await AppleIAPService.purchaseSubscription(tier);
              
              if (result.success) {
                const alertMessage = result.isDevelopmentMode 
                  ? 'Your subscription has been activated in development mode. Enjoy unlimited song identification!'
                  : 'Your subscription has been activated. Enjoy unlimited song identification!';
                
                Alert.alert(
                  result.isDevelopmentMode ? 'Development Mode Success!' : 'Success!',
                  alertMessage,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      onSuccess?.(tier);
                      onClose();
                    }
                  }]
                );
              } else {
                Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const result = await AppleIAPService.restorePurchases();
      
      if (result.success) {
        if (result.restoredCount > 0) {
          Alert.alert(
            'Purchases Restored',
            `Successfully restored ${result.restoredCount} purchase(s).`,
            [{ 
              text: 'OK', 
              onPress: () => {
                onSuccess?.('restored');
                onClose();
              }
            }]
          );
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Unable to restore purchases');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const renderUsageHeader = () => (
    <BlurView intensity={15} style={[styles.usageCard, GlassStyles.glassCard]}>
      <View style={styles.usageHeader}>
        <Ionicons name="musical-notes" size={32} color={Colors.lightGreen} />
        <Text style={styles.usageTitle}>Daily Limit Reached</Text>
      </View>
      
      {usageStatus && (
        <View style={styles.usageStats}>
          <Text style={styles.usageText}>
            You've used {usageStatus.usage} of {usageStatus.identificationStatus.limit} daily identifications
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(usageStatus.usage / usageStatus.identificationStatus.limit) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.resetText}>
            Resets tomorrow or upgrade for unlimited access
          </Text>
        </View>
      )}
    </BlurView>
  );

  const renderSubscriptionPlan = (product) => {
    const formattedOffer = AppleIAPService.formatSubscriptionOffer(product.tier, product);
    const isSelected = selectedTier === product.tier;
    
    return (
      <TouchableOpacity
        key={product.tier}
        style={[styles.planCard, isSelected && styles.selectedPlan]}
        onPress={() => setSelectedTier(product.tier)}
      >
        <LinearGradient
          colors={formattedOffer.gradient}
          style={styles.planGradient}
        >
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planTitle}>{formattedOffer.title}</Text>
              <Text style={styles.planSubtitle}>{formattedOffer.subtitle}</Text>
            </View>
            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>{formattedOffer.price}</Text>
              {formattedOffer.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.planFeatures}>
            {formattedOffer.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[Colors.black, Colors.purple, Colors.black]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.lightGreen} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upgrade Plan</Text>
            <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
              <Text style={styles.restoreText}>Restore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Usage Status */}
            {renderUsageHeader()}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.lightGreen} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}

            {/* Subscription Plans */}
            <View style={styles.plansContainer}>
              <Text style={styles.plansTitle}>Choose Your Plan</Text>
              {products.map(renderSubscriptionPlan)}
            </View>

            {/* Purchase Button */}
            <TouchableOpacity
              style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
              onPress={() => handlePurchase(selectedTier)}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.lightGreen, '#059669']}
                style={styles.purchaseGradient}
              >
                <Text style={styles.purchaseText}>
                  {loading ? 'Processing...' : 'Upgrade Now'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  restoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  restoreText: {
    color: Colors.lightGreen,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  usageCard: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 12,
  },
  usageStats: {
    alignItems: 'center',
    width: '100%',
  },
  usageText: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.lightGreen,
    borderRadius: 4,
  },
  resetText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: Colors.white,
    marginTop: 12,
    fontSize: 16,
  },
  plansContainer: {
    marginVertical: 20,
  },
  plansTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: Colors.lightGreen,
  },
  planGradient: {
    padding: 20,
    position: 'relative',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  planSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  popularBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.black,
  },
  planFeatures: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: Colors.white,
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.9,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  purchaseButton: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  purchaseText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
    marginBottom: 20,
  },
});
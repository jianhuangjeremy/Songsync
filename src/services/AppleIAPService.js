import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SubscriptionService, SUBSCRIPTION_TIERS } from './SubscriptionService';

// Conditional import to handle missing native module
let InAppPurchases = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('expo-in-app-purchases not available:', error.message);
  InAppPurchases = {
    // Mock IAP responses for when module is not available
    IAPResponseCode: { OK: 'OK' },
    connectAsync: () => Promise.resolve(),
    disconnectAsync: () => Promise.resolve(),
    getProductsAsync: () => Promise.resolve({ responseCode: 'OK', results: [] }),
    purchaseItemAsync: () => Promise.resolve({ responseCode: 'OK', results: [] }),
    getPurchaseHistoryAsync: () => Promise.resolve({ responseCode: 'OK', results: [] }),
    finishTransactionAsync: () => Promise.resolve(),
    setPurchaseListener: () => ({ remove: () => {} })
  };
}

/**
 * Apple In-App Purchase service for iOS subscriptions
 */
export class AppleIAPService {
  // Product IDs must match those configured in App Store Connect
  static PRODUCT_IDS = {
    [SUBSCRIPTION_TIERS.BASIC]: 'com.songbook.app.basic_monthly',
    [SUBSCRIPTION_TIERS.PREMIUM]: 'com.songbook.app.premium_monthly',
  };

  static isConnected = false;
  static products = new Map();

  /**
   * Initialize In-App Purchases
   */
  static async initialize() {
    try {
      if (Platform.OS !== 'ios') {
        console.log('IAP: Not on iOS, using development mode');
        return this.initializeDevelopmentMode();
      }

      // Check if native module is available
      if (!InAppPurchases || typeof InAppPurchases.connectAsync !== 'function') {
        console.log('IAP: Native module not available, using development mode');
        return this.initializeDevelopmentMode();
      }

      console.log('IAP: Initializing...');
      await InAppPurchases.connectAsync();
      this.isConnected = true;

      // Get available products
      const productIds = Object.values(this.PRODUCT_IDS);
      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results.forEach(product => {
          this.products.set(product.productId, product);
          console.log(`IAP: Product loaded: ${product.productId} - ${product.price}`);
        });
        
        console.log('IAP: Initialization successful');
        return { success: true, products: results };
      } else {
        throw new Error(`Failed to get products: ${responseCode}`);
      }
    } catch (error) {
      console.error('IAP: Initialization failed, falling back to development mode:', error);
      this.isConnected = false;
      return this.initializeDevelopmentMode();
    }
  }

  /**
   * Initialize development/mock mode when native IAP is not available
   */
  static initializeDevelopmentMode() {
    console.log('IAP: Initializing development mode with mock products');
    
    // Create mock products
    const mockProducts = [
      {
        productId: this.PRODUCT_IDS[SUBSCRIPTION_TIERS.BASIC],
        title: 'Basic Monthly Subscription',
        description: 'Get 10 song identifications per day',
        price: 10,
        priceString: '$10.00',
        currency: 'USD',
      },
      {
        productId: this.PRODUCT_IDS[SUBSCRIPTION_TIERS.PREMIUM],
        title: 'Premium Monthly Subscription', 
        description: 'Unlimited song identifications and MIDI downloads',
        price: 25,
        priceString: '$25.00',
        currency: 'USD',
      }
    ];

    // Store mock products
    mockProducts.forEach(product => {
      this.products.set(product.productId, product);
    });

    this.isConnected = true;
    return { success: true, products: mockProducts, isDevelopmentMode: true };
  }

  /**
   * Simulate purchase for development/testing
   */
  static async simulatePurchase(tier) {
    console.log(`IAP: Simulating purchase for ${tier}`);
    
    // Simulate a delay like real purchase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock purchase data
    const mockPurchase = {
      productId: this.PRODUCT_IDS[tier],
      transactionId: `mock_${Date.now()}`,
      purchaseTime: Date.now(),
      acknowledged: false,
    };

    // Process the mock purchase
    await this.handleSuccessfulPurchase(mockPurchase, tier);
    
    return { 
      success: true, 
      tier, 
      message: 'Subscription activated (development mode)',
      isDevelopmentMode: true 
    };
  }

  /**
   * Get available subscription products with pricing
   */
  static async getSubscriptionProducts() {
    try {
      if (!this.isConnected) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error('Failed to initialize IAP');
        }
      }

      const subscriptionProducts = [];
      
      for (const [tier, productId] of Object.entries(this.PRODUCT_IDS)) {
        const product = this.products.get(productId);
        if (product) {
          subscriptionProducts.push({
            tier,
            productId,
            title: product.title,
            description: product.description,
            price: product.price,
            priceString: product.priceString,
            currency: product.currency,
            ...SubscriptionService.getSubscriptionConfig(tier),
          });
        }
      }

      return { success: true, products: subscriptionProducts };
    } catch (error) {
      console.error('IAP: Error getting products:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Purchase a subscription
   */
  static async purchaseSubscription(tier) {
    try {
      // Check if we should use development mode
      if (Platform.OS !== 'ios' || !InAppPurchases || typeof InAppPurchases.purchaseItemAsync !== 'function') {
        console.log('IAP: Using development/mock purchase flow');
        return this.simulatePurchase(tier);
      }

      const productId = this.PRODUCT_IDS[tier];
      if (!productId) {
        throw new Error(`Invalid subscription tier: ${tier}`);
      }

      if (!this.isConnected) {
        await this.initialize();
      }

      console.log(`IAP: Attempting to purchase ${productId}`);

      // Set up purchase listener
      const purchaseListener = InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach(purchase => {
            console.log('IAP: Purchase successful:', purchase);
            this.handleSuccessfulPurchase(purchase, tier);
          });
        } else {
          console.error('IAP: Purchase failed:', responseCode, errorCode);
        }
      });

      // Make the purchase
      const { responseCode, results, errorCode } = await InAppPurchases.purchaseItemAsync(productId);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        console.log('IAP: Purchase initiated successfully');
        return { success: true, tier, message: 'Purchase successful' };
      } else {
        throw new Error(`Purchase failed: ${responseCode} (${errorCode})`);
      }
    } catch (error) {
      console.error('IAP: Purchase error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle successful purchase
   */
  static async handleSuccessfulPurchase(purchase, tier) {
    try {
      console.log('IAP: Processing successful purchase:', purchase.productId);

      // Save the subscription locally
      await SubscriptionService.saveSubscriptionTier(tier);

      // Store purchase receipt for validation
      await SecureStore.setItemAsync(
        'iap_purchase_receipt', 
        JSON.stringify({
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          purchaseTime: purchase.purchaseTime,
          tier: tier,
        })
      );

      // Acknowledge the purchase if needed
      if (purchase.acknowledged === false) {
        await InAppPurchases.finishTransactionAsync(purchase, false);
        console.log('IAP: Purchase acknowledged');
      }

      console.log(`IAP: Successfully activated ${tier} subscription`);
      return true;
    } catch (error) {
      console.error('IAP: Error processing purchase:', error);
      return false;
    }
  }

  /**
   * Restore previous purchases
   */
  static async restorePurchases() {
    try {
      if (Platform.OS !== 'ios' || !InAppPurchases || typeof InAppPurchases.getPurchaseHistoryAsync !== 'function') {
        console.log('IAP: Using development mode for restore');
        return { 
          success: true, 
          restoredCount: 0, 
          message: 'No purchases to restore (development mode)',
          isDevelopmentMode: true 
        };
      }

      if (!this.isConnected) {
        await this.initialize();
      }

      console.log('IAP: Restoring purchases...');
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        let restoredCount = 0;

        for (const purchase of results || []) {
          // Find which tier this purchase corresponds to
          for (const [tier, productId] of Object.entries(this.PRODUCT_IDS)) {
            if (purchase.productId === productId) {
              await this.handleSuccessfulPurchase(purchase, tier);
              restoredCount++;
              break;
            }
          }
        }

        console.log(`IAP: Restored ${restoredCount} purchases`);
        return { 
          success: true, 
          restoredCount, 
          message: `Restored ${restoredCount} purchases` 
        };
      } else {
        throw new Error(`Failed to restore purchases: ${responseCode}`);
      }
    } catch (error) {
      console.error('IAP: Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for pending transactions
   */
  static async checkPendingTransactions() {
    try {
      if (Platform.OS !== 'ios' || !this.isConnected) {
        return;
      }

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        // Process any unfinished transactions
        results?.forEach(purchase => {
          if (!purchase.acknowledged) {
            console.log('IAP: Found unfinished transaction:', purchase.productId);
            // Process the purchase
            for (const [tier, productId] of Object.entries(this.PRODUCT_IDS)) {
              if (purchase.productId === productId) {
                this.handleSuccessfulPurchase(purchase, tier);
                break;
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('IAP: Error checking pending transactions:', error);
    }
  }

  /**
   * Disconnect from IAP service
   */
  static async disconnect() {
    try {
      if (this.isConnected) {
        await InAppPurchases.disconnectAsync();
        this.isConnected = false;
        console.log('IAP: Disconnected');
      }
    } catch (error) {
      console.error('IAP: Error disconnecting:', error);
    }
  }

  /**
   * Format subscription tier for display
   */
  static formatSubscriptionOffer(tier, product) {
    const config = SubscriptionService.getSubscriptionConfig(tier);
    
    return {
      tier,
      title: config.name,
      subtitle: `${config.dailyIdentifications === -1 ? 'Unlimited' : config.dailyIdentifications} identifications/day`,
      price: product?.priceString || config.priceText,
      features: config.features,
      color: config.color,
      gradient: config.gradient,
      popular: tier === SUBSCRIPTION_TIERS.PREMIUM,
    };
  }
}
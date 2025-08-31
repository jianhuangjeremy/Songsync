import * as SecureStore from "expo-secure-store";

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
};

export const SUBSCRIPTION_CONFIG = {
  [SUBSCRIPTION_TIERS.FREE]: {
    id: "free",
    name: "Free",
    price: 0,
    priceText: "Free",
    dailyIdentifications: 3,
    canDownloadMidi: false,
    features: [
      "3 song identifications per day",
      "Basic music analysis",
      "Song library access",
      "Star rating system",
    ],
    color: "#10B981", // lightGreen
    gradient: ["#10B981", "#059669"],
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    id: "basic",
    name: "Basic",
    price: 10,
    priceText: "$10/month",
    dailyIdentifications: 10,
    canDownloadMidi: false,
    features: [
      "10 song identifications per day",
      "Advanced music analysis",
      "Unlimited song library",
      "Priority support",
      "No ads",
    ],
    color: "#8B5CF6", // purple
    gradient: ["#8B5CF6", "#7C3AED"],
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    id: "premium",
    name: "Premium",
    price: 25,
    priceText: "$25/month",
    dailyIdentifications: -1, // unlimited
    canDownloadMidi: true,
    features: [
      "Unlimited song identifications",
      "MIDI file downloads",
      "Advanced chord analysis",
      "Detailed timing information",
      "Priority support",
      "Exclusive features",
    ],
    color: "#EF4444", // red
    gradient: ["#EF4444", "#DC2626"],
  },
};

// Storage keys
const SUBSCRIPTION_KEY = "user_subscription_tier";
const USAGE_KEY_PREFIX = "daily_usage_";
const SUBSCRIPTION_START_DATE_KEY = "subscription_start_date";

export class SubscriptionService {
  // Get current date string for usage tracking
  static getCurrentDateString() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  // Save user subscription tier
  static async saveSubscriptionTier(tier) {
    try {
      await SecureStore.setItemAsync(SUBSCRIPTION_KEY, tier);

      // Set subscription start date for new subscriptions
      if (tier !== SUBSCRIPTION_TIERS.FREE) {
        const startDate = new Date().toISOString();
        await SecureStore.setItemAsync(SUBSCRIPTION_START_DATE_KEY, startDate);
      }

      console.log("Subscription tier saved:", tier);
    } catch (error) {
      console.error("Error saving subscription tier:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        localStorage.setItem(SUBSCRIPTION_KEY, tier);
        if (tier !== SUBSCRIPTION_TIERS.FREE) {
          localStorage.setItem(
            SUBSCRIPTION_START_DATE_KEY,
            new Date().toISOString()
          );
        }
      }
    }
  }

  // Get user subscription tier
  static async getSubscriptionTier() {
    try {
      const tier = await SecureStore.getItemAsync(SUBSCRIPTION_KEY);
      return tier || SUBSCRIPTION_TIERS.FREE;
    } catch (error) {
      console.error("Error getting subscription tier:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        return (
          localStorage.getItem(SUBSCRIPTION_KEY) || SUBSCRIPTION_TIERS.FREE
        );
      }
      return SUBSCRIPTION_TIERS.FREE;
    }
  }

  // DEVELOPMENT HELPER: Manually set subscription tier (for testing only)
  static async setSubscriptionTierForTesting(
    tier = SUBSCRIPTION_TIERS.PREMIUM
  ) {
    try {
      await SecureStore.setItemAsync(SUBSCRIPTION_KEY, tier);
      console.log(`🔓 Development: Subscription set to ${tier}`);
      return true;
    } catch (error) {
      console.error("Error setting subscription tier:", error);
      if (typeof window !== "undefined") {
        localStorage.setItem(SUBSCRIPTION_KEY, tier);
        console.log(
          `🔓 Development: Subscription set to ${tier} (localStorage)`
        );
        return true;
      }
      return false;
    }
  }

  // Get subscription configuration
  static getSubscriptionConfig(tier) {
    return (
      SUBSCRIPTION_CONFIG[tier] || SUBSCRIPTION_CONFIG[SUBSCRIPTION_TIERS.FREE]
    );
  }

  // Get all subscription tiers
  static getAllSubscriptionTiers() {
    return Object.values(SUBSCRIPTION_TIERS).map((tier) => ({
      ...SUBSCRIPTION_CONFIG[tier],
    }));
  }

  // Get daily usage count
  static async getDailyUsage() {
    const dateString = this.getCurrentDateString();
    const usageKey = USAGE_KEY_PREFIX + dateString;

    try {
      const usage = await SecureStore.getItemAsync(usageKey);
      return parseInt(usage) || 0;
    } catch (error) {
      console.error("Error getting daily usage:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        const usage = localStorage.getItem(usageKey);
        return parseInt(usage) || 0;
      }
      return 0;
    }
  }

  // Increment daily usage
  static async incrementDailyUsage() {
    const dateString = this.getCurrentDateString();
    const usageKey = USAGE_KEY_PREFIX + dateString;

    try {
      const currentUsage = await this.getDailyUsage();
      const newUsage = currentUsage + 1;

      await SecureStore.setItemAsync(usageKey, newUsage.toString());
      console.log("Daily usage incremented to:", newUsage);
      return newUsage;
    } catch (error) {
      console.error("Error incrementing daily usage:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        const currentUsage = await this.getDailyUsage();
        const newUsage = currentUsage + 1;
        localStorage.setItem(usageKey, newUsage.toString());
        return newUsage;
      }
      return 1;
    }
  }

  // Check if user can identify songs
  static async canIdentifySongs() {
    const tier = await this.getSubscriptionTier();
    const config = this.getSubscriptionConfig(tier);

    // Premium users have unlimited access
    if (config.dailyIdentifications === -1) {
      return { canUse: true, remaining: -1 };
    }

    const usage = await this.getDailyUsage();
    const remaining = config.dailyIdentifications - usage;

    return {
      canUse: remaining > 0,
      remaining: Math.max(0, remaining),
      used: usage,
      limit: config.dailyIdentifications,
    };
  }

  // Check if user can download MIDI files
  static async canDownloadMidi() {
    const tier = await this.getSubscriptionTier();
    const config = this.getSubscriptionConfig(tier);

    // TEMPORARY: Allow MIDI downloads for development/testing
    // Remove this in production
    const isDevelopment = __DEV__ || process.env.NODE_ENV === "development";

    return {
      canDownload: config.canDownloadMidi || isDevelopment,
      tier: tier,
      requiresUpgrade: !config.canDownloadMidi && !isDevelopment,
    };
  }

  // Get subscription status with usage info
  static async getSubscriptionStatus() {
    const tier = await this.getSubscriptionTier();
    const config = this.getSubscriptionConfig(tier);
    const usage = await this.getDailyUsage();
    const identificationStatus = await this.canIdentifySongs();
    const midiStatus = await this.canDownloadMidi();

    return {
      tier,
      config,
      usage,
      identificationStatus,
      midiStatus,
      isSubscribed: tier !== SUBSCRIPTION_TIERS.FREE,
    };
  }

  // Reset usage (for testing purposes)
  static async resetDailyUsage() {
    const dateString = this.getCurrentDateString();
    const usageKey = USAGE_KEY_PREFIX + dateString;

    try {
      await SecureStore.deleteItemAsync(usageKey);
      console.log("Daily usage reset");
    } catch (error) {
      console.error("Error resetting daily usage:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        localStorage.removeItem(usageKey);
      }
    }
  }

  // Clean up old usage data (keep last 30 days)
  static async cleanupOldUsageData() {
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // This would need platform-specific implementation for SecureStore
    // For now, we'll just log the cleanup attempt
    console.log(
      "Usage data cleanup - keeping data from:",
      thirtyDaysAgo.toISOString().split("T")[0]
    );
  }

  // Stripe API configuration
  static getStripeConfig() {
    const isDevelopment = __DEV__ || process.env.NODE_ENV === "development";
    return {
      baseURL: isDevelopment
        ? "http://localhost:3001/api/stripe"
        : "https://your-production-api.com/api/stripe",
      publishableKey: isDevelopment
        ? "pk_test_mock_publishable_key_123456789"
        : "pk_live_your_live_key",
    };
  }

  // Create Stripe customer
  static async createStripeCustomer(email, name) {
    try {
      const config = this.getStripeConfig();
      const response = await fetch(`${config.baseURL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create customer");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  // Process payment with Stripe
  static async processPayment(tier, paymentMethod, customerInfo) {
    try {
      const config = this.getStripeConfig();

      // Create customer if not exists
      let customer = null;
      if (customerInfo) {
        customer = await this.createStripeCustomer(
          customerInfo.email,
          customerInfo.name
        );
      }

      // Get tier configuration
      const tierConfig = SUBSCRIPTION_CONFIG[tier];

      if (tier === SUBSCRIPTION_TIERS.FREE) {
        // Handle free tier
        return {
          success: true,
          tier: tier,
          message: "Switched to free plan successfully",
        };
      }

      // Create subscription
      const priceId =
        tier === SUBSCRIPTION_TIERS.BASIC
          ? "price_mock_basic_plan"
          : "price_mock_premium_plan";

      const subscriptionResponse = await fetch(
        `${config.baseURL}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customer?.id,
            items: [{ price: priceId }],
            default_payment_method: paymentMethod?.id || "pm_mock_card",
          }),
        }
      );

      if (!subscriptionResponse.ok) {
        throw new Error("Failed to create subscription");
      }

      const subscription = await subscriptionResponse.json();

      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: customer?.id,
        tier: tier,
        message: "Subscription created successfully",
        subscription,
      };
    } catch (error) {
      console.error("Error processing payment:", error);
      return {
        success: false,
        error: error.message,
        message: "Payment processing failed",
      };
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId) {
    try {
      const config = this.getStripeConfig();

      const response = await fetch(
        `${config.baseURL}/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const canceledSubscription = await response.json();

      // Update local subscription tier to free
      await this.setSubscriptionTier(SUBSCRIPTION_TIERS.FREE);

      return {
        success: true,
        subscription: canceledSubscription,
        message: "Subscription canceled successfully",
      };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to cancel subscription",
      };
    }
  }

  // Update subscription
  static async updateSubscription(subscriptionId, newTier) {
    try {
      const config = this.getStripeConfig();
      const priceId =
        newTier === SUBSCRIPTION_TIERS.BASIC
          ? "price_mock_basic_plan"
          : "price_mock_premium_plan";

      const response = await fetch(
        `${config.baseURL}/subscriptions/${subscriptionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ price: priceId }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }

      const updatedSubscription = await response.json();

      // Update local subscription tier
      await this.setSubscriptionTier(newTier);

      return {
        success: true,
        subscription: updatedSubscription,
        message: "Subscription updated successfully",
      };
    } catch (error) {
      console.error("Error updating subscription:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to update subscription",
      };
    }
  }

  // Get available Stripe plans
  static async getAvailablePlans() {
    try {
      const config = this.getStripeConfig();

      const response = await fetch(`${config.baseURL}/plans`);

      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }

      const plans = await response.json();
      return plans.data;
    } catch (error) {
      console.error("Error fetching plans:", error);
      // Return local config as fallback
      return Object.values(SUBSCRIPTION_CONFIG).filter(
        (config) => config.id !== "free"
      );
    }
  }

  // Get subscription start date
  static async getSubscriptionStartDate() {
    try {
      const startDate = await SecureStore.getItemAsync(
        SUBSCRIPTION_START_DATE_KEY
      );
      return startDate ? new Date(startDate) : null;
    } catch (error) {
      console.error("Error getting subscription start date:", error);
      if (typeof window !== "undefined") {
        const startDate = localStorage.getItem(SUBSCRIPTION_START_DATE_KEY);
        return startDate ? new Date(startDate) : null;
      }
      return null;
    }
  }

  // Check if subscription is active (for future billing cycle management)
  static async isSubscriptionActive() {
    const tier = await this.getSubscriptionTier();
    if (tier === SUBSCRIPTION_TIERS.FREE) return false;

    const startDate = await this.getSubscriptionStartDate();
    if (!startDate) return false;

    // For now, consider all non-free subscriptions as active
    // In production, you'd check against billing cycles and payment status
    return true;
  }
}

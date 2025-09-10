import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";
import { SubscriptionService } from "./SubscriptionService";

// Sharing configuration
export const SHARING_CONFIG = {
  CREDITS_PER_SHARE: 2, // Credits given per successful share
  MAX_DAILY_SHARE_CREDITS: 6, // Maximum credits from sharing per day
  SHARE_URL: "https://songbook.app", // App store/download URL
  REFERRAL_CODE_LENGTH: 8,
};

// Storage keys
const SHARING_CREDITS_KEY = "sharing_credits";
const DAILY_SHARES_KEY_PREFIX = "daily_shares_";
const REFERRAL_CODE_KEY = "user_referral_code";
const TOTAL_SHARES_KEY = "total_successful_shares";

export class SharingService {
  // Get current date string for tracking
  static getCurrentDateString() {
    return new Date().toISOString().split("T")[0];
  }

  // Generate a unique referral code for the user
  static async generateReferralCode(userId) {
    try {
      // Check if user already has a referral code
      const existingCode = await SecureStore.getItemAsync(REFERRAL_CODE_KEY);
      if (existingCode) {
        return existingCode;
      }

      // Generate new referral code
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < SHARING_CONFIG.REFERRAL_CODE_LENGTH; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Save the referral code
      await SecureStore.setItemAsync(REFERRAL_CODE_KEY, result);
      return result;
    } catch (error) {
      console.error("Error generating referral code:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        const existingCode = localStorage.getItem(REFERRAL_CODE_KEY);
        if (existingCode) {
          return existingCode;
        }

        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < SHARING_CONFIG.REFERRAL_CODE_LENGTH; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        localStorage.setItem(REFERRAL_CODE_KEY, result);
        return result;
      }
      return "SONGBOOK1"; // Fallback code
    }
  }

  // Get user's referral code
  static async getReferralCode(userId) {
    try {
      const code = await SecureStore.getItemAsync(REFERRAL_CODE_KEY);
      if (code) {
        return code;
      }
      // Generate new code if doesn't exist
      return await this.generateReferralCode(userId);
    } catch (error) {
      console.error("Error getting referral code:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        const code = localStorage.getItem(REFERRAL_CODE_KEY);
        if (code) {
          return code;
        }
      }
      return await this.generateReferralCode(userId);
    }
  }

  // Get sharing credits balance
  static async getSharingCredits() {
    try {
      const credits = await SecureStore.getItemAsync(SHARING_CREDITS_KEY);
      return parseInt(credits) || 0;
    } catch (error) {
      console.error("Error getting sharing credits:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        const credits = localStorage.getItem(SHARING_CREDITS_KEY);
        return parseInt(credits) || 0;
      }
      return 0;
    }
  }

  // Add sharing credits
  static async addSharingCredits(credits) {
    try {
      const currentCredits = await this.getSharingCredits();
      const newCredits = currentCredits + credits;
      await SecureStore.setItemAsync(SHARING_CREDITS_KEY, newCredits.toString());
      console.log(`Added ${credits} sharing credits. Total: ${newCredits}`);
      return newCredits;
    } catch (error) {
      console.error("Error adding sharing credits:", error);
      // Fallback for development
      if (typeof window !== "undefined") {
        const currentCredits = parseInt(localStorage.getItem(SHARING_CREDITS_KEY)) || 0;
        const newCredits = currentCredits + credits;
        localStorage.setItem(SHARING_CREDITS_KEY, newCredits.toString());
        return newCredits;
      }
      return 0;
    }
  }

  // Use sharing credits (deduct from balance)
  static async useSharingCredits(credits) {
    try {
      const currentCredits = await this.getSharingCredits();
      if (currentCredits < credits) {
        return false; // Not enough credits
      }
      
      const newCredits = currentCredits - credits;
      await SecureStore.setItemAsync(SHARING_CREDITS_KEY, newCredits.toString());
      console.log(`Used ${credits} sharing credits. Remaining: ${newCredits}`);
      return true;
    } catch (error) {
      console.error("Error using sharing credits:", error);
      return false;
    }
  }

  // Check daily share limit
  static async canShareForCredits() {
    try {
      const today = this.getCurrentDateString();
      const key = DAILY_SHARES_KEY_PREFIX + today;
      const dailyShares = await SecureStore.getItemAsync(key);
      const sharesCount = parseInt(dailyShares) || 0;
      
      const maxCreditsToday = SHARING_CONFIG.MAX_DAILY_SHARE_CREDITS;
      const creditsEarned = sharesCount * SHARING_CONFIG.CREDITS_PER_SHARE;
      
      return {
        canShare: creditsEarned < maxCreditsToday,
        sharesUsed: sharesCount,
        maxShares: Math.floor(maxCreditsToday / SHARING_CONFIG.CREDITS_PER_SHARE),
        creditsEarned: creditsEarned,
        maxCredits: maxCreditsToday,
        creditsPerShare: SHARING_CONFIG.CREDITS_PER_SHARE
      };
    } catch (error) {
      console.error("Error checking share limit:", error);
      return {
        canShare: true,
        sharesUsed: 0,
        maxShares: Math.floor(SHARING_CONFIG.MAX_DAILY_SHARE_CREDITS / SHARING_CONFIG.CREDITS_PER_SHARE),
        creditsEarned: 0,
        maxCredits: SHARING_CONFIG.MAX_DAILY_SHARE_CREDITS,
        creditsPerShare: SHARING_CONFIG.CREDITS_PER_SHARE
      };
    }
  }

  // Record a successful share
  static async recordShare() {
    try {
      const today = this.getCurrentDateString();
      const key = DAILY_SHARES_KEY_PREFIX + today;
      
      // Update daily shares count
      const dailyShares = await SecureStore.getItemAsync(key);
      const newCount = (parseInt(dailyShares) || 0) + 1;
      await SecureStore.setItemAsync(key, newCount.toString());

      // Update total shares
      const totalShares = await SecureStore.getItemAsync(TOTAL_SHARES_KEY);
      const newTotal = (parseInt(totalShares) || 0) + 1;
      await SecureStore.setItemAsync(TOTAL_SHARES_KEY, newTotal.toString());

      // Add credits
      await this.addSharingCredits(SHARING_CONFIG.CREDITS_PER_SHARE);
      
      console.log(`Share recorded. Daily: ${newCount}, Total: ${newTotal}`);
      return true;
    } catch (error) {
      console.error("Error recording share:", error);
      return false;
    }
  }

  // Create share content
  static async createShareContent(userId) {
    try {
      const referralCode = await this.getReferralCode(userId);
      const shareUrl = `${SHARING_CONFIG.SHARE_URL}?ref=${referralCode}`;
      
      const content = {
        title: "🎵 Discover SongBook - AI Music Identifier",
        message: `I've been using SongBook to instantly identify any song playing around me! 🎶\n\n✨ Features:\n• Instant music recognition\n• Chord analysis & audio downloads\n• Build your personal music library\n• Works with any song!\n\nDownload it now and use my referral code: ${referralCode}\n\n${shareUrl}`,
        url: shareUrl,
        referralCode: referralCode
      };

      return content;
    } catch (error) {
      console.error("Error creating share content:", error);
      return null;
    }
  }

  // Share app with native sharing
  static async shareApp(userId) {
    try {
      const shareStatus = await this.canShareForCredits();
      if (!shareStatus.canShare) {
        Alert.alert(
          "Daily Limit Reached",
          `You've already earned the maximum ${shareStatus.maxCredits} credits from sharing today. Try again tomorrow!`,
          [{ text: "OK" }]
        );
        return false;
      }

      const shareContent = await this.createShareContent(userId);
      if (!shareContent) {
        throw new Error("Failed to create share content");
      }

      if (Platform.OS === "web") {
        // Web sharing using Web Share API or fallback to clipboard
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareContent.title,
              text: shareContent.message,
              url: shareContent.url,
            });
            
            // Record the share and award credits
            await this.recordShare();
            const newCredits = await this.getSharingCredits();
            
            Alert.alert(
              "Thanks for Sharing! 🎉",
              `You earned ${SHARING_CONFIG.CREDITS_PER_SHARE} bonus credits!\n\nTotal credits: ${newCredits}`,
              [{ text: "Awesome!" }]
            );
            return true;
          } catch (error) {
            if (error.name !== "AbortError") {
              console.error("Web share failed:", error);
            }
            return false;
          }
        } else {
          // Fallback to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareContent.message);
            Alert.alert(
              "Link Copied! 📋",
              "Share link copied to clipboard. Share it to earn credits!",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "I Shared It!",
                  onPress: async () => {
                    await this.recordShare();
                    const newCredits = await this.getSharingCredits();
                    Alert.alert(
                      "Credits Earned! 🎉",
                      `You earned ${SHARING_CONFIG.CREDITS_PER_SHARE} bonus credits!\n\nTotal credits: ${newCredits}`,
                      [{ text: "Awesome!" }]
                    );
                  }
                }
              ]
            );
            return true;
          }
        }
      } else {
        // Native sharing for mobile
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          try {
            // For mobile, we'll show the share dialog and assume success
            // In a real app, you might want to track this more accurately
            await Sharing.shareAsync(shareContent.url, {
              dialogTitle: shareContent.title,
              mimeType: "text/plain",
            });
            
            // Since we can't detect if user actually shared, we'll ask them
            setTimeout(() => {
              Alert.alert(
                "Did you share SongBook?",
                "If you shared the app, you'll earn bonus credits!",
                [
                  { text: "No, Cancel", style: "cancel" },
                  {
                    text: "Yes, I Shared!",
                    onPress: async () => {
                      await this.recordShare();
                      const newCredits = await this.getSharingCredits();
                      Alert.alert(
                        "Credits Earned! 🎉",
                        `You earned ${SHARING_CONFIG.CREDITS_PER_SHARE} bonus credits!\n\nTotal credits: ${newCredits}`,
                        [{ text: "Awesome!" }]
                      );
                    }
                  }
                ]
              );
            }, 1000);
            
            return true;
          } catch (error) {
            console.error("Native share failed:", error);
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error sharing app:", error);
      Alert.alert("Error", "Failed to share app. Please try again.");
      return false;
    }
  }

  // Get sharing statistics
  static async getSharingStats() {
    try {
      const totalShares = await SecureStore.getItemAsync(TOTAL_SHARES_KEY);
      const today = this.getCurrentDateString();
      const dailyKey = DAILY_SHARES_KEY_PREFIX + today;
      const dailyShares = await SecureStore.getItemAsync(dailyKey);
      const credits = await this.getSharingCredits();
      const shareStatus = await this.canShareForCredits();

      return {
        totalShares: parseInt(totalShares) || 0,
        dailyShares: parseInt(dailyShares) || 0,
        credits: credits,
        canShareToday: shareStatus.canShare,
        remainingShares: shareStatus.maxShares - shareStatus.sharesUsed,
        maxDailyShares: shareStatus.maxShares,
        creditsPerShare: SHARING_CONFIG.CREDITS_PER_SHARE,
        maxDailyCredits: SHARING_CONFIG.MAX_DAILY_SHARE_CREDITS
      };
    } catch (error) {
      console.error("Error getting sharing stats:", error);
      return {
        totalShares: 0,
        dailyShares: 0,
        credits: 0,
        canShareToday: true,
        remainingShares: 3,
        maxDailyShares: 3,
        creditsPerShare: SHARING_CONFIG.CREDITS_PER_SHARE,
        maxDailyCredits: SHARING_CONFIG.MAX_DAILY_SHARE_CREDITS
      };
    }
  }
}

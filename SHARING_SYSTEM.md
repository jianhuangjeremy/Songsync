# SongBook Sharing & Growth System

## Overview
The sharing system allows users to earn bonus credits for song identification by sharing the app with friends. This helps with user growth while providing value to existing users.

## How It Works

### For Users
1. **When credits run out**: Users see an upgrade modal with sharing option
2. **Share the app**: Tap "Get Free Credits by Sharing" to open sharing modal
3. **Earn credits**: Get 2 bonus credits per successful share
4. **Daily limit**: Maximum 6 bonus credits per day (3 shares)
5. **Use credits**: Bonus credits are automatically used when subscription limits are reached

### Credit System
- **Credits per share**: 2 identification credits
- **Daily limit**: 6 credits maximum per day
- **Auto-consumption**: Credits are used automatically when needed
- **Display**: Shows in user card as "+X bonus" credits

### Sharing Flow
1. User hits daily identification limit
2. Upgrade modal appears with sharing option
3. Sharing modal shows:
   - Current bonus credit balance
   - Remaining shares for today
   - Personal referral code
   - How-to-share instructions
4. User shares via native platform sharing
5. Credits are awarded immediately

## Technical Implementation

### Key Components

#### SharingService (`src/services/SharingService.js`)
- Manages referral codes, credit balances, share tracking
- Handles platform-specific sharing (web vs mobile)
- Tracks daily limits and usage statistics

#### SharingModal (`src/components/SharingModal.js`)
- Beautiful modal interface for sharing
- Shows stats, referral code, and sharing options
- Integrates with native sharing APIs

#### SubscriptionService Updates
- Enhanced to check sharing credits when subscription limits hit
- Automatically uses sharing credits before blocking users
- Updated status display to show bonus credits

#### UpgradeModal Enhancements
- Added "Get Free Credits by Sharing" option
- Only shows for limit_reached scenarios
- Integrates with SharingModal

### Configuration

```javascript
// Sharing configuration in SharingService.js
export const SHARING_CONFIG = {
  CREDITS_PER_SHARE: 2,           // Credits per successful share
  MAX_DAILY_SHARE_CREDITS: 6,    // Daily maximum bonus credits
  SHARE_URL: "https://songbook.app", // App download URL
  REFERRAL_CODE_LENGTH: 8,       // Length of referral codes
};
```

### Usage Flow

1. **User hits limit**: `SubscriptionService.canIdentifySongs()` returns `canUse: false`
2. **Check sharing credits**: Service automatically checks `SharingService.getSharingCredits()`
3. **Credits available**: If user has sharing credits, `canUse: true, usingSharingCredits: true`
4. **Use credits**: `SubscriptionService.incrementDailyUsage()` calls `SharingService.useSharingCredits(1)`
5. **No credits**: Show upgrade modal with sharing option

## User Experience

### Visual Indicators
- User card shows bonus credits: "3/3 (+2)"
- Usage label updates: "Daily IDs + Bonus"
- Tier badge remains unchanged

### Sharing Experience
- Native sharing on mobile devices
- Web Share API for modern browsers  
- Clipboard fallback for older browsers
- Honor-system confirmation for mobile shares

### Growth Incentives
- Immediate credit reward
- Clear daily progress tracking
- Gamified sharing statistics
- Personal referral codes

## Benefits

### For Users
- ✅ Continue using app when limits reached
- ✅ No immediate payment required
- ✅ Share with friends organically
- ✅ Earn rewards for advocacy

### For Business
- ✅ Viral growth through sharing
- ✅ User retention during limit periods
- ✅ Referral tracking system
- ✅ Reduced churn at paywall

### For Product
- ✅ Engagement beyond subscription limits
- ✅ Word-of-mouth marketing
- ✅ User-generated growth
- ✅ Data on sharing behavior

## Future Enhancements

### Potential Features
- **Referral rewards**: Bonus credits when referred users sign up
- **Achievement system**: Badges for sharing milestones
- **Social leaderboards**: Top sharers ranking
- **Seasonal bonuses**: Extra credits during promotions
- **Custom messages**: Personalized share text
- **Share analytics**: Track conversion rates

### Integration Options
- **Social platforms**: Direct sharing to Twitter, Facebook, etc.
- **Contact integration**: Share with phone contacts
- **QR codes**: Generate shareable QR codes
- **Deep linking**: Better attribution tracking

This sharing system transforms the "limit reached" friction point into a growth opportunity while maintaining user engagement and satisfaction.

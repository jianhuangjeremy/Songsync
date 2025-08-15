# 🎵 SongSync - Complete Setup Documentation

## Overview

SongSync now includes a complete subscription system with three tiers and mock Stripe integration for development/testing.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SongSync App                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │   HomeScreen    │  │  SubscriptionScreen │              │
│  │                 │  │                    │               │
│  │ • Usage Display │  │ • Plan Management  │               │
│  │ • Limit Checks  │  │ • Usage Analytics  │               │
│  └─────────────────┘  └──────────────────┘                 │
│                              │                              │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │  UpgradeModal   │  │ SubscriptionService │              │
│  │                 │  │                     │              │
│  │ • Plan Selection│  │ • Payment Processing│              │
│  │ • Payment Flow  │  │ • Usage Tracking   │              │
│  └─────────────────┘  └──────────────────┘                 │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP API Calls
┌──────────────────────────────┼──────────────────────────────┐
│                Mock Stripe Server                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │   Customers     │  │   Subscriptions  │                 │
│  │   • Create      │  │   • Create/Update│                 │
│  │   • Retrieve    │  │   • Cancel       │                 │
│  └─────────────────┘  └──────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Payment Methods │  │    Webhooks      │                 │
│  │   • Cards       │  │   • Events       │                 │
│  │   • Validation  │  │   • Processing   │                 │
│  └─────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 💰 Subscription Tiers

| Tier | Price | Daily IDs | MIDI Downloads | Features |
|------|-------|-----------|----------------|----------|
| **Free** | $0 | 3 | ❌ | Basic analysis, song library |
| **Basic** | $10/month | 10 | ❌ | Advanced analysis, no ads |
| **Premium** | $25/month | Unlimited | ✅ | All features + MIDI downloads |

## 🚀 Quick Start

### 1. Start Development Environment

```bash
# Option A: Use the automated script
./start-dev.sh

# Option B: Manual setup
cd server && npm start &
npm start
```

### 2. Test Stripe Integration

```bash
./test-stripe.sh
```

### 3. Access the App

- **iOS**: Choose option 1 in start script
- **Android**: Choose option 2 in start script  
- **Web**: Choose option 3 in start script
- **Expo Go**: Choose option 4 and scan QR code

## 🔧 Development Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS testing)
- Android Emulator (for Android testing)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd songsync

# Install main app dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Make scripts executable
chmod +x start-dev.sh test-stripe.sh
```

## 📡 Mock Stripe Server

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/stripe/config` | Get publishable key |
| GET | `/api/stripe/plans` | List available plans |
| POST | `/api/stripe/customers` | Create customer |
| POST | `/api/stripe/subscriptions` | Create subscription |
| POST | `/api/stripe/subscriptions/:id` | Update subscription |
| DELETE | `/api/stripe/subscriptions/:id` | Cancel subscription |

### Configuration

```javascript
// Development (automatic)
baseURL: 'http://localhost:3001/api/stripe'
publishableKey: 'pk_test_mock_publishable_key_123456789'

// Production (configure in SubscriptionService)
baseURL: 'https://your-api.com/api/stripe'
publishableKey: 'pk_live_your_live_key'
```

## 🔄 User Flow

### New User Journey

1. **First time** → Proficiency setup (beginner/intermediate/advanced)
2. **Free tier** → 3 daily song identifications
3. **Limit reached** → Upgrade modal appears
4. **Select plan** → Basic ($10) or Premium ($25)
5. **Payment** → Mock payment processing
6. **Activated** → Access to tier features

### Subscription Management

1. **Settings** → Subscription section
2. **Current plan** → Usage analytics display
3. **Upgrade/Downgrade** → Plan comparison
4. **Cancel** → Immediate downgrade to free

## 📱 UI Components

### HomeScreen Integration

```javascript
// Usage indicator in header
<View style={styles.usageIndicator}>
  <View style={styles.usageCard}>
    <Text style={styles.usageText}>2/3 Daily IDs</Text>
    <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
      <Text style={styles.tierText}>FREE</Text>
    </View>
  </View>
</View>
```

### UpgradeModal Features

- **Plan comparison** with feature lists
- **Animated transitions** with liquid glass effect
- **Payment simulation** with realistic delays
- **Error handling** with user-friendly messages

### SubscriptionScreen Features

- **Current plan status** with usage metrics
- **Plan switching** with immediate updates
- **Usage analytics** with daily/monthly stats
- **Cancellation flow** with confirmation

## 🧪 Testing

### Automated Tests

```bash
# Run all Stripe integration tests
./test-stripe.sh

# Expected output: 12/12 tests passed
```

### Manual Testing Scenarios

1. **Free tier limits**
   - Try to identify 4+ songs
   - Verify upgrade modal appears

2. **Subscription upgrade**
   - Select Basic plan
   - Complete mock payment
   - Verify increased limits

3. **MIDI downloads**
   - Try download as Free/Basic user
   - Verify Premium requirement
   - Upgrade and test download

4. **Plan management**
   - Navigate to Settings → Subscription
   - Switch between plans
   - Cancel subscription

## 🔒 Security & Production

### Current State (Development)

- Mock payment processing
- Local storage for subscription data
- No real financial transactions
- Hardcoded customer information

### Production Checklist

- [ ] Replace mock server with real Stripe integration
- [ ] Add proper authentication and user management
- [ ] Implement secure webhook signature verification
- [ ] Add production payment methods (Apple Pay, Google Pay)
- [ ] Set up proper error handling and logging
- [ ] Add subscription billing cycle management
- [ ] Implement proper customer database

### Environment Configuration

```javascript
// SubscriptionService.js
static getStripeConfig() {
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  return {
    baseURL: isDevelopment 
      ? 'http://localhost:3001/api/stripe'  // Mock server
      : 'https://your-api.com/api/stripe',  // Production API
    publishableKey: isDevelopment 
      ? 'pk_test_mock_publishable_key_123456789'  // Mock key
      : 'pk_live_your_live_key'  // Real Stripe key
  };
}
```

## 🐛 Troubleshooting

### Common Issues

**Mock server not starting:**
```bash
cd server
npm install
npm start
```

**App not connecting to server:**
- Check if server is running on port 3001
- Verify no firewall blocking localhost:3001
- Run health check: `curl http://localhost:3001/health`

**Subscription not updating:**
- Check AsyncStorage/SecureStore data
- Verify payment processing response
- Check console logs for errors

### Debug Commands

```bash
# Check server health
curl http://localhost:3001/health

# List available plans
curl http://localhost:3001/api/stripe/plans

# Test customer creation
curl -X POST http://localhost:3001/api/stripe/customers \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## 📈 Analytics & Monitoring

### Subscription Metrics

- Daily active users per tier
- Conversion rates (Free → Basic → Premium)
- Churn rates and cancellation reasons
- Feature usage by subscription tier

### Usage Tracking

- Song identification attempts per day
- MIDI download frequency
- Feature engagement by proficiency level
- Upgrade modal conversion rates

## 🎯 Next Steps

1. **Real Payment Integration**
   - Integrate actual Stripe API
   - Add Apple Pay / Google Pay
   - Implement billing portal

2. **Enhanced Features**
   - Family plans and sharing
   - Annual subscription discounts
   - Gift subscriptions

3. **Analytics & Insights**
   - User behavior tracking
   - A/B testing framework
   - Subscription optimization

4. **Platform Expansion**
   - Web app subscription management
   - Desktop app integration
   - API for third-party integrations

---

**🎵 Happy coding with SongSync!** 

For questions or issues, check the troubleshooting section or review the test outputs.

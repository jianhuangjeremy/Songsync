# Mock Stripe Server for SongSync

This is a mock Stripe server that simulates payment processing for the SongSync app's subscription system.

## Features

- **Mock Stripe API endpoints** - Simulates customer, subscription, and payment processing
- **Three subscription tiers** - Free, Basic ($10/month), Premium ($25/month)
- **Payment simulation** - Mock payment processing with realistic delays
- **Webhook support** - Receives and processes webhook events
- **Development-friendly** - No real payments, perfect for testing

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Mock Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Configuration
- `GET /api/stripe/config` - Get publishable key
- `GET /health` - Health check

### Customers
- `POST /api/stripe/customers` - Create customer
- `GET /api/stripe/customers/:id` - Get customer

### Payment Methods
- `POST /api/stripe/payment_methods` - Create payment method
- `POST /api/stripe/payment_methods/:id/attach` - Attach to customer

### Subscriptions
- `GET /api/stripe/plans` - Get available plans
- `POST /api/stripe/subscriptions` - Create subscription
- `GET /api/stripe/subscriptions/:id` - Get subscription
- `POST /api/stripe/subscriptions/:id` - Update subscription
- `DELETE /api/stripe/subscriptions/:id` - Cancel subscription

### Payments
- `POST /api/stripe/payment_intents` - Create payment intent
- `POST /api/stripe/payment_intents/:id/confirm` - Confirm payment

### Webhooks
- `POST /api/stripe/webhooks` - Receive webhook events

## Mock Data

### Subscription Plans

1. **Basic Plan**
   - ID: `price_mock_basic_plan`
   - Price: $10.00/month
   - Features: 10 daily IDs, no MIDI downloads

2. **Premium Plan**
   - ID: `price_mock_premium_plan`
   - Price: $25.00/month
   - Features: Unlimited IDs, MIDI downloads

### Test Payment Methods

The server accepts any payment method data and returns mock responses:

```javascript
{
  "type": "card",
  "card": {
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2025
  }
}
```

## Integration with SongSync App

The app's `SubscriptionService` automatically detects if running in development mode and uses this mock server:

```javascript
// Development: http://localhost:3001/api/stripe
// Production: https://your-production-api.com/api/stripe
```

## Testing Subscription Flow

1. **Start the mock server**: `npm run dev`
2. **Run the SongSync app** in development mode
3. **Test subscription features**:
   - Create new subscriptions
   - Upgrade/downgrade plans
   - Cancel subscriptions
   - Test payment failures

## Mock Responses

All endpoints return realistic Stripe-like responses:

```javascript
// Successful subscription creation
{
  "id": "sub_mock_1234567890_abcdef123",
  "customer": "cus_mock_1234567890_xyz789",
  "status": "active",
  "current_period_start": 1692000000,
  "current_period_end": 1694592000,
  "items": {
    "data": [{
      "price": {
        "id": "price_mock_basic_plan",
        "unit_amount": 1000,
        "currency": "usd"
      }
    }]
  }
}
```

## Environment Variables

You can customize the server with environment variables:

```bash
PORT=3001  # Server port (default: 3001)
```

## Production Notes

For production deployment:

1. Replace this mock server with real Stripe integration
2. Update the `SubscriptionService.getStripeConfig()` method
3. Add proper error handling and security
4. Implement real webhook signature verification
5. Add proper database storage for customer/subscription data

## Security

⚠️ **This is a mock server for development only!**

- No real payments are processed
- No sensitive data should be used
- All responses are simulated
- Don't deploy this to production

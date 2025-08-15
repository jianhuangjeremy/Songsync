const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock Stripe API endpoints
const MOCK_STRIPE_CONFIG = {
  publishableKey: 'pk_test_mock_publishable_key_123456789',
  secretKey: 'sk_test_mock_secret_key_123456789',
  webhookSecret: 'whsec_mock_webhook_secret_123456789'
};

// Mock customer database
const mockCustomers = new Map();
const mockSubscriptions = new Map();
const mockPaymentMethods = new Map();

// Helper function to generate mock IDs
const generateMockId = (prefix) => {
  return `${prefix}_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Mock Stripe Plans
const STRIPE_PLANS = {
  basic: {
    id: 'price_mock_basic_plan',
    product: 'prod_mock_songsync_basic',
    unit_amount: 1000, // $10.00 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      interval_count: 1
    },
    metadata: {
      name: 'Basic Plan',
      features: 'daily_limit:10,midi_download:false'
    }
  },
  premium: {
    id: 'price_mock_premium_plan',
    product: 'prod_mock_songsync_premium',
    unit_amount: 2500, // $25.00 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      interval_count: 1
    },
    metadata: {
      name: 'Premium Plan',
      features: 'daily_limit:unlimited,midi_download:true'
    }
  }
};

// Routes

// Get publishable key
app.get('/api/stripe/config', (req, res) => {
  res.json({
    publishableKey: MOCK_STRIPE_CONFIG.publishableKey
  });
});

// Create customer
app.post('/api/stripe/customers', (req, res) => {
  const { email, name } = req.body;
  
  const customer = {
    id: generateMockId('cus'),
    email,
    name,
    created: Math.floor(Date.now() / 1000),
    default_source: null,
    subscriptions: { data: [] }
  };
  
  mockCustomers.set(customer.id, customer);
  
  res.json(customer);
});

// Get customer
app.get('/api/stripe/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  const customer = mockCustomers.get(customerId);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json(customer);
});

// Create payment method
app.post('/api/stripe/payment_methods', (req, res) => {
  const { type, card } = req.body;
  
  const paymentMethod = {
    id: generateMockId('pm'),
    type,
    card: {
      brand: card?.brand || 'visa',
      last4: card?.last4 || '4242',
      exp_month: card?.exp_month || 12,
      exp_year: card?.exp_year || 2025
    },
    created: Math.floor(Date.now() / 1000)
  };
  
  mockPaymentMethods.set(paymentMethod.id, paymentMethod);
  
  res.json(paymentMethod);
});

// Attach payment method to customer
app.post('/api/stripe/payment_methods/:paymentMethodId/attach', (req, res) => {
  const { paymentMethodId } = req.params;
  const { customer } = req.body;
  
  const paymentMethod = mockPaymentMethods.get(paymentMethodId);
  
  if (!paymentMethod) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  
  paymentMethod.customer = customer;
  
  res.json(paymentMethod);
});

// Create subscription
app.post('/api/stripe/subscriptions', (req, res) => {
  const { customer, items, default_payment_method } = req.body;
  
  const priceId = items[0].price;
  const plan = Object.values(STRIPE_PLANS).find(p => p.id === priceId);
  
  if (!plan) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }
  
  const subscription = {
    id: generateMockId('sub'),
    customer,
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    items: {
      data: [{
        id: generateMockId('si'),
        price: plan,
        quantity: 1
      }]
    },
    default_payment_method,
    latest_invoice: {
      id: generateMockId('in'),
      status: 'paid',
      amount_paid: plan.unit_amount
    },
    metadata: {}
  };
  
  mockSubscriptions.set(subscription.id, subscription);
  
  // Update customer with subscription
  const customerData = mockCustomers.get(customer);
  if (customerData) {
    customerData.subscriptions.data.push(subscription);
  }
  
  res.json(subscription);
});

// Get subscription
app.get('/api/stripe/subscriptions/:subscriptionId', (req, res) => {
  const { subscriptionId } = req.params;
  const subscription = mockSubscriptions.get(subscriptionId);
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  res.json(subscription);
});

// Cancel subscription
app.delete('/api/stripe/subscriptions/:subscriptionId', (req, res) => {
  const { subscriptionId } = req.params;
  const subscription = mockSubscriptions.get(subscriptionId);
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  subscription.status = 'canceled';
  subscription.canceled_at = Math.floor(Date.now() / 1000);
  
  res.json(subscription);
});

// Update subscription
app.post('/api/stripe/subscriptions/:subscriptionId', (req, res) => {
  const { subscriptionId } = req.params;
  const { items } = req.body;
  
  const subscription = mockSubscriptions.get(subscriptionId);
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  if (items) {
    const priceId = items[0].price;
    const plan = Object.values(STRIPE_PLANS).find(p => p.id === priceId);
    
    if (plan) {
      subscription.items.data[0].price = plan;
    }
  }
  
  res.json(subscription);
});

// Create payment intent (for one-time payments)
app.post('/api/stripe/payment_intents', (req, res) => {
  const { amount, currency = 'usd', customer } = req.body;
  
  const paymentIntent = {
    id: generateMockId('pi'),
    amount,
    currency,
    status: 'requires_payment_method',
    customer,
    client_secret: `${generateMockId('pi')}_secret_mock`,
    created: Math.floor(Date.now() / 1000)
  };
  
  res.json(paymentIntent);
});

// Confirm payment intent
app.post('/api/stripe/payment_intents/:paymentIntentId/confirm', (req, res) => {
  const { paymentIntentId } = req.params;
  
  // Simulate payment processing
  setTimeout(() => {
    res.json({
      id: paymentIntentId,
      status: 'succeeded',
      amount_received: 1000,
      currency: 'usd'
    });
  }, 1000); // Simulate 1 second processing time
});

// Get available plans
app.get('/api/stripe/plans', (req, res) => {
  res.json({
    data: Object.values(STRIPE_PLANS)
  });
});

// Webhook endpoint (for testing)
app.post('/api/stripe/webhooks', (req, res) => {
  const event = req.body;
  
  console.log('Received webhook event:', event.type);
  
  // Simulate webhook processing
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object.id);
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription canceled:', event.data.object.id);
      break;
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
  
  res.json({ received: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Mock Stripe server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Stripe Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Stripe config: http://localhost:${PORT}/api/stripe/config`);
  console.log(`📋 Available plans: http://localhost:${PORT}/api/stripe/plans`);
});

module.exports = app;

import mongoose from 'mongoose';

/**
 * Subscription Model
 * Tracks all subscription events for revenue analytics
 */
const SubscriptionSchema = new mongoose.Schema({
  // Stripe IDs
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  stripeCustomerId: {
    type: String,
    required: true,
    index: true,
  },
  stripePriceId: {
    type: String,
  },
  stripeProductId: {
    type: String,
  },

  // Workspace reference
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },

  // Plan details
  plan: {
    type: String,
    enum: ['free', 'pro', 'business'],
    required: true,
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid'],
    required: true,
  },

  // Dates
  startDate: {
    type: Date,
    required: true,
  },
  currentPeriodStart: {
    type: Date,
  },
  currentPeriodEnd: {
    type: Date,
  },
  canceledAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },

  // Revenue tracking
  amount: {
    type: Number, // Amount in cents
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },

  // MRR calculation
  mrr: {
    type: Number, // Monthly Recurring Revenue in cents
    required: true,
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Calculate MRR based on plan and interval
SubscriptionSchema.statics.calculateMRR = function(amount, interval) {
  if (interval === 'yearly') {
    return Math.round(amount / 12);
  }
  return amount;
};

// Get total MRR across all active subscriptions
SubscriptionSchema.statics.getTotalMRR = async function() {
  const result = await this.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, totalMRR: { $sum: '$mrr' } } },
  ]);
  return result[0]?.totalMRR || 0;
};

// Get revenue analytics
SubscriptionSchema.statics.getRevenueAnalytics = async function() {
  const [
    totalMRR,
    activeCount,
    planBreakdown,
    intervalBreakdown,
    recentSubscriptions,
  ] = await Promise.all([
    // Total MRR
    this.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$mrr' } } },
    ]),
    
    // Active subscription count
    this.countDocuments({ status: 'active' }),
    
    // Breakdown by plan
    this.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$plan', count: { $sum: 1 }, mrr: { $sum: '$mrr' } } },
    ]),
    
    // Breakdown by interval
    this.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$billingInterval', count: { $sum: 1 } } },
    ]),
    
    // Recent subscriptions (last 30 days)
    this.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('workspaceId', 'name slug'),
  ]);

  return {
    totalMRR: totalMRR[0]?.total || 0,
    totalARR: (totalMRR[0]?.total || 0) * 12,
    activeSubscriptions: activeCount,
    planBreakdown: planBreakdown.reduce((acc, item) => {
      acc[item._id] = { count: item.count, mrr: item.mrr };
      return acc;
    }, {}),
    intervalBreakdown: intervalBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentSubscriptions,
  };
};

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;

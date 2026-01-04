import mongoose from 'mongoose';

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-z0-9-]+$/,
        'Slug can only contain lowercase letters, numbers, and hyphens',
      ],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Onboarding fields
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi'],
      default: 'en',
    },
    companySize: {
      type: String,
      enum: ['solo', '2-10', '11-50', '51-200', '201-500', '500+'],
      default: null,
    },
    team: {
      type: String,
      enum: ['product', 'engineering', 'design', 'marketing', 'sales', 'support', 'founder', 'other'],
      default: null,
    },
    // Billing - for Phase 5
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    // Settings
    settings: {
      // Branding
      logo: { type: String, default: null },
      primaryColor: { type: String, default: '#6366f1' },
      // Widget settings - for Phase 4
      widgetEnabled: { type: Boolean, default: false },
      widgetPosition: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
      widgetTheme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      allowAnonymousFeedback: { type: Boolean, default: true },
      // Public pages
      publicRoadmap: { type: Boolean, default: true },
      publicChangelog: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique slug from name
WorkspaceSchema.statics.generateUniqueSlug = async function (name) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Ensure slug is not empty
  if (!slug) {
    slug = 'workspace';
  }

  // Check if slug exists and append number if needed
  let uniqueSlug = slug;
  let counter = 1;
  
  while (await this.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

// Prevent model recompilation in development
const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);

export default Workspace;

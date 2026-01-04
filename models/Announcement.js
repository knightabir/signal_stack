import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: [20000, 'Content cannot exceed 20000 characters'],
    },
    // Publishing
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    // Linked items
    linkedFeedbackIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
    }],
    linkedRoadmapIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoadmapItem',
    }],
    // Author
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
AnnouncementSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
AnnouncementSchema.index({ workspaceId: 1, publishedAt: -1 });
AnnouncementSchema.index({ workspaceId: 1, isPublished: 1 });

// Generate slug from title
AnnouncementSchema.statics.generateSlug = async function (workspaceId, title) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  let slug = baseSlug;
  let counter = 1;

  // Check for uniqueness
  while (await this.findOne({ workspaceId, slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Pre-save hook to set publishedAt
AnnouncementSchema.pre('save', function () {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// Prevent model recompilation in development
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

export default Announcement;

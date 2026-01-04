import mongoose from 'mongoose';

// Feedback status options
export const FEEDBACK_STATUS = {
  NEW: 'new',
  UNDER_REVIEW: 'under_review',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
};

export const FEEDBACK_STATUS_LABELS = {
  [FEEDBACK_STATUS.NEW]: 'New',
  [FEEDBACK_STATUS.UNDER_REVIEW]: 'Under Review',
  [FEEDBACK_STATUS.PLANNED]: 'Planned',
  [FEEDBACK_STATUS.IN_PROGRESS]: 'In Progress',
  [FEEDBACK_STATUS.COMPLETED]: 'Completed',
  [FEEDBACK_STATUS.CLOSED]: 'Closed',
};

export const FEEDBACK_STATUS_COLORS = {
  [FEEDBACK_STATUS.NEW]: 'bg-blue-500',
  [FEEDBACK_STATUS.UNDER_REVIEW]: 'bg-yellow-500',
  [FEEDBACK_STATUS.PLANNED]: 'bg-purple-500',
  [FEEDBACK_STATUS.IN_PROGRESS]: 'bg-orange-500',
  [FEEDBACK_STATUS.COMPLETED]: 'bg-green-500',
  [FEEDBACK_STATUS.CLOSED]: 'bg-slate-500',
};

const FeedbackSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(FEEDBACK_STATUS),
      default: FEEDBACK_STATUS.NEW,
      index: true,
    },
    // Author info
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorEmail: {
      type: String,
      default: null,
    },
    authorName: {
      type: String,
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    // Moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    // Merge tracking
    mergedIntoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      default: null,
    },
    // Cached counts for performance
    voteCount: {
      type: Number,
      default: 0,
      index: true,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    // GitHub integration
    githubIssueUrl: {
      type: String,
      default: null,
    },
    githubIssueNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
FeedbackSchema.index({ workspaceId: 1, status: 1 });
FeedbackSchema.index({ workspaceId: 1, voteCount: -1 });
FeedbackSchema.index({ workspaceId: 1, createdAt: -1 });

// Virtual for checking if merged
FeedbackSchema.virtual('isMerged').get(function () {
  return !!this.mergedIntoId;
});

// Prevent model recompilation in development
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

export default Feedback;

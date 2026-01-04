import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    // Flag for admin/official responses
    isOfficial: {
      type: Boolean,
      default: false,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching comments by feedback
CommentSchema.index({ feedbackId: 1, createdAt: 1 });

// Static method to get threaded comments
CommentSchema.statics.getThreadedComments = async function (feedbackId) {
  const comments = await this.find({ feedbackId, isDeleted: false })
    .populate('authorId', 'name email image')
    .sort({ createdAt: 1 })
    .lean();

  // Build tree structure
  const commentMap = {};
  const rootComments = [];

  // First pass: create map
  comments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment._id.toString()] = comment;
  });

  // Second pass: build tree
  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap[comment.parentId.toString()];
      if (parent) {
        parent.replies.push(comment);
      } else {
        // Parent was deleted, treat as root
        rootComments.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
};

// Post-save hook to update feedback comment count
CommentSchema.post('save', async function () {
  if (!this.isDeleted) {
    const Feedback = mongoose.model('Feedback');
    const count = await this.constructor.countDocuments({
      feedbackId: this.feedbackId,
      isDeleted: false,
    });
    await Feedback.findByIdAndUpdate(this.feedbackId, { commentCount: count });
  }
});

// Prevent model recompilation in development
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default Comment;

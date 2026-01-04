import mongoose from 'mongoose';

const VoteSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // For anonymous vote tracking
    ipAddress: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one vote per user per feedback
VoteSchema.index({ feedbackId: 1, userId: 1 }, { unique: true, sparse: true });

// For anonymous votes - one per IP per feedback
VoteSchema.index({ feedbackId: 1, ipAddress: 1 }, { sparse: true });

// Static method to toggle vote
VoteSchema.statics.toggleVote = async function (feedbackId, userId, ipAddress) {
  const Feedback = mongoose.model('Feedback');

  // Check for existing vote
  const query = userId 
    ? { feedbackId, userId }
    : { feedbackId, ipAddress };

  const existingVote = await this.findOne(query);

  if (existingVote) {
    // Remove vote
    await this.findByIdAndDelete(existingVote._id);
    await Feedback.findByIdAndUpdate(feedbackId, { $inc: { voteCount: -1 } });
    return { voted: false };
  } else {
    // Add vote
    await this.create({
      feedbackId,
      userId: userId || null,
      ipAddress: userId ? null : ipAddress,
    });
    await Feedback.findByIdAndUpdate(feedbackId, { $inc: { voteCount: 1 } });
    return { voted: true };
  }
};

// Static method to check if user has voted
VoteSchema.statics.hasVoted = async function (feedbackId, userId, ipAddress) {
  const query = userId 
    ? { feedbackId, userId }
    : { feedbackId, ipAddress };

  const vote = await this.findOne(query);
  return !!vote;
};

// Prevent model recompilation in development
const Vote = mongoose.models.Vote || mongoose.model('Vote', VoteSchema);

export default Vote;
